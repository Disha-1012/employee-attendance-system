import mongoose from "mongoose";

const attendanceSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Employee Reference
      |--------------------------------------------------------------------------
      */

      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      },

      /*
      |--------------------------------------------------------------------------
      | Employee ID
      |--------------------------------------------------------------------------
      |
      | Keeping employeeId here makes HR reports easier
      | and avoids unnecessary joins for common queries.
      |--------------------------------------------------------------------------
      */

      employeeId: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
      },

      /*
      |--------------------------------------------------------------------------
      | Attendance Date
      |--------------------------------------------------------------------------
      |
      | Stored as YYYY-MM-DD in Asia/Kolkata timezone.
      |--------------------------------------------------------------------------
      */

      attendanceDate: {
        type: String,
        required: true
      },

      /*
      |--------------------------------------------------------------------------
      | Check-In
      |--------------------------------------------------------------------------
      */

      checkIn: {
        type: Date,
        required: true
      },

      /*
      |--------------------------------------------------------------------------
      | Check-Out
      |--------------------------------------------------------------------------
      */

      checkOut: {
        type: Date,
        default: null
      },

      /*
      |--------------------------------------------------------------------------
      | Working Minutes
      |--------------------------------------------------------------------------
      */

      workingMinutes: {
        type: Number,
        default: 0,
        min: 0
      },

      /*
      |--------------------------------------------------------------------------
      | Attendance Status
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,
        enum: [
          "present",
          "late",
          "half-day",
          "absent",
          "leave"
        ],
        default: "present"
      },

      /*
      |--------------------------------------------------------------------------
      | Remarks
      |--------------------------------------------------------------------------
      */

      remarks: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
      }
    },
    {
      timestamps: true
    }
  );

/*
|--------------------------------------------------------------------------
| Prevent Multiple Attendance Records
| For Same Employee On Same Day
|--------------------------------------------------------------------------
*/

attendanceSchema.index(
  {
    employee: 1,
    attendanceDate: 1
  },
  {
    unique: true
  }
);

/*
|--------------------------------------------------------------------------
| HR Query Optimization
|--------------------------------------------------------------------------
*/

attendanceSchema.index({
  attendanceDate: 1,
  status: 1
});

attendanceSchema.index({
  employee: 1,
  createdAt: -1
});

const Attendance =
  mongoose.model(
    "Attendance",
    attendanceSchema
  );

export default Attendance;
