import Leave from "../models/Leave.js";
import User from "../models/User.js";


/*
|--------------------------------------------------------------------------
| Helper: Calculate Number Of Days
|--------------------------------------------------------------------------
*/

const calculateLeaveDays = (
  startDate,
  endDate
) => {

  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );


  const difference =
    end.getTime() -
    start.getTime();


  return (
    Math.floor(
      difference /
      (1000 * 60 * 60 * 24)
    ) + 1
  );

};


/*
|--------------------------------------------------------------------------
| Helper: Validate Date Format
|--------------------------------------------------------------------------
*/

const isValidDateFormat = (
  date
) => {

  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  );

};


/*
|--------------------------------------------------------------------------
| Helper: Validate MongoDB ObjectId
|--------------------------------------------------------------------------
*/

const isValidObjectId = (
  id
) => {

  return (
    typeof id === "string" &&
    /^[0-9a-fA-F]{24}$/.test(
      id
    )
  );

};


/*
|--------------------------------------------------------------------------
| Employee: Apply For Leave
|--------------------------------------------------------------------------
*/

export const applyLeave =
  async (req, res) => {

    try {

      const user =
        req.user;


      const {
        leaveType = "paid",
        startDate,
        endDate,
        reason
      } = req.body || {};


      /*
      |--------------------------------------------------------------------------
      | Validate Required Fields
      |--------------------------------------------------------------------------
      */

      if (
        !startDate ||
        !endDate ||
        !reason
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Start date, end date and reason are required"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Validate Date Format
      |--------------------------------------------------------------------------
      */

      if (
        !isValidDateFormat(
          startDate
        ) ||
        !isValidDateFormat(
          endDate
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid date format. Use YYYY-MM-DD"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Validate Date Range
      |--------------------------------------------------------------------------
      */

      if (
        startDate >
        endDate
      ) {

        return res.status(400).json({

          success: false,

          message:
            "End date must be on or after start date"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Validate Leave Type
      |--------------------------------------------------------------------------
      */

      if (
        ![
          "paid",
          "unpaid"
        ].includes(
          leaveType
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid leave type"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Calculate Leave Days
      |--------------------------------------------------------------------------
      */

      const totalDays =
        calculateLeaveDays(
          startDate,
          endDate
        );


      if (
        totalDays <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid leave duration"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Check Overlapping Leave
      |--------------------------------------------------------------------------
      */

      const overlappingLeave =
        await Leave.findOne({

          employee:
            user._id,

          status: {
            $in: [
              "pending",
              "approved"
            ]
          },

          startDate: {
            $lte: endDate
          },

          endDate: {
            $gte: startDate
          }

        });


      if (
        overlappingLeave
      ) {

        return res.status(409).json({

          success: false,

          message:
            "You already have a pending or approved leave for this date range"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Check Paid Leave Balance
      |--------------------------------------------------------------------------
      */

      if (
        leaveType === "paid"
      ) {

        const paidLeaveQuota =
          user.paidLeaveQuota ?? 0;


        const approvedPaidLeave =
          await Leave.aggregate([

            {
              $match: {

                employee:
                  user._id,

                leaveType:
                  "paid",

                status:
                  "approved"

              }

            },

            {

              $group: {

                _id: null,

                total: {

                  $sum:
                    "$totalDays"

                }

              }

            }

          ]);


        const usedPaidLeave =
          approvedPaidLeave[0]
            ?.total || 0;


        const pendingPaidLeave =
          await Leave.aggregate([

            {
              $match: {

                employee:
                  user._id,

                leaveType:
                  "paid",

                status:
                  "pending"

              }

            },

            {

              $group: {

                _id: null,

                total: {

                  $sum:
                    "$totalDays"

                }

              }

            }

          ]);


        const pendingDays =
          pendingPaidLeave[0]
            ?.total || 0;


        const remainingBalance =
          paidLeaveQuota -
          usedPaidLeave -
          pendingDays;


        if (
          totalDays >
          remainingBalance
        ) {

          return res.status(400).json({

            success: false,

            message:
              `Insufficient paid leave balance. Remaining available balance: ${Math.max(
                remainingBalance,
                0
              )} day(s)`

          });

        }

      }


      /*
      |--------------------------------------------------------------------------
      | Create Leave
      |--------------------------------------------------------------------------
      */

      const leave =
        await Leave.create({

          employee:
            user._id,

          employeeId:
            user.employeeId,

          leaveType,

          startDate,

          endDate,

          totalDays,

          reason,

          status:
            "pending"

        });


      /*
      |--------------------------------------------------------------------------
      | Populate Employee
      |--------------------------------------------------------------------------
      */

      await leave.populate(

        "employee",

        "name email employeeId department designation"

      );


      return res.status(201).json({

        success: true,

        message:
          "Leave application submitted successfully",

        leave

      });

    } catch (error) {

      console.error(
        "Apply leave error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to apply for leave"

      });

    }

  };


/*
|--------------------------------------------------------------------------
| Employee: Get My Leave Requests
|--------------------------------------------------------------------------
*/

export const getMyLeaves =
  async (req, res) => {

    try {

      const user =
        req.user;


      const leaves =
        await Leave.find({

          employee:
            user._id

        })
          .populate(

            "reviewedBy",

            "name email"

          )
          .sort({

            createdAt:
              -1

          });


      return res.status(200).json({

        success: true,

        leaves

      });

    } catch (error) {

      console.error(
        "Get my leaves error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch leave history"

      });

    }

  };


/*
|--------------------------------------------------------------------------
| Employee: Cancel Pending Leave
|--------------------------------------------------------------------------
*/

export const cancelLeave =
  async (req, res) => {

    try {

      const user =
        req.user;


      const {
        id
      } = req.params;


      /*
      |--------------------------------------------------------------------------
      | Validate Leave ID
      |--------------------------------------------------------------------------
      */

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid leave ID"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Find Leave
      |--------------------------------------------------------------------------
      */

      const leave =
        await Leave.findOne({

          _id:
            id,

          employee:
            user._id

        });


      if (!leave) {

        return res.status(404).json({

          success: false,

          message:
            "Leave request not found"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Only Pending Leave Can Be Cancelled
      |--------------------------------------------------------------------------
      */

      if (
        leave.status !==
        "pending"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Only pending leave requests can be cancelled"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Cancel Leave
      |--------------------------------------------------------------------------
      */

      leave.status =
        "cancelled";


      await leave.save();


      return res.status(200).json({

        success: true,

        message:
          "Leave request cancelled successfully",

        leave

      });

    } catch (error) {

      console.error(
        "Cancel leave error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to cancel leave request"

      });

    }

  };


/*
|--------------------------------------------------------------------------
| HR: Get All Leave Requests
|--------------------------------------------------------------------------
*/

export const getAllLeaves =
  async (req, res) => {

    try {

      const {
        status,
        page = 1,
        limit = 10
      } = req.query;


      const pageNumber =
        Math.max(
          Number(page),
          1
        );


      const limitNumber =
        Math.min(

          Math.max(
            Number(limit),
            1
          ),

          50

        );


      const skip =
        (
          pageNumber - 1
        ) *
        limitNumber;


      const filter = {};


      /*
      |--------------------------------------------------------------------------
      | Status Filter
      |--------------------------------------------------------------------------
      */

      if (
        status &&
        [
          "pending",
          "approved",
          "rejected",
          "cancelled"
        ].includes(
          status
        )
      ) {

        filter.status =
          status;

      }


      const [
        leaves,
        total
      ] = await Promise.all([

        Leave.find(
          filter
        )
          .populate(

            "employee",

            "name email employeeId department designation"

          )
          .populate(

            "reviewedBy",

            "name email"

          )
          .sort({

            createdAt:
              -1

          })
          .skip(
            skip
          )
          .limit(
            limitNumber
          ),

        Leave.countDocuments(
          filter
        )

      ]);


      return res.status(200).json({

        success: true,

        leaves,

        pagination: {

          page:
            pageNumber,

          limit:
            limitNumber,

          total,

          totalPages:
            Math.ceil(
              total /
              limitNumber
            )

        }

      });

    } catch (error) {

      console.error(
        "Get all leaves error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to fetch leave requests"

      });

    }

  };


/*
|--------------------------------------------------------------------------
| HR: Approve Leave
|--------------------------------------------------------------------------
*/

export const approveLeave =
  async (req, res) => {

    try {

      const hrUser =
        req.user;


      const {
        id
      } = req.params;


      /*
      |--------------------------------------------------------------------------
      | Validate Leave ID
      |--------------------------------------------------------------------------
      */

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid leave ID"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Find Leave
      |--------------------------------------------------------------------------
      */

      const leave =
        await Leave.findById(
          id
        );


      if (!leave) {

        return res.status(404).json({

          success: false,

          message:
            "Leave request not found"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Only Pending Leave Can Be Approved
      |--------------------------------------------------------------------------
      */

      if (
        leave.status !==
        "pending"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Only pending leave requests can be approved"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Verify Employee
      |--------------------------------------------------------------------------
      */

      const employee =
        await User.findById(
          leave.employee
        );


      if (!employee) {

        return res.status(404).json({

          success: false,

          message:
            "Employee not found"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Check Paid Leave Balance Again
      |--------------------------------------------------------------------------
      */

      if (
        leave.leaveType ===
        "paid"
      ) {

        const approvedPaidLeave =
          await Leave.aggregate([

            {
              $match: {

                employee:
                  leave.employee,

                leaveType:
                  "paid",

                status:
                  "approved"

              }

            },

            {

              $group: {

                _id: null,

                total: {

                  $sum:
                    "$totalDays"

                }

              }

            }

          ]);


        const usedPaidLeave =
          approvedPaidLeave[0]
            ?.total || 0;


        const paidLeaveQuota =
          employee.paidLeaveQuota ??
          0;


        const remainingBalance =
          paidLeaveQuota -
          usedPaidLeave;


        if (
          leave.totalDays >
          remainingBalance
        ) {

          return res.status(400).json({

            success: false,

            message:
              `Cannot approve leave. Remaining paid leave balance: ${Math.max(
                remainingBalance,
                0
              )} day(s)`

          });

        }

      }


      /*
      |--------------------------------------------------------------------------
      | Approve Leave
      |--------------------------------------------------------------------------
      */

      leave.status =
        "approved";


      leave.reviewedBy =
        hrUser._id;


      leave.reviewedAt =
        new Date();


      leave.rejectionReason =
        "";


      await leave.save();


      await leave.populate(

        "employee",

        "name email employeeId department designation"

      );


      return res.status(200).json({

        success: true,

        message:
          "Leave approved successfully",

        leave

      });

    } catch (error) {

      console.error(
        "Approve leave error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to approve leave"

      });

    }

  };


/*
|--------------------------------------------------------------------------
| HR: Reject Leave
|--------------------------------------------------------------------------
*/

export const rejectLeave =
  async (req, res) => {

    try {

      const hrUser =
        req.user;


      const {
        id
      } = req.params;


      /*
      |--------------------------------------------------------------------------
      | Validate Leave ID
      |--------------------------------------------------------------------------
      */

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid leave ID"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Read Request Body Safely
      |--------------------------------------------------------------------------
      */

      const {
        rejectionReason
      } = req.body || {};


      /*
      |--------------------------------------------------------------------------
      | Find Leave
      |--------------------------------------------------------------------------
      */

      const leave =
        await Leave.findById(
          id
        );


      if (!leave) {

        return res.status(404).json({

          success: false,

          message:
            "Leave request not found"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Only Pending Leave Can Be Rejected
      |--------------------------------------------------------------------------
      */

      if (
        leave.status !==
        "pending"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Only pending leave requests can be rejected"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Validate Rejection Reason
      |--------------------------------------------------------------------------
      */

      if (
        typeof rejectionReason !==
          "string" ||
        !rejectionReason.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Rejection reason is required"

        });

      }


      /*
      |--------------------------------------------------------------------------
      | Reject Leave
      |--------------------------------------------------------------------------
      */

      leave.status =
        "rejected";


      leave.reviewedBy =
        hrUser._id;


      leave.reviewedAt =
        new Date();


      leave.rejectionReason =
        rejectionReason.trim();


      await leave.save();


      await leave.populate(

        "employee",

        "name email employeeId department designation"

      );


      return res.status(200).json({

        success: true,

        message:
          "Leave rejected successfully",

        leave

      });

    } catch (error) {

      console.error(
        "Reject leave error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to reject leave"

      });

    }

  };

  /*
    |--------------------------------------------------------------------------
    | Get Leave Summary
    |--------------------------------------------------------------------------
    |
    | HR only
    |
    | GET /api/leaves/summary
    |
    */

    export const getLeaveSummary = async (
    req,
    res
    ) => {

    try {

        const [
        total,
        pending,
        approved,
        rejected,
        cancelled
        ] = await Promise.all([

        Leave.countDocuments(),

        Leave.countDocuments({
            status: "pending"
        }),

        Leave.countDocuments({
            status: "approved"
        }),

        Leave.countDocuments({
            status: "rejected"
        }),

        Leave.countDocuments({
            status: "cancelled"
        })

        ]);


        return res.status(200).json({

        success: true,

        summary: {
            total,
            pending,
            approved,
            rejected,
            cancelled
        }

        });

    } catch (error) {

        console.error(
        "Leave summary error:",
        error
        );

        return res.status(500).json({

        success: false,

        message:
            "Unable to fetch leave summary."

        });

    }

    };
