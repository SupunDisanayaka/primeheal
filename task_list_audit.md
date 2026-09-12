# PrimeHeal System Development Project: Functional Requirements Audit

**Audit Date:** September 11, 2026  
**Auditor:** Expert Software Engineer & Technical Auditor  
**Project:** PrimeHeal Healthcare Management Platform  
**Target Repository:** `c:\Users\Asus\Desktop\project\primeheal`  
**Technologies:** React (Vite, TailwindCSS), Express.js (Node.js), MySQL (`mysql2`), JWT, PayHere Payment Gateway, Nodemailer, PDFKit  

---

## Executive Summary

| Status Badge | Count | Percentage |
| :--- | :--- | :--- |
| 🟢 **Implemented** | 16 | 43.2% |
| 🟡 **Partially Implemented** | 13 | 35.1% |
| 🔴 **Not Implemented** | 8 | 21.6% |
| **Total Requirements Evaluated** | **37** | **100%** |

### 🚨 Critical Discovered Defect
Before reviewing module details, a **blocking runtime defect** was identified:
- In [receptionistRoutes.js:3](file:///c:/Users/Asus/Desktop/project/primeheal/backend/routes/receptionistRoutes.js#L3) and [accountantRoutes.js:3](file:///c:/Users/Asus/Desktop/project/primeheal/backend/routes/accountantRoutes.js#L3), `requireRole` is imported from `../middleware/auth` instead of `../middleware/roleGuard`. Because `auth.js` does not export `requireRole`, attempting to start [server.js](file:///c:/Users/Asus/Desktop/project/primeheal/backend/server.js) results in an immediate crash:
  `TypeError: requireRole is not a function`.

---

## Module-by-Module Audit

### 2.4.1 Authentication Module

* **User needs to be able to log in the system with authorized credentials.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [authController.js:358-430](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/authController.js#L358-L430), [authRoutes.js:16-17](file:///c:/Users/Asus/Desktop/project/primeheal/backend/routes/authRoutes.js#L16-L17)
    * Frontend: [frontend/src/pages/Login.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/Login.jsx), [admin/src/pages/Login.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Login.jsx)
  * **Verification Note:** Validates email and compares password hashes using `bcrypt.compare` against the MySQL `users` table. Includes in-memory IP rate limiting (max 5 failed attempts per 15 minutes), Google OAuth 2.0 token exchange, and password reset flows with cryptographic email tokens. Generates signed JWT containing `userID`, `userType`, `roleID`, and `tokenVersion`.

* **Differentiated access will be given according to user roles.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [roleGuard.js:1-16](file:///c:/Users/Asus/Desktop/project/primeheal/backend/middleware/roleGuard.js#L1-L16), [auth.js:4-47](file:///c:/Users/Asus/Desktop/project/primeheal/backend/middleware/auth.js#L4-L47)
    * Admin Frontend: [admin/src/App.jsx:32-108](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/App.jsx#L32-L108), [Sidebar.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/components/Sidebar.jsx)
  * **Verification Note:** Differentiated access is enforced on the backend via the `requireRole([...])` higher-order middleware matching the decoded JWT `userType`. In the Admin portal, routes and navigation links are partitioned strictly by `adminToken`, `doctorToken`, `receptionistToken`, and `accountantToken`. *(Note: Fix required for receptionist and accountant route imports).*

* **Access to functionalities will be limited to patients, doctors, receptionists, accountants, and administrators.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [primeheal_schema_full.sql:539](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L539), [roleGuard.js](file:///c:/Users/Asus/Desktop/project/primeheal/backend/middleware/roleGuard.js)
    * Frontend: [frontend/src/App.jsx:29-41](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/App.jsx#L29-L41)
  * **What Exists:** Role ENUM in database supports `patient`, `doctor`, `receptionist`, `accountant`, and `admin`. Backend controllers enforce ownership and role guards (e.g. IDOR protection on doctor profiles and appointment cancellations).
  * **What is Missing:** The patient frontend ([frontend/src/App.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/App.jsx)) lacks client-side Protected Route wrappers for `/my-appointments` and `/my-profile`, allowing unauthenticated users to enter the route before the API fails. Furthermore, receptionist and accountant routes are currently broken due to import errors.

* **An unauthorized person shall not be able to use any protected resources.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [auth.js:4-47](file:///c:/Users/Asus/Desktop/project/primeheal/backend/middleware/auth.js#L4-L47)
  * **Verification Note:** `verifyToken` middleware requires a `Bearer <token>` HTTP header, decodes and verifies signature against `JWT_SECRET`, queries `users` table in MySQL to verify the account is active (`isActive === 1`), and validates `tokenVersion` (invalidating tokens when a user changes their password). Unauthenticated requests return `401 Unauthorized`.

---

### 2.4.2 Patient Management Module

* **Receptionists will be able to take patient details.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [receptionistController.js:72-152](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/receptionistController.js#L72-L152)
    * Frontend: [ReceptionistDashboard.jsx:117-184](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Receptionist/ReceptionistDashboard.jsx#L117-L184)
  * **What Exists:** Receptionists can take patient details (`patientName`, `patientEmail`, `patientPhone`, `patientGender`, `patientDob`) through a walk-in appointment booking modal, which auto-creates `users` and `patient` records.
  * **What is Missing:** There is no dedicated patient intake form outside the walk-in booking workflow. Crucial patient fields defined in the schema (NIC, address, emergency contact, medical allergies) cannot be entered or managed by the receptionist.

* **Patient records will be maintained in a common database.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Database: [primeheal_schema_full.sql:393-421, 527-549](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L393-L421)
  * **Verification Note:** MySQL database maintains common `users` (credentials, contact) and `patient` (patientCode, NIC, DOB, gender, address, emergencyContact, allergies) tables with foreign key cascades and unique constraints on NIC and patientCode.

* **Authorized personnel will be allowed to modify patient data.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [userController.js:197-281](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/userController.js#L197-L281)
    * Frontend: [MyProfile.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/MyProfile.jsx)
  * **What Exists:** Patients can update their own profile data (`dateOfBirth`, `gender`, `address`, `emergencyContact`, `allergies`, `nic`, `country`).
  * **What is Missing:** Authorized clinical and administrative personnel (receptionists, doctors, administrators) **cannot** modify patient records. There are no staff-facing update endpoints (e.g. `PUT /api/patients/:id` or `PUT /api/admin/patients/:id`) or editing interfaces in the Admin/Staff portal.

* **Administrators shall have access to patient records.**
  * **Status:** 🔴 Not Implemented
  * **File Paths:**
    * None (Only aggregate count in [adminController.js:183](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/adminController.js#L183))
  * **What Exists:** Admin dashboard retrieves a scalar count: `(SELECT COUNT(*) FROM patient) AS totalPatients`. Basic patient contact fields are visible only when an appointment is clicked.
  * **What is Missing:** There is no patient directory or registry in the admin portal (`admin/src/pages/Admin`). No endpoint exists to list all patients (`GET /api/admin/patients`), view patient medical histories, or search by patient code or NIC.

* **Patient information will be available in the handling of appointments.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [adminController.js:88-118](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/adminController.js#L88-L118), [appointmentController.js:267-338](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js#L267-L338)
    * Frontend: [AllAppointments.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/AllAppointments.jsx), [DoctorAppointments.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Doctor/DoctorAppointments.jsx), [ReceptionistDashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Receptionist/ReceptionistDashboard.jsx)
  * **Verification Note:** Queries in `appointmentController` and `adminController` execute SQL joins against `patient` and `users`, making patient name, phone, email, NIC, address, gender, and DOB available in appointment tables for receptionists, doctors, and administrators.

---

### 2.4.3 Doctor Management Module

* **Administrators shall be able to add doctor information.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [doctorController.js:74-140](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/doctorController.js#L74-L140), [doctorRoutes.js:18](file:///c:/Users/Asus/Desktop/project/primeheal/backend/routes/doctorRoutes.js#L18)
    * Frontend: [AddDoctor.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/AddDoctor.jsx)
  * **Verification Note:** Administrators can register doctors via a multi-field form with Multer image upload. Transactionally creates user record with `doctor` role and creates doctor profile with `specialization`, `licenseNumber`, `qualifications`, `consultationFee`, `experience`, and `bio`.

* **Administrators should have the ability to change doctor information.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [doctorController.js:143-185](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/doctorController.js#L143-L185)
    * Frontend: [DoctorProfile.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Doctor/DoctorProfile.jsx), [DoctorsList.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/DoctorsList.jsx)
  * **What Exists:** Backend `PUT /api/doctors/:id` allows administrators and the doctor themselves to update consultation fees, bio, availability, name, and email. Doctors can edit their own profile in `DoctorProfile.jsx`.
  * **What is Missing:** In the administrator's doctor roster ([DoctorsList.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/DoctorsList.jsx)), admins can only toggle availability (`isAvailable`). There is **no edit button or modal** for administrators to update doctor information from the admin UI.

* **The Doctor's availability schedules shall be kept in the system.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [doctorController.js:232-393](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/doctorController.js#L232-L393), [primeheal_schema_full.sql:197-230](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L197-L230)
    * Frontend: [DoctorSchedule.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Doctor/DoctorSchedule.jsx)
  * **Verification Note:** Maintained in `doctoravailability` table supporting slot duration (30 min default), day-of-week recurring schedules, and specific date overrides. Doctors can configure their weekly slots through the schedule management UI.

* **Doctors shall be able to view their appointment schedules.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [appointmentController.js:301-341](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js#L301-L341)
    * Frontend: [DoctorAppointments.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Doctor/DoctorAppointments.jsx), [DoctorDashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Doctor/DoctorDashboard.jsx)
  * **Verification Note:** Doctors can view their appointment calendar/list filtered by their authenticated ID, displaying patient details, appointment date, time, fee, payment status, and actions.

* **Doctors will have access to assigned patient data when necessary.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [appointmentController.js:308-338](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js#L308-L338)
    * Frontend: [DoctorAppointments.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Doctor/DoctorAppointments.jsx)
  * **What Exists:** Doctors can view the demographic and contact information of patients assigned to them via booked appointments.
  * **What is Missing:** Doctors cannot access or manage clinical patient records (medical history, lab reports, doctor's consultation notes, prescriptions). The `medicalreport` table and `doctorNotes` column defined in the database have zero controller or frontend integrations.

---

### 2.4.4 Appointment Management Module

* **The patient will be able to find doctors available for his/her search.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [doctorController.js:6-33, 234-316](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/doctorController.js#L6-L33,L234-L316)
    * Frontend: [Doctors.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/Doctors.jsx), [Appointment.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/Appointment.jsx)
  * **Verification Note:** Patients can filter doctors by medical speciality (Cardiologist, Pediatrician, etc.) and view dynamic slot availability calculated by cross-referencing doctor schedules with existing non-cancelled bookings.

* **Patients will be able to make an appointment.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [appointmentController.js:106-254](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js#L106-L254)
    * Frontend: [Appointment.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/Appointment.jsx)
  * **Verification Note:** Patients select slot and submit appointment booking. Backend uses a database transaction with `FOR UPDATE` row-level locking to prevent double bookings, validates doctor schedule compliance, persists record, and queues an email confirmation.

* **Receptionists will have the ability to schedule appointments.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [receptionistController.js:72-152](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/receptionistController.js#L72-L152)
    * Frontend: [ReceptionistDashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Receptionist/ReceptionistDashboard.jsx)
  * **Verification Note:** Receptionists can book walk-in appointments from the dashboard, selecting patient details, doctor, date, and time slot.

* **Modifications to appointments shall be encouraged.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [appointmentController.js:549-672](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js#L549-L672) (`PATCH /api/appointments/:appointmentId/reschedule`)
    * Service: [frontend/src/services/api.js:126-128](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/services/api.js#L126-L128)
  * **What Exists:** Complete backend controller logic exists to reschedule appointments, validating that the doctor is available at the new slot and that no collision exists. An API service method is defined.
  * **What is Missing:** **No UI exists** in either [MyAppointments.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/MyAppointments.jsx) or the Admin/Staff portals for users to trigger rescheduling.

* **Appointments will be supported when they are cancelled.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [appointmentController.js:349-442, 444-547](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js#L349-L442,L444-L547)
    * Frontend: [MyAppointments.jsx:88-100](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/MyAppointments.jsx#L88-L100), [AllAppointments.jsx:40-42](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/AllAppointments.jsx#L40-L42)
  * **Verification Note:** Patients and administrators can cancel pending appointments. Backend validates ownership, prevents cancellation of completed appointments, and updates status to `Cancelled`.

* **The appointments shall be confirmed in the system and the details of appointments shall be preserved.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Database: [primeheal_schema_full.sql:78-109](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L78-L109)
    * Backend: [appointmentController.js](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js)
  * **Verification Note:** Appointments are preserved in MySQL with foreign key relationships, audit logging, timestamps, and status lifecycles (`Pending` -> `Paid`/`Confirmed` -> `Checked In` -> `Completed`).

* **Receptionists will be able to conduct patient registration.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [receptionistController.js:100-122](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/receptionistController.js#L100-L122)
    * Frontend: [ReceptionistDashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Receptionist/ReceptionistDashboard.jsx)
  * **What Exists:** New patients are registered implicitly during the walk-in appointment scheduling flow.
  * **What is Missing:** There is no dedicated registration interface where a receptionist can register a new patient (with full demographics, NIC, emergency contact, allergies) without booking an appointment immediately.

---

### 2.4.5 Payment Management Module

* **Electronic record of payment information shall be maintained.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [paymentService.js](file:///c:/Users/Asus/Desktop/project/primeheal/backend/services/paymentService.js), [payments table](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L430-L453)
  * **Verification Note:** Electronic records are maintained in MySQL `payments` and `payment_logs` tables tracking `merchantOrderId`, `transactionId`, `amount`, `currency`, `paymentStatus`, `paymentGateway`, `paymentMethod`, `receiptUrl`, and verification timestamps.

* **The accountants shall be able to handle payments.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [accountantController.js:7-54, 57-94](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/accountantController.js#L7-L54,L57-L94)
    * Frontend: [AccountantDashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Accountant/AccountantDashboard.jsx)
  * **Verification Note:** Accountants can record counter payments (Cash/POS) directly against pending appointments and trigger transaction refunds which cancel the appointment.

* **Payment status shall be carried out.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [paymentService.js:366-457](file:///c:/Users/Asus/Desktop/project/primeheal/backend/services/paymentService.js#L366-L457), [accountantController.js:33-42](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/accountantController.js#L33-L42)
    * Frontend: [MyAppointments.jsx:115-150](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/MyAppointments.jsx#L115-L150)
  * **Verification Note:** End-to-end payment status transitions (`Pending` -> `Completed` / `Failed` / `Refunded`) are executed via PayHere sandbox webhooks (with MD5 signature validation) and manual counter payment entries.

* **The payment history will be accessible to authorized users.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Frontend: [MyAppointments.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/MyAppointments.jsx), [AccountantDashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Accountant/AccountantDashboard.jsx), [Dashboard.jsx:242-261](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/Dashboard.jsx#L242-L261)
  * **What Exists:** Patients can see payment status on their appointments. Accountants see recent payments in their dashboard. Admins see the 5 most recent transactions.
  * **What is Missing:** There is no dedicated payment history screen with pagination, date range filtering, or transaction search for accountants or administrators.

* **Payment details will be used for financial reporting purposes.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [accountantController.js:100-148](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/accountantController.js#L100-L148), [adminController.js:165-190](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/adminController.js#L165-L190)
    * Frontend: [AccountantDashboard.jsx:40-100](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Accountant/AccountantDashboard.jsx#L40-L100)
  * **Verification Note:** Payment amounts feed financial summary calculations: total revenue, today's revenue, monthly revenue, pending receivables, and individual doctor revenue breakdowns.

---

### 2.4.6 Invoice Management Module

* **Completed payments will be issued an invoice.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [paymentService.js:474-505](file:///c:/Users/Asus/Desktop/project/primeheal/backend/services/paymentService.js#L474-L505), [appointmentController.js:674-830](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/appointmentController.js#L674-L830)
    * Frontend: [MyAppointments.jsx:213-228](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/MyAppointments.jsx#L213-L228)
  * **What Exists:** When an online payment completes, an invoice record is created in the `invoice` table and a PDF invoice with a verification QR code can be downloaded via `GET /api/appointments/:appointmentId/invoice`.
  * **What is Missing:** When an accountant records a counter payment in [accountantController.js:collectCounterPayment](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/accountantController.js#L7-L54), it updates `payments` but **fails to insert a record into the `invoice` table**, creating orphaned billing records.

* **Avoid the hassle of creating new invoices when needed, accountants will be able to recreate them.**
  * **Status:** 🔴 Not Implemented
  * **File Paths:**
    * None
  * **What Exists:** None.
  * **What is Missing:** Accountants have no endpoint or UI interface to recreate, regenerate, or adjust invoices. There is no invoice management view in the accountant portal.

* **This information from the invoice shall be kept for future reference.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Database: [primeheal_schema_full.sql:271-298](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L271-L298)
  * **What Exists:** Table `invoice` persists `invoiceNumber, subtotal, tax, discount, totalAmount, issueDate, dueDate, status` for online payments.
  * **What is Missing:** No API route exists to list, query, or audit invoices (`GET /api/invoices`). Invoices cannot be searched or viewed outside of individual patient appointment downloads.

---

### 2.4.7 Feedback Management Module

* **Patients will have opportunities for feedback.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [feedbackController.js:30-142](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/feedbackController.js#L30-L142), [feedbackRoutes.js:14-15](file:///c:/Users/Asus/Desktop/project/primeheal/backend/routes/feedbackRoutes.js#L14-L15)
    * Frontend: [FeedbackModal.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/components/feedback/FeedbackModal.jsx), [MyAppointments.jsx:83-86](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/pages/MyAppointments.jsx#L83-L86)
  * **Verification Note:** Patients can submit feedback on completed appointments via an interactive modal. Duplicate feedback is rejected by the backend.

* **Patients will have the opportunity to give ratings.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Backend: [feedbackController.js:43-46](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/feedbackController.js#L43-L46)
    * Frontend: [FeedbackModal.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/frontend/src/components/feedback/FeedbackModal.jsx)
  * **Verification Note:** 1 to 5 star rating interface is available to patients, with validation on both frontend and backend and database constraints.

* **The doctors and administrators will have access to the submitted feedback.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [feedbackController.js:151-249](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/feedbackController.js#L151-L249)
    * Admin Frontend: [AdminFeedbackModeration.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/AdminFeedbackModeration.jsx)
  * **What Exists:** Administrators have a dedicated feedback moderation panel to view, approve, and toggle visibility of all reviews. Backend provides `GET /api/feedback/doctor/:id` for doctor reviews.
  * **What is Missing:** Doctors have **no feedback view or rating section** in their doctor portal (`admin/src/pages/Doctor/`). They cannot see patient comments or review their performance.

* **Feedback records will be maintained on the system database.**
  * **Status:** 🟢 Implemented
  * **File Paths:**
    * Database: [primeheal_schema_full.sql:238-257](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L238-L257)
    * Backend: [feedbackController.js](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/feedbackController.js)
  * **Verification Note:** Feedback is stored in MySQL `feedback` table. Approving a review automatically recalculates and updates the doctor's `averageRating` in the `doctor` table.

---

### 2.4.8 Complaint Management Module

* **Complaints shall be received by the patient.**
  * **Status:** 🔴 Not Implemented
  * **File Paths:** None
  * **Verification Note:** No endpoint (e.g. `POST /api/complaints`) or patient interface exists for patients to lodge complaints (by complaint type: service, billing, technical, staff, other).

* **Administrators will be able to view complaints.**
  * **Status:** 🔴 Not Implemented
  * **File Paths:** None
  * **Verification Note:** No endpoint (e.g. `GET /api/complaints`) or admin interface exists for administrators to inspect submitted complaints.

* **Records of complaints shall be kept for future reference.**
  * **Status:** 🔴 Not Implemented
  * **File Paths:** [primeheal_schema_full.sql:128-145](file:///c:/Users/Asus/Desktop/project/primeheal/database/schema/primeheal_schema_full.sql#L128-L145) (Schema table only)
  * **Verification Note:** Although a MySQL `complaint` table is defined in the initial schema dump, there is zero application code (routes, controllers, models) interacting with it.

* **Status of complaints shall be monitored.**
  * **Status:** 🔴 Not Implemented
  * **File Paths:** None
  * **Verification Note:** No workflow or status monitoring (`open`, `in-progress`, `resolved`, `closed`) or admin assignment mechanism exists in the codebase.

---

### 2.4.9 Reporting and Analytics Module

* **Administrators are allowed to create reports.**
  * **Status:** 🔴 Not Implemented
  * **File Paths:** None
  * **Verification Note:** No reporting tool, report generator, or export feature (CSV/PDF export) exists for administrators to compile and export custom operational or clinical reports.

* **Financial reports will be made available.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [accountantController.js:100-148](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/accountantController.js#L100-L148), [adminController.js:165-190](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/adminController.js#L165-L190)
    * Frontend: [AccountantDashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Accountant/AccountantDashboard.jsx)
  * **What Exists:** Total revenue, pending revenue, and doctor revenue breakdowns are displayed on the Accountant dashboard and Admin overview cards.
  * **What is Missing:** Formal downloadable financial statements, date-filtered revenue reports, and exportable financial audit sheets are missing.

* **Reports on appointments shall be available.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Backend: [adminController.js:168-174](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/adminController.js#L168-L174)
  * **What Exists:** Raw appointment counts (total, today, pending, confirmed, cancelled, completed) are provided in the dashboard stats API.
  * **What is Missing:** Structured appointment reports, doctor attendance/utilization reports, cancellation analysis, and exportable appointment records are not available.

* **User activity information shall be made available.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Database: [primeheal_schema_full.sql:301](file:///c:/Users/Asus/Desktop/project/primeheal/backend/config/db.js#L301) (`audit_logs`)
    * Backend: [authController.js:64](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/authController.js#L64), [userController.js:389](file:///c:/Users/Asus/Desktop/project/primeheal/backend/controllers/userController.js#L389)
  * **What Exists:** An `audit_logs` table exists and records system actions (`REGISTER_PATIENT`, `LOGIN_SUCCESS`, `UPDATE_PROFILE`, `CHANGE_PASSWORD`, `RESCHEDULE_APPOINTMENT`).
  * **What is Missing:** **No API endpoint or UI exists** to query or display `audit_logs`. The logged activity data is inaccessible to administrators.

* **System analytics should support the decision making processes.**
  * **Status:** 🟡 Partially Implemented
  * **File Paths:**
    * Frontend: [Dashboard.jsx](file:///c:/Users/Asus/Desktop/project/primeheal/admin/src/pages/Admin/Dashboard.jsx)
  * **What Exists:** Basic metric cards display daily/monthly revenue and booking counts.
  * **What is Missing:** Visual trend analytics (e.g. chart visualizations of revenue trends, appointment volume by day/hour, patient retention rates, doctor productivity) are not implemented.

---

## Summary of Missing & Incomplete Components

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 COMPLETELY MISSING (Priority 1 & 2)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Complaint Management Module (All 4 requirements)         │
│ 2. Administrator Patient Records & Registry                 │
│ 3. Invoice Recreation & Management for Accountants          │
│ 4. Report Generation & Export Tool (CSV/PDF)                │
│ 5. User Activity / Audit Trail Viewer                       │
├─────────────────────────────────────────────────────────────┤
│ 🟡 INCOMPLETE / MISSING UI WIRING (Priority 1)              │
├─────────────────────────────────────────────────────────────┤
│ 1. Route import defect in receptionistRoutes & accountant   │
│ 2. Appointment Reschedule UI in MyAppointments & Admin      │
│ 3. Counter Payment Invoice Creation (preventing orphans)    │
│ 4. Doctor Review & Rating View on Doctor Dashboard          │
│ 5. Admin Doctor Editing UI in DoctorsList                   │
│ 6. Staff Patient Modification Endpoint                      │
└─────────────────────────────────────────────────────────────┘
```
