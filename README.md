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


