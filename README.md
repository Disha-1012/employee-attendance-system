# Attendify

### Employee Attendance Management System

Attendify is a full-stack **MERN-based Employee Attendance Management System** designed to simplify employee attendance tracking, working-hour calculation, leave management, HR administration, analytics, and attendance reporting.

---

## 📌 Overview

Traditional attendance management can involve manual tracking, scattered records, and time-consuming HR operations.

**Attendify** provides a centralized web application where employees can manage their attendance and leave, while HR users can monitor employees, manage attendance, approve leave requests, analyze attendance data, and generate reports.

The system provides separate role-based experiences for:

- 👨‍💻 Employees
- 🧑‍💼 HR Administrators

---

# ✨ Features

## 👨‍💻 Employee Features

### 🔐 Authentication

- Secure employee registration
- Secure login
- JWT-based authentication
- Role-based access control
- Protected routes
- Password hashing using bcrypt

### ⏱️ Attendance Management

- Employee check-in
- Employee check-out
- Live working-hours tracking
- Automatic working-hours calculation
- Attendance status tracking
- Today's attendance information
- Attendance history
- Server-side attendance calculations

### 🏖️ Leave Management

Employees can:

- Apply for paid leave
- Apply for unpaid leave
- View leave history
- Track leave request status
- Cancel pending leave requests
- View paid leave balance
- View annual paid leave quota
- View approved paid leave usage
- Automatically see remaining paid leave balance

Approved leave is integrated with attendance records.

Employees on approved leave cannot check in for the corresponding leave date.

---

## 🧑‍💼 HR Features

### 📊 HR Dashboard

- HR dashboard
- Total employee count
- Present employee count
- Late employee count
- Attendance overview
- Quick access to HR management features

### 👥 Employee Management

- View employees
- Search employees
- Filter employees by department
- Filter employees by account status
- View employee details
- Activate employees
- Deactivate employees

### ⏱️ Attendance Management

- Monitor employee attendance
- Filter attendance by date
- Filter attendance by status
- View employee-wise attendance
- View attendance summaries
- View monthly attendance information

### 🏖️ Leave Management

HR can:

- View all leave requests
- Filter leave requests
- Approve leave requests
- Reject leave requests
- Provide rejection reasons
- Monitor employee leave history
- Manage pending leave applications

### 📈 Attendance Analytics

The system provides attendance insights including:

- Total employees
- Present employees
- Late employees
- Half-day employees
- Employees on leave
- Absence information
- Attendance rate
- Working hours
- Average working hours
- Department-wise attendance
- Attendance trends

### 📄 Attendance Reports

HR users can export attendance information as CSV.

Reports can be generated using attendance filters such as:

- Date
- Attendance status

This allows HR users to use attendance information outside the application for further analysis or record keeping.

---

# 🔐 Security Features

Attendify implements several security practices:

- JWT-based authentication
- Password hashing using `bcryptjs`
- Protected API routes
- Role-based authorization
- Environment variable configuration
- Server-side attendance calculations
- Backend input validation
- Restricted HR functionality
- Environment files excluded from version control

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- React Router
- Axios
- Lucide React
- Recharts
- CSS

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs

## Database

- MongoDB Atlas

## Architecture

- MERN Stack
- RESTful API
- Client-Server Architecture
- Role-Based Access Control

---

# 🏗️ System Architecture

```text
                         ┌───────────────────┐
                         │       User        │
                         │   Employee / HR   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  React Frontend   │
                         │       Vite        │
                         └─────────┬─────────┘
                                   │
                                 Axios
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Express REST    │
                         │       API         │
                         └─────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       Authentication         Attendance             Leave
       & Authorization          System             Management
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   MongoDB Atlas   │
                         └───────────────────┘

```
# 📂 Project Structure
Attendify/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   ├── server.js
│   └── .env.example
│
├── .gitignore
└── README.md

## 🗄️ Database Design

Attendify uses MongoDB Atlas as its database.

👤 User Collection

Stores employee and HR account information including:

Name
Employee ID
Email
Password
Role
Department
Designation
Account status
Leave-related information
⏱️ Attendance Collection

Stores:

Employee
Employee ID
Attendance date
Check-in time
Check-out time
Working minutes
Attendance status
Remarks
🏖️ Leave Collection

Stores:

Employee
Employee ID
Leave type
Start date
End date
Total days
Reason
Leave status
HR reviewer
Review timestamp
Rejection reason
🔐 Authentication & Authorization

