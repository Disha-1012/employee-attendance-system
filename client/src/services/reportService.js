import api from "./api";


export const exportAttendanceReport = async ({
  startDate,
  endDate,
  status = "all"
}) => {
  const response = await api.get(
    "/reports/attendance/export",
    {
      params: {
        startDate,
        endDate,
        status
      },

      responseType: "blob"
    }
  );

  return response;
};
