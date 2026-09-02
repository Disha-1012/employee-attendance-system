import api from "./api";


/*
|--------------------------------------------------------------------------
| Get HR Dashboard Analytics
|--------------------------------------------------------------------------
*/

export const getHRDashboardAnalytics =
  async (
    params = {}
  ) => {

    const response =
      await api.get(
        "/analytics/hr-dashboard",
        {
          params
        }
      );


    return response.data;

  };