Attendify implements JWT-based authentication with role-based authorization.

                         Login
                           │
                           ▼
                  Verify Credentials
                           │
                           ▼
                      Generate JWT
                           │
                           ▼
                 Authenticated Request
                           │
                           ▼
                      Verify JWT
                           │
                           ▼
                   Check User Role
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
             Employee                HR
                 │                   │
                 ▼                   ▼
        Employee Resources      HR Resources

Passwords are securely hashed using bcryptjs before being stored in the database.

⏱️ Attendance Management

Employees can check in and check out through the attendance system.

The application records:

Check-in timestamp
Check-out timestamp
Working duration
Attendance status

Working hours are calculated using timestamps rather than relying on a manually entered value.

🕐 Live Working Hours

When an employee checks in, the dashboard displays a live working-hours counter.

Check-In
   │
   ▼
Server records timestamp
   │
   ▼
React receives check-in time
   │
   ▼
Live elapsed-time calculation
   │
   ├── 00:01
   ├── 00:02
   ├── 00:03
   ├── 00:04
   └── ...
   │
   ▼
Check-Out
   │
   ▼
Final backend working time

The frontend timer is used only for the live display.

The backend remains responsible for calculating and storing the final working duration.

This prevents the frontend timer from becoming the source of truth for attendance records.

📊 Attendance Status

Attendify supports attendance statuses such as:

Present
Late
Half-Day
Leave

Attendance status is determined using backend attendance logic.

🏖️ Leave Management

Attendify provides a complete leave management workflow for both employees and HR administrators.

Employee Leave Workflow
Employee
   │
   ▼
Apply for Leave
   │
   ▼
Pending
   │
   ├───────────────┐
   ▼               ▼
Approved         Rejected
   │               │
   ▼               ▼
Leave Applied    Request Closed

Employees can apply for:

Paid leave
Unpaid leave

Employees can also:

View leave history
Track request status
Cancel pending requests
View paid leave balance
View annual paid leave quota
Track approved paid leave usage
💰 Paid Leave Balance

The application calculates the remaining paid leave based on the employee's allocated quota and leave requests.

The balance considers:

Remaining Paid Leave
        =
Paid Leave Quota
        -
Approved Paid Leave
        -
Pending Paid Leave

This ensures that pending paid leave applications are also considered when determining the available balance.

If an employee has no remaining paid leave, the system prevents the employee from submitting another paid leave request.

👩‍💼 HR Leave Workflow

HR administrators can:

View all employee leave requests
Review pending requests
Approve leave
Reject leave
Provide rejection reasons
Monitor leave status
🔗 Leave & Attendance Integration

Approved leave is integrated into attendance views without creating artificial attendance documents.

Employees on approved leave cannot check in for the corresponding leave date.

📈 HR Analytics

The HR dashboard provides attendance insights including:

Total employees
Present employees
Late employees
Half-day employees
Employees on leave
Absence information
Attendance rate
Working hours
Average working hours
Department attendance
Attendance trends
📊 Visualizations

The application uses Recharts for data visualization.

# Visualizations include:

Attendance distribution
Department attendance rate
Department working hours
Attendance trends
📄 Attendance Reports

HR users can export attendance information as CSV.

Reports can be generated using attendance filters such as:

Date
Attendance status

The exported reports can be used for:

HR record keeping
Attendance analysis
Monthly reporting
External data analysis
🔌 API Overview
🔐 Authentication
POST /api/auth/register
POST /api/auth/login
⏱️ Attendance
POST /api/attendance/check-in
PATCH /api/attendance/check-out
GET /api/attendance/today
GET /api/attendance/my
👥 Employees
GET /api/employees
GET /api/employees/:id
PATCH /api/employees/:id/status
🏖️ Leave
Employee
POST /api/leaves
GET /api/leaves/my
GET /api/leaves/balance
PATCH /api/leaves/:id/cancel
HR
GET /api/leaves
PATCH /api/leaves/:id/approve
PATCH /api/leaves/:id/reject
📈 Analytics
GET /api/analytics/...
📄 Reports
GET /api/reports/attendance/export

The exact endpoint parameters, request bodies, authentication requirements, and filters are implemented in the backend route and controller files.

## 🚀 Getting Started
Prerequisites

Install the following before running Attendify:

Node.js
npm
MongoDB Atlas account
Git
# 1. Clone the Repository
git clone https://github.com/YOUR_USERNAME/Attendify.git

Navigate into the project:

cd Attendify
# 2. Install Frontend Dependencies

Open a terminal and run:

cd client
npm install
# 3. Configure Frontend Environment Variables

Create a .env file inside the client directory:

client/.env

Use:

client/.env.example

as a reference.

Configure the required frontend environment variables according to the project configuration.

