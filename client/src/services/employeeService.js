import api from "./api";


/*
|--------------------------------------------------------------------------
| Get Employees
|--------------------------------------------------------------------------
*/

export const getEmployees =
  async ({
    search = "",
    department = "",
    status = "all",
    page = 1,
    limit = 10
  } = {}) => {

    const response =
      await api.get(
        "/employees",
        {
          params: {
            search,
            department,
            status,
            page,
            limit
          }
        }
      );

    return response.data;
  };


/*
|--------------------------------------------------------------------------
| Get Employee Details
|--------------------------------------------------------------------------
*/

export const getEmployeeById =
  async (id) => {

    const response =
      await api.get(
        `/employees/${id}`
      );

    return response.data;
  };


/*
|--------------------------------------------------------------------------
| Activate / Deactivate
|--------------------------------------------------------------------------
*/

export const updateEmployeeStatus =
  async (
    id,
    isActive
  ) => {

    const response =
      await api.patch(
        `/employees/${id}/status`,
        {
          isActive
        }
      );

    return response.data;
  };