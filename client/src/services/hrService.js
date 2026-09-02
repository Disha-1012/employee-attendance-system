import api from "./api";

/*
|--------------------------------------------------------------------------
| HR: Get Attendance For Today
|--------------------------------------------------------------------------
*/

export const getTodayAttendanceForHR = async () => {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const response =
    await api.get(
      "/attendance/hr",
      {
        params: {
          date: today
        }
      }
    );

  return response.data;
};