# 4. Install Backend Dependencies

Open another terminal and run:

cd server
npm install
# 5. Configure Backend Environment Variables

Create:

server/.env

Use:

server/.env.example

as a reference.

You will need to configure values such as:

MongoDB connection string
JWT secret
Server configuration

Never commit your .env files or secret credentials to GitHub.

# 6. Start the Backend

From the server directory:

npm run dev

The backend runs on:

http://localhost:5000
# 7. Start the Frontend

Open another terminal.

Navigate to the client directory:

cd client
npm run dev

The frontend runs on:

http://localhost:5173
👥 User Roles
Employee

# Employees can:

Register
Log in
Check in
Check out
Track live working hours
View attendance history
Apply for paid leave
Apply for unpaid leave
View leave balance
Cancel pending leave requests
Track leave request status
HR

# HR users can:

Log in
Access the HR dashboard
Manage employees
Search employees
Filter employees
View employee details
Activate/deactivate employee accounts
Monitor attendance
Filter attendance
View attendance summaries
Manage leave requests
Approve leave
Reject leave
Provide rejection reasons
View attendance analytics
View monthly attendance reports
Export attendance reports
🖥️ Application Screenshots

# Attendify follows several security practices:

Passwords are hashed using bcryptjs.
JWT is used for authentication.
Protected routes require authentication.
Role-based authorization restricts HR functionality.
Sensitive configuration is stored using environment variables.
Environment files are excluded from version control.
Attendance calculations are handled on the server.
Backend validation is applied to important requests.
User-specific resources are protected through authentication and authorization.
🔮 Future Improvements

# Potential future enhancements include:

📧 Email notifications
📊 Automated monthly email reports
🗓️ Holiday calendar
🔄 Shift management
💰 Payroll integration
🔔 Real-time HR notifications
🖐️ Biometric attendance integration
📈 Advanced employee performance analytics
📱 Progressive Web App support
🌐 Cloud deployment
🔔 Push notifications
🎯 Project Highlights

# Attendify demonstrates practical experience with:

MERN stack development
Full-stack application architecture
REST API development
JWT authentication
Role-based authorization
MongoDB and Mongoose
React application development
React Router
Axios API integration
Attendance business logic
Live working-hours tracking
Leave management workflows
HR administration
Data visualization
CSV report generation
Responsive UI development
Client-server architecture
📚 Core Application Workflow
Employee Workflow
                    Employee Login
                          │
                          ▼
                  Employee Dashboard
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
         Attendance      Leave       History
             │          Management      │
             │            │              │
       ┌─────┴─────┐      │              │
       ▼           ▼      ▼              ▼
    Check-In   Check-Out Apply Leave  View Records
       │           │      │
       ▼           ▼      ▼
 Live Timer    Final Time Pending
                          │
                   ┌──────┴──────┐
                   ▼             ▼
               Approved       Rejected
HR Workflow
                         HR Login
                            │
                            ▼
                       HR Dashboard
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      Employees         Attendance          Leave
      Management        Management        Management
          │                 │                 │
          ▼                 ▼                 ▼
       Search            Filter          View Requests
       Filter            Analyze              │
       Status             Reports        ┌────┴────┐
                                         ▼         ▼
                                      Approve   Reject
🧪 Development Notes

The project follows a separation of responsibilities between the frontend and backend.

## Frontend

Responsible for:

User interface
Client-side routing
Form handling
API communication
Live working-hours display
Data visualization
User feedback
Backend

Responsible for:

Authentication
Authorization
Database operations
Attendance calculations
Leave validation
Leave approval/rejection
Business logic
Report generation
Database

MongoDB Atlas stores application data for:

Users
Attendance
Leave requests

# 🌐 Environment Configuration

The project uses separate environment files for the frontend and backend.

Attendify/
│
├── client/
│   ├── .env
│   └── .env.example
│
└── server/
    ├── .env
    └── .env.example

Environment files containing secrets should never be committed to GitHub.

Make sure .gitignore includes:

.env
.env.local
.env.*.local
node_modules/
🤝 Contributing

Contributions and suggestions are welcome.

To contribute:

git clone https://github.com/YOUR_USERNAME/Attendify.git
cd Attendify

Create a new branch:

git checkout -b feature/your-feature

Make your changes and commit them:

git add .
git commit -m "Add your feature"

Push the branch:

git push origin feature/your-feature

Then create a Pull Request on GitHub.

# 📜 License

This project is currently intended for educational, academic, and portfolio purposes.

A formal open-source license can be added in the future if required.

# 👩‍💻 Author
Disha Dutta

Information Technology
MCKV Institute of Engineering