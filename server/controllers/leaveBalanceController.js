import Leave from "../models/Leave.js";


const ANNUAL_PAID_LEAVE_QUOTA = 12;


/*
|--------------------------------------------------------------------------
| Calculate Used Leave
|--------------------------------------------------------------------------
*/

const calculateUsedLeave = (
  leaves,
  leaveType
) => {

  return leaves
    .filter(
      (leave) =>
        leave.leaveType ===
        leaveType
    )
    .reduce(
      (
        total,
        leave
      ) =>
        total +
        (
          Number(
            leave.totalDays
          ) || 0
        ),
      0
    );

};


/*
|--------------------------------------------------------------------------
| Get My Leave Balance
|--------------------------------------------------------------------------
*/

export const getMyLeaveBalance =
  async (
    req,
    res
  ) => {

    try {

      const leaves =
        await Leave.find({

          employee:
            req.user._id,

          status: "approved"

        })
          .select(
            "leaveType totalDays startDate endDate"
          )
          .sort({
            startDate: -1
          })
          .lean();


      const usedPaidLeave =
        calculateUsedLeave(
          leaves,
          "paid"
        );


      const usedUnpaidLeave =
        calculateUsedLeave(
          leaves,
          "unpaid"
        );


      const remainingPaidLeave =
        Math.max(
          ANNUAL_PAID_LEAVE_QUOTA -
          usedPaidLeave,
          0
        );


      return res.status(200).json({

        success: true,

        balance: {

          annualPaidLeave:
            ANNUAL_PAID_LEAVE_QUOTA,

          usedPaidLeave,

          remainingPaidLeave,

          usedUnpaidLeave

        }

      });

    } catch (error) {

      console.error(
        "Leave balance error:",
        error
      );


      return res.status(500).json({

        message:
          "Failed to calculate leave balance."

      });

    }

  };
