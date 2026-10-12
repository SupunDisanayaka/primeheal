<div align="center">

# 🏥 Project PrimeHeal
### Healthcare & Medicare Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-18.x+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Status](https://img.shields.io/badge/Scope-University_Academic_Project-blue?style=for-the-badge)](#)

<p align="center">
  A full-stack healthcare and clinical management platform designed to streamline patient registration, doctor scheduling, appointment booking, and multi-role hospital administration.
</p>

[Overview](#-overview) • [Key Features](#-key-features) • [System Architecture](#-repository-structure) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Database Schema](#-database-schema--backend-modules)

</div>

---

## 📖 Overview

**Project PrimeHeal** is a comprehensive web-based Medicare and Healthcare Management System developed as an undergraduate academic project at the **Faculty of Computing, University of Sri Jayewardenepura**. 

The platform bridges the operational gap between patients, doctors, and healthcare administrators by providing dedicated interfaces for public patient bookings (`frontend`), multi-role staff operations (`admin`), and a normalized relational database (`database/schema`) powered by a RESTful Node.js/Express backend.

---

## ✨ Key Features

### 👤 Patient Portal (`frontend`)
* **User Authentication & Profiles:** Secure patient registration and login with comprehensive demographic tracking (Title, NIC/Passport, Country, Contact details).
* **Doctor Discovery & Search:** Responsive navigation and search functionality to filter specialists by department and availability.
* **Appointment Scheduling:** Real-time slot validation and booking workflow for clinical consultations.
* **Patient Feedback System:** Post-consultation rating and review submission to maintain clinical quality standards.

### 🛡️ Multi-Role Admin & Staff Portal (`admin`)
* **Role-Based Access Control (RBAC):** Dedicated sidebar navigation and permission boundaries for Administrators and Medical Staff.
* **Electronic Patient Records:** Centralized management of patient histories, demographic data, and appointment logs.
* **Doctor & Schedule Management:** Administrative controls to onboard doctors, configure consultation time slots, and manage shift availability.

### ⚙️ Core Backend & Database Architecture
* **Normalized Relational Schema:** Engineered in MySQL with strict referential integrity across users, patients, doctors, schedules, and feedback entities.
* **RESTful API Design:** Structured request validation, error-handling middleware, and protected route authentication.

---

## 📂 Repository Structure

```text
primeheal/
├── admin/                  # Multi-role Admin & Doctor dashboard (React.js)
├── frontend/               # Patient-facing web application (React.js)
├── backend/                # RESTful API server, controllers & auth middleware (Node.js / Express)
├── database/
│   └── schema/             # SQL DDL scripts, migrations & ER schema definitions
├── package-lock.json
└── README.md
🛠️ Tech StackLayerTechnologies UsedBackend & APINode.js, Express.js, RESTful APIs, JWT / Session AuthenticationFrontend PortalsReact.js, HTML5, CSS3 / Tailwind CSS, JavaScript (ES6+)DatabaseMySQL (Relational Schema Design, Foreign Key Constraints, Indexing)Dev Tools & TestingGit, GitHub, Postman (API Testing & Documentation), VS Code

🗄️ Database Schema & Backend Modules
The relational database Located in database/schema is structured around four core operational modules:

Authentication & Identity (users, roles): Handles credential hashing, multi-role authorization, and session state.

Patient Records (patients): Captures granular patient identifiers including Title, National Identity Card (NIC), Country of origin, and medical contact metadata.

Clinical Scheduling (doctors, schedules, appointments): Manages doctor availability windows, prevents double-booking collisions, and tracks appointment lifecycle states (Pending, Confirmed, Completed, Cancelled).

Quality Assurance (feedback): Links patient reviews directly to verified consultation records.

🚀 Getting StartedFollow these steps to set up and run the project locally for development and testing.PrerequisitesNode.js (v18.0.0 or higher)npm (v9.0.0 or higher)MySQL Server (v8.0 or higher)1. Clone the RepositoryBashgit clone [https://github.com/](https://github.com/)<your-org-or-username>/primeheal.git
cd primeheal
2. Database SetupOpen your MySQL client (MySQL Workbench, phpMyAdmin, or CLI).Create a new database:SQLCREATE DATABASE primeheal_db;
Import the SQL schema files located in the database/schema/ directory:Bashmysql -u root -p primeheal_db < database/schema/init.sql
3. Backend Configuration (If on Backend Branch/Folder)Bashcd backend
npm install

Create a .env file in the backend directory:Code snippetPORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=primeheal_db
JWT_SECRET=your_secret_key
Start the API server:Bashnpm run dev

4. Run the Frontend Patient PortalBashcd frontend
npm install
npm run dev

5. Run the Admin PortalBashcd admin
npm install
npm run dev

👨‍💻 Contributors & ResponsibilitiesManuja Chelaka Nishshanka — Backend Developer & Database ArchitectDesigned and maintained the relational MySQL schema (database/schema).   Engineered core REST API modules for authentication, electronic patient records, doctor scheduling, and feedback workflows.Supun Disanayaka — Frontend & Admin UI DeveloperBuilt the responsive patient navigation bar, search workflows (frontend), and multi-role administrative dashboard (admin).   📄 License & Academic DisclaimerThis project was developed as an academic demonstration system for coursework at the University of Sri Jayewardenepura. It is intended for educational and portfolio evaluation purposes rather than live clinical deployment.

