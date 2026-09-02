import { useEffect, useState } from "react";

const useLiveWorkingMinutes = (
  checkIn,
  checkOut,
  initialWorkingMinutes = 0
) => {

  const calculateWorkingMinutes = () => {

    /*
    |--------------------------------------------------------------------------
    | No attendance
    |--------------------------------------------------------------------------
    */

    if (!checkIn) {
      return 0;
    }


    /*
    |--------------------------------------------------------------------------
    | Already checked out
    |--------------------------------------------------------------------------
    |
    | Once checkout exists, the backend value becomes the final value.
    |
    */

    if (checkOut) {
      return Number(initialWorkingMinutes) || 0;
    }


    /*
    |--------------------------------------------------------------------------
    | Employee is currently working
    |--------------------------------------------------------------------------
    |
    | Calculate:
    |
    | Current Time - Check In Time
    |
    */

    const checkInTime =
      new Date(checkIn).getTime();

    const currentTime =
      Date.now();


    if (
      Number.isNaN(checkInTime) ||
      currentTime < checkInTime
    ) {
      return 0;
    }


    return Math.floor(
      (currentTime - checkInTime) / 60000
    );

  };


  const [
    workingMinutes,
    setWorkingMinutes
  ] = useState(
    calculateWorkingMinutes()
  );


  useEffect(() => {

    /*
    |--------------------------------------------------------------------------
    | Calculate immediately
    |--------------------------------------------------------------------------
    */

    setWorkingMinutes(
      calculateWorkingMinutes()
    );


    /*
    |--------------------------------------------------------------------------
    | No timer needed after checkout
    |--------------------------------------------------------------------------
    */

    if (!checkIn || checkOut) {
      return undefined;
    }


    /*
    |--------------------------------------------------------------------------
    | Update every second
    |--------------------------------------------------------------------------
    */

    const interval =
      setInterval(() => {

        setWorkingMinutes(
          calculateWorkingMinutes()
        );

      }, 1000);


    /*
    |--------------------------------------------------------------------------
    | Cleanup
    |--------------------------------------------------------------------------
    */

    return () => {

      clearInterval(interval);

    };

  }, [
    checkIn,
    checkOut,
    initialWorkingMinutes
  ]);


  return workingMinutes;

};


export default useLiveWorkingMinutes;
