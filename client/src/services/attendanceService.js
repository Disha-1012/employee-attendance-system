import api from "./api";

/*
|--------------------------------------------------------------------------
| Check In
|--------------------------------------------------------------------------
*/

export const checkIn =
  async () => {
    const response =
      await api.post(
        "/attendance/check-in"
      );

    return response.data;
  };

/*
|--------------------------------------------------------------------------
| Check Out
|--------------------------------------------------------------------------
*/

export const checkOut =
  async () => {
    const response =
      await api.post(
        "/attendance/check-out"
      );

    return response.data;
  };

/*
|--------------------------------------------------------------------------
| Get Today's Attendance
|--------------------------------------------------------------------------
*/

export const getTodayAttendance =
  async () => {
    const response =
      await api.get(
        "/attendance/today"
      );

    return response.data;
  };

/*
|--------------------------------------------------------------------------
| Get Employee Attendance History
|--------------------------------------------------------------------------
*/

export const getMyAttendance =
  async (
    page = 1,
    limit = 10
  ) => {
    const response =
      await api.get(
        "/attendance/my-history",
        {
          params: {
            page,
            limit
          }
        }
      );

    return response.data;
  };

/*
|--------------------------------------------------------------------------
| HR Attendance
|--------------------------------------------------------------------------
*/

export const getHRAttendance =
  async (date) => {
    const response =
      await api.get(
        "/attendance/hr",
        {
          params: {
            date
          }
        }
      );

    return response.data;
  };

export const getEmployeeAttendanceSummary = async (params = {}) => {
  const response = await api.get(
    "/attendance/hr/summary",
    {
      params
    }
  );

  return response.data;
};

export const getMonthlyAttendanceReport = async (
  params = {}
) => {

  const response =
    await api.get(
      "/attendance/hr/monthly-report",
      {
        params
      }
    );

  return response.data;

};