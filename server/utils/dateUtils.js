/*
|--------------------------------------------------------------------------
| Attendance Date Utilities
|--------------------------------------------------------------------------
|
| We use Asia/Kolkata as the application's business timezone.
|
| attendanceDate is stored as:
|
| YYYY-MM-DD
|
| Example:
|
| 2026-09-01
|
| This makes daily attendance queries reliable even if
| the server is hosted in another timezone.
|--------------------------------------------------------------------------
*/

const TIME_ZONE =
  process.env.APP_TIMEZONE ||
  "Asia/Kolkata";

/*
|--------------------------------------------------------------------------
| Get Attendance Date Key
|--------------------------------------------------------------------------
*/

export const getAttendanceDate = (
  date = new Date()
) => {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(date);
};

/*
|--------------------------------------------------------------------------
| Get Current Time In Application Timezone
|--------------------------------------------------------------------------
*/

export const getCurrentTime = () => {
  return new Date();
};
