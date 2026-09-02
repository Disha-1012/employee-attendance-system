import api from "./api";

export const getHRAttendance = async (
  date
) => {

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