import api from "./api";


/*
|--------------------------------------------------------------------------
| Employee: Apply For Leave
|--------------------------------------------------------------------------
*/

export const applyLeave =
  async (leaveData) => {

    const response =
      await api.post(
        "/leaves",
        leaveData
      );

    return response.data;

  };


/*
|--------------------------------------------------------------------------
| Employee: Get My Leaves
|--------------------------------------------------------------------------
*/

export const getMyLeaves =
  async () => {

    const response =
      await api.get(
        "/leaves/my"
      );

    return response.data;

  };


/*
|--------------------------------------------------------------------------
| Employee: Cancel Leave
|--------------------------------------------------------------------------
*/

export const cancelLeave =
  async (id) => {

    if (
      !id ||
      id === ":id"
    ) {

      throw new Error(
        "Invalid leave ID"
      );

    }


    const response =
      await api.patch(
        `/leaves/${id}/cancel`
      );

    return response.data;

  };

/*
|--------------------------------------------------------------------------
| HR Leave APIs
|--------------------------------------------------------------------------
*/


/*
  Get all leave requests

  GET /api/leaves

  Optional params:

  {
    status,
    page,
    limit
  }
*/



/*
|--------------------------------------------------------------------------
| HR: Get All Leaves
|--------------------------------------------------------------------------
*/

export const getAllLeaves =
  async (
    params = {}
  ) => {

    const response =
      await api.get(
        "/leaves",
        {
          params
        }
      );

    return response.data;

  };

/*
  Get leave summary

  GET /api/leaves/summary
*/

export const getLeaveSummary =
  async () => {

    const response =
      await api.get(
        "/leaves/summary"
      );

    return response.data;

  };


/*
|--------------------------------------------------------------------------
| HR: Approve Leave
|--------------------------------------------------------------------------
*/

export const approveLeave =
  async (id) => {

    if (
      !id ||
      id === ":id"
    ) {

      throw new Error(
        "Invalid leave ID"
      );

    }


    const response =
      await api.patch(
        `/leaves/${id}/approve`
      );

    return response.data;

  };


/*
|--------------------------------------------------------------------------
| HR: Reject Leave
|--------------------------------------------------------------------------
*/

export const rejectLeave =
  async (
    id,
    rejectionReason
  ) => {

    if (
      !id ||
      id === ":id"
    ) {

      throw new Error(
        "Invalid leave ID"
      );

    }


    const response =
      await api.patch(

        `/leaves/${id}/reject`,

        {
          rejectionReason
        }

      );

    return response.data;

  };

export const getMyLeaveBalance =
  async () => {

    const response =
      await api.get(
        "/leaves/balance"
      );

    return response.data;

  };