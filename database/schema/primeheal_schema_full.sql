-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: primeheal_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accountant`
--

DROP TABLE IF EXISTS `accountant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accountant` (
  `accountantID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `accountingLicense` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`accountantID`),
  UNIQUE KEY `userID` (`userID`),
  CONSTRAINT `accountant_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accountant`
--

LOCK TABLES `accountant` WRITE;
/*!40000 ALTER TABLE `accountant` DISABLE KEYS */;
INSERT INTO `accountant` VALUES (1,12,'ICASL-9876','Finance');
/*!40000 ALTER TABLE `accountant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `adminID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `permissions` json DEFAULT NULL,
  `accessLevel` enum('super','standard','limited') DEFAULT 'standard',
  PRIMARY KEY (`adminID`),
  UNIQUE KEY `userID` (`userID`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,13,'{\"manage_users\": true, \"view_reports\": true, \"manage_settings\": true, \"handle_complaints\": true}','super');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `appointmentID` int NOT NULL AUTO_INCREMENT,
  `patientID` int NOT NULL,
  `doctorID` int NOT NULL,
  `receptionistID` int DEFAULT NULL,
  `appointmentDate` date NOT NULL,
  `appointmentTime` time NOT NULL,
  `duration` int DEFAULT '30',
  `consultationFee` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','checked-in','completed','cancelled','no-show') DEFAULT 'pending',
  `reason` text,
  `doctorNotes` text,
  `noShowRefund` tinyint(1) DEFAULT '0',
  `noShowSurcharge` decimal(10,2) DEFAULT '0.00',
  `checkedIn` tinyint(1) DEFAULT '0',
  `checkedInTime` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointmentID`),
  KEY `receptionistID` (`receptionistID`),
  KEY `idx_appointment_date` (`appointmentDate`),
  KEY `idx_appointment_status` (`status`),
  KEY `idx_patient_appointments` (`patientID`,`appointmentDate`),
  KEY `idx_doctor_appointments` (`doctorID`,`appointmentDate`),
  CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`patientID`) REFERENCES `patient` (`patientID`) ON DELETE RESTRICT,
  CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`doctorID`) REFERENCES `doctor` (`doctorID`) ON DELETE RESTRICT,
  CONSTRAINT `appointment_ibfk_3` FOREIGN KEY (`receptionistID`) REFERENCES `receptionist` (`receptionistID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,1,1,1,'2024-11-15','09:00:00',30,3500.00,'completed','Chest pain and shortness of breath','ECG performed. Prescribed beta-blockers. Follow-up in 2 weeks.',0,0.00,1,'2024-11-15 03:25:00','2024-11-10 05:00:00','2025-12-07 16:24:43'),(2,2,2,1,'2024-11-20','08:30:00',30,2500.00,'completed','Child vaccination - MMR','MMR vaccine administered. No adverse reactions. Next visit in 1 month.',0,0.00,1,'2024-11-20 02:55:00','2024-11-15 08:50:00','2025-12-07 16:24:43'),(3,3,3,2,'2024-11-25','16:00:00',20,2000.00,'completed','Fever and cold for 3 days','Viral infection. Prescribed paracetamol and rest. Return if fever persists.',0,0.00,1,'2024-11-25 10:28:00','2024-11-24 04:15:00','2025-12-07 16:24:43'),(4,4,4,1,'2024-12-10','10:00:00',30,3000.00,'confirmed','Acne treatment consultation',NULL,0,0.00,0,NULL,'2024-12-01 06:00:00','2025-12-07 16:24:43'),(5,5,1,2,'2024-12-12','09:30:00',30,3500.00,'confirmed','Follow-up for hypertension',NULL,0,0.00,0,NULL,'2024-12-02 11:15:00','2025-12-07 16:24:43'),(6,1,3,1,'2024-12-15','16:00:00',20,2000.00,'confirmed','General checkup',NULL,0,0.00,0,NULL,'2024-12-05 04:30:00','2025-12-07 16:24:43'),(7,2,4,NULL,'2024-12-18','11:00:00',30,3000.00,'pending','Skin rash evaluation',NULL,0,0.00,0,NULL,'2024-12-06 07:50:00','2025-12-07 16:24:43'),(8,3,2,NULL,'2024-12-08','08:00:00',30,2500.00,'cancelled','Child health checkup - patient requested cancellation',NULL,0,0.00,0,NULL,'2024-11-30 03:45:00','2025-12-07 16:24:43'),(9,6,1,NULL,'2024-12-20','10:00:00',30,3500.00,'confirmed','Regular checkup',NULL,0,0.00,0,NULL,'2026-05-09 11:17:46','2026-05-09 11:27:43');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint`
--

DROP TABLE IF EXISTS `complaint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint` (
  `complaintID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `complaintType` enum('service','billing','technical','staff','other') NOT NULL,
  `description` text NOT NULL,
  `status` enum('open','in-progress','resolved','closed') DEFAULT 'open',
  `assignedToAdminID` int DEFAULT NULL,
  `resolution` text,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolvedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`complaintID`),
  KEY `userID` (`userID`),
  KEY `assignedToAdminID` (`assignedToAdminID`),
  KEY `idx_status` (`status`),
  KEY `idx_createdAt` (`createdAt`),
  CONSTRAINT `complaint_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `complaint_ibfk_2` FOREIGN KEY (`assignedToAdminID`) REFERENCES `admin` (`adminID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint`
--

LOCK TABLES `complaint` WRITE;
/*!40000 ALTER TABLE `complaint` DISABLE KEYS */;
INSERT INTO `complaint` VALUES (1,3,'service','Had to wait for 45 minutes beyond my appointment time on November 25th. Would appreciate better time management.','in-progress',1,NULL,'2024-11-26 10:00:00',NULL),(2,5,'technical','Unable to reschedule my appointment online. The button is not working on mobile.','open',NULL,NULL,'2024-12-01 04:30:00',NULL);
/*!40000 ALTER TABLE `complaint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `doctorID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `licenseNumber` varchar(50) NOT NULL,
  `qualifications` text,
  `bio` text,
  `consultationFee` decimal(10,2) DEFAULT '0.00',
  `averageRating` decimal(3,2) DEFAULT '0.00',
  `totalPatients` int DEFAULT '0',
  `isAvailable` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`doctorID`),
  UNIQUE KEY `userID` (`userID`),
  UNIQUE KEY `licenseNumber` (`licenseNumber`),
  KEY `idx_specialization` (`specialization`),
  KEY `idx_isAvailable` (`isAvailable`),
  KEY `idx_rating` (`averageRating`),
  CONSTRAINT `doctor_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (1,6,'Cardiologist','SLMC-12345','MBBS, MD (Cardiology)','Specialist in heart diseases with 15 years of experience',4000.00,5.00,120,1),(2,7,'Pediatrician','SLMC-23456','MBBS, DCH, MD (Pediatrics)','Child health specialist with expertise in infant care',2500.00,5.00,200,1),(3,8,'General Physician','SLMC-34567','MBBS, MD','General medicine practitioner for all age groups',2000.00,4.00,350,1),(4,9,'Dermatologist','SLMC-45678','MBBS, MD (Dermatology)','Skin specialist with focus on cosmetic dermatology',3000.00,4.70,180,1);
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctoravailability`
--

DROP TABLE IF EXISTS `doctoravailability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctoravailability` (
  `availabilityID` int NOT NULL AUTO_INCREMENT,
  `doctorID` int NOT NULL,
  `dayOfWeek` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `slotDuration` int DEFAULT '30',
  `maxAppointmentsPerSlot` int DEFAULT '1',
  `recurring` tinyint(1) DEFAULT '1',
  `specificDate` date DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`availabilityID`),
  KEY `idx_doctor_day` (`doctorID`,`dayOfWeek`),
  KEY `idx_specificDate` (`specificDate`),
  CONSTRAINT `doctoravailability_ibfk_1` FOREIGN KEY (`doctorID`) REFERENCES `doctor` (`doctorID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctoravailability`
--

LOCK TABLES `doctoravailability` WRITE;
/*!40000 ALTER TABLE `doctoravailability` DISABLE KEYS */;
INSERT INTO `doctoravailability` VALUES (1,1,'Monday','09:00:00','12:00:00',30,1,1,NULL,1),(2,1,'Monday','14:00:00','17:00:00',30,1,1,NULL,1),(3,1,'Wednesday','09:00:00','12:00:00',30,1,1,NULL,1),(4,1,'Friday','09:00:00','12:00:00',30,1,1,NULL,1),(5,2,'Tuesday','08:00:00','13:00:00',30,1,1,NULL,1),(6,2,'Thursday','08:00:00','13:00:00',30,1,1,NULL,1),(7,2,'Saturday','08:00:00','12:00:00',30,1,1,NULL,1),(8,3,'Monday','16:00:00','20:00:00',20,1,1,NULL,1),(9,3,'Tuesday','16:00:00','20:00:00',20,1,1,NULL,1),(10,3,'Wednesday','16:00:00','20:00:00',20,1,1,NULL,1),(11,3,'Thursday','16:00:00','20:00:00',20,1,1,NULL,1),(12,3,'Friday','16:00:00','20:00:00',20,1,1,NULL,1),(13,4,'Monday','10:00:00','14:00:00',30,1,1,NULL,1),(14,4,'Wednesday','10:00:00','14:00:00',30,1,1,NULL,1),(15,4,'Friday','15:00:00','18:00:00',30,1,1,NULL,1);
/*!40000 ALTER TABLE `doctoravailability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedbackID` int NOT NULL AUTO_INCREMENT,
  `appointmentID` int NOT NULL,
  `patientID` int NOT NULL,
  `doctorID` int NOT NULL,
  `rating` int NOT NULL,
  `comments` text,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `isVisible` tinyint(1) DEFAULT '1',
  `isApproved` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`feedbackID`),
  KEY `appointmentID` (`appointmentID`),
  KEY `patientID` (`patientID`),
  KEY `idx_doctor_feedback` (`doctorID`,`isVisible`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`appointmentID`) REFERENCES `appointments` (`appointmentID`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`patientID`) REFERENCES `patient` (`patientID`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ibfk_3` FOREIGN KEY (`doctorID`) REFERENCES `doctor` (`doctorID`) ON DELETE CASCADE,
  CONSTRAINT `feedback_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (1,1,1,1,5,'Excellent doctor! Very thorough examination and clear explanation of the treatment plan.','2024-11-16 04:30:00',1,1),(2,2,2,2,5,'Dr. Kamala is wonderful with children. My son felt comfortable throughout the visit.','2024-11-21 09:00:00',1,1),(3,3,3,3,4,'Good service, but had to wait a bit longer than expected. Doctor was helpful though.','2024-11-26 03:30:00',1,1);
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice` (
  `invoiceID` int NOT NULL AUTO_INCREMENT,
  `appointmentID` int NOT NULL,
  `patientID` int NOT NULL,
  `invoiceNumber` varchar(50) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `totalAmount` decimal(10,2) NOT NULL,
  `issueDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `status` enum('draft','issued','paid','overdue','cancelled') DEFAULT 'draft',
  PRIMARY KEY (`invoiceID`),
  UNIQUE KEY `invoiceNumber` (`invoiceNumber`),
  KEY `appointmentID` (`appointmentID`),
  KEY `patientID` (`patientID`),
  KEY `idx_invoiceNumber` (`invoiceNumber`),
  KEY `idx_status` (`status`),
  KEY `idx_issueDate` (`issueDate`),
  CONSTRAINT `invoice_ibfk_1` FOREIGN KEY (`appointmentID`) REFERENCES `appointments` (`appointmentID`) ON DELETE CASCADE,
  CONSTRAINT `invoice_ibfk_2` FOREIGN KEY (`patientID`) REFERENCES `patient` (`patientID`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` VALUES (1,1,1,'INV-2024-000001',3500.00,0.00,0.00,3500.00,'2024-11-15','2024-12-15','paid'),(2,2,2,'INV-2024-000002',2500.00,0.00,100.00,2400.00,'2024-11-20','2024-12-20','paid'),(3,3,3,'INV-2024-000003',2000.00,0.00,0.00,2000.00,'2024-11-25','2024-12-25','paid'),(4,4,4,'INV-2024-000004',3000.00,0.00,0.00,3000.00,'2024-12-10','2025-01-10','issued'),(5,5,5,'INV-2024-000005',3500.00,0.00,0.00,3500.00,'2024-12-12','2025-01-12','issued');
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicalreport`
--

DROP TABLE IF EXISTS `medicalreport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicalreport` (
  `reportID` int NOT NULL AUTO_INCREMENT,
  `appointmentID` int NOT NULL,
  `patientID` int NOT NULL,
  `doctorID` int NOT NULL,
  `reportType` varchar(100) DEFAULT NULL,
  `diagnosis` text,
  `prescription` text,
  `labResults` text,
  `reportDate` date NOT NULL,
  `fileURL` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`reportID`),
  KEY `appointmentID` (`appointmentID`),
  KEY `doctorID` (`doctorID`),
  KEY `idx_patient_reports` (`patientID`,`reportDate`),
  KEY `idx_reportDate` (`reportDate`),
  CONSTRAINT `medicalreport_ibfk_1` FOREIGN KEY (`appointmentID`) REFERENCES `appointments` (`appointmentID`) ON DELETE CASCADE,
  CONSTRAINT `medicalreport_ibfk_2` FOREIGN KEY (`patientID`) REFERENCES `patient` (`patientID`) ON DELETE RESTRICT,
  CONSTRAINT `medicalreport_ibfk_3` FOREIGN KEY (`doctorID`) REFERENCES `doctor` (`doctorID`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicalreport`
--

LOCK TABLES `medicalreport` WRITE;
/*!40000 ALTER TABLE `medicalreport` DISABLE KEYS */;
INSERT INTO `medicalreport` VALUES (1,1,1,1,'Cardiology Consultation','Mild hypertension with occasional chest discomfort','Metoprolol 50mg - Once daily\nAspirin 75mg - Once daily\nLifestyle modifications recommended','ECG: Sinus rhythm, no acute changes\nBlood Pressure: 145/92 mmHg','2024-11-15','/reports/2024/11/report_001.pdf'),(2,2,2,2,'Vaccination Record','Routine MMR vaccination','N/A - Vaccination administered','Pre-vaccination vitals normal\nPost-vaccination observation: 30 minutes, no adverse effects','2024-11-20','/reports/2024/11/report_002.pdf'),(3,3,3,3,'General Consultation','Upper respiratory tract infection (viral)','Paracetamol 500mg - Three times daily for 3 days\nPlenty of fluids and rest\nReturn if fever persists beyond 3 days','Temperature: 38.2°C\nThroat: Mild erythema\nLungs: Clear','2024-11-25','/reports/2024/11/report_003.pdf');
/*!40000 ALTER TABLE `medicalreport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notificationID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `appointmentID` int DEFAULT NULL,
  `message` text NOT NULL,
  `notificationDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notificationType` enum('email','sms','system') DEFAULT 'email',
  `status` enum('pending','sent','failed','read') DEFAULT 'pending',
  `recipientEmail` varchar(100) DEFAULT NULL,
  `retryCount` int DEFAULT '0',
  PRIMARY KEY (`notificationID`),
  KEY `appointmentID` (`appointmentID`),
  KEY `idx_user_notifications` (`userID`,`status`),
  KEY `idx_notificationDate` (`notificationDate`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `notification_ibfk_2` FOREIGN KEY (`appointmentID`) REFERENCES `appointments` (`appointmentID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (4,4,4,'Your appointment with Dr. Priya Mendis is confirmed for December 10, 2024 at 10:00 AM','2024-12-09 12:30:00','email','pending','sarah.j@email.com',0);
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `patientID` int NOT NULL AUTO_INCREMENT,
  `title` varchar(10) DEFAULT NULL,
  `userID` int NOT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `address` text,
  `emergencyContact` varchar(20) DEFAULT NULL,
  `allergies` text,
  `nic` varchar(20) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'Sri Lanka',
  `patientCode` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`patientID`),
  UNIQUE KEY `userID` (`userID`),
  UNIQUE KEY `uq_patient_nic` (`nic`),
  UNIQUE KEY `uq_patient_code` (`patientCode`),
  KEY `idx_dateOfBirth` (`dateOfBirth`),
  CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,NULL,1,'1990-05-15','123, Galle Road, Colombo 03','071-9999999','Penicillin','TEMP-NIC-1','Sri Lanka','PT-00001'),(2,NULL,2,'1985-08-22','456, Kandy Road, Kandy','077-8888888','None','TEMP-NIC-2','Sri Lanka','PT-00002'),(3,NULL,3,'1995-03-10','789, Negombo Road, Negombo','076-7777777','Pollen, Dust','TEMP-NIC-3','Sri Lanka','PT-00003'),(4,NULL,4,'1992-11-30','321, Gampaha Road, Gampaha','070-6666666','Latex','TEMP-NIC-4','Sri Lanka','PT-00004'),(5,NULL,5,'1988-07-18','654, Matara Road, Matara','071-5555555','Aspirin','TEMP-NIC-5','Sri Lanka','PT-00005'),(6,NULL,17,'1995-06-20','789, Colombo Road, Galle','077-1234567','None','TEMP-NIC-6','Sri Lanka','PT-00006');
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `paymentID` int NOT NULL AUTO_INCREMENT,
  `appointmentID` int NOT NULL,
  `invoiceID` int NOT NULL,
  `accountantID` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `refundAmount` decimal(10,2) DEFAULT '0.00',
  `paymentMethod` enum('cash','card','online','insurance') NOT NULL,
  `paymentDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','processing','completed','failed','refunded') DEFAULT 'pending',
  `transactionID` varchar(100) DEFAULT NULL,
  `paymentGatewayResponse` text,
  PRIMARY KEY (`paymentID`),
  KEY `appointmentID` (`appointmentID`),
  KEY `invoiceID` (`invoiceID`),
  KEY `accountantID` (`accountantID`),
  KEY `idx_payment_status` (`status`),
  KEY `idx_transactionID` (`transactionID`),
  KEY `idx_paymentDate` (`paymentDate`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`appointmentID`) REFERENCES `appointments` (`appointmentID`) ON DELETE RESTRICT,
  CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`invoiceID`) REFERENCES `invoice` (`invoiceID`) ON DELETE RESTRICT,
  CONSTRAINT `payment_ibfk_3` FOREIGN KEY (`accountantID`) REFERENCES `accountant` (`accountantID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,1,1,3500.00,0.00,'card','2024-11-15 04:15:00','completed','TXN-001-2024-1115',NULL),(2,2,2,1,2400.00,0.00,'online','2024-11-20 03:30:00','completed','PAYHERE-20241120-9876',NULL),(3,3,3,1,2000.00,0.00,'cash','2024-11-25 11:00:00','completed',NULL,NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receptionist`
--

DROP TABLE IF EXISTS `receptionist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receptionist` (
  `receptionistID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `shiftTime` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`receptionistID`),
  UNIQUE KEY `userID` (`userID`),
  CONSTRAINT `receptionist_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receptionist`
--

LOCK TABLES `receptionist` WRITE;
/*!40000 ALTER TABLE `receptionist` DISABLE KEYS */;
INSERT INTO `receptionist` VALUES (1,10,'Morning (8:00 AM - 2:00 PM)','Front Desk'),(2,11,'Evening (2:00 PM - 8:00 PM)','Front Desk');
/*!40000 ALTER TABLE `receptionist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemsettings`
--

DROP TABLE IF EXISTS `systemsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemsettings` (
  `settingID` int NOT NULL AUTO_INCREMENT,
  `settingName` varchar(100) NOT NULL,
  `settingValue` text NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `description` text,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedByAdminID` int DEFAULT NULL,
  PRIMARY KEY (`settingID`),
  UNIQUE KEY `settingName` (`settingName`),
  KEY `updatedByAdminID` (`updatedByAdminID`),
  KEY `idx_category` (`category`),
  CONSTRAINT `systemsettings_ibfk_1` FOREIGN KEY (`updatedByAdminID`) REFERENCES `admin` (`adminID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemsettings`
--

LOCK TABLES `systemsettings` WRITE;
/*!40000 ALTER TABLE `systemsettings` DISABLE KEYS */;
INSERT INTO `systemsettings` VALUES (1,'appointment_slot_duration','30','appointment','Default appointment slot duration in minutes','2025-12-07 15:54:49',NULL),(2,'max_appointments_per_slot','1','appointment','Maximum number of appointments per time slot','2025-12-07 15:54:49',NULL),(3,'consultation_fee_tax_rate','0','billing','Tax rate percentage for consultation fees','2025-12-07 15:54:49',NULL),(4,'appointment_cancellation_hours','24','appointment','Minimum hours before appointment for cancellation','2025-12-07 15:54:49',NULL),(5,'system_email','admin@primeheal.com','notification','System email address for notifications','2025-12-07 15:54:49',NULL),(6,'notification_retry_limit','3','notification','Maximum retry attempts for failed notifications','2025-12-07 15:54:49',NULL);
/*!40000 ALTER TABLE `systemsettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `userType` enum('patient','doctor','receptionist','accountant','admin') NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userID`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_userType` (`userType`),
  KEY `idx_isActive` (`isActive`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'John Silva','john.silva@email.com','$2a$10$samplehash1','071-1234567','patient',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(2,'Mary Perera','mary.perera@email.com','$2a$10$samplehash2','077-2345678','patient',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(3,'David Fernando','david.fernando@email.com','$2a$10$samplehash3','076-3456789','patient',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(4,'Sarah Jayasinghe','sarah.j@email.com','$2a$10$samplehash4','070-4567890','patient',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(5,'Mike Rajapaksa','mike.r@email.com','$2a$10$samplehash5','071-5678901','patient',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(6,'Dr. Nimal Bandara','dr.nimal@primeheal.com','$2a$10$samplehash6','071-7777777','doctor',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(7,'Dr. Kamala Wijesinghe','dr.kamala@primeheal.com','$2a$10$samplehash7','077-8888888','doctor',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(8,'Dr. Sunil Gunasekara','dr.sunil@primeheal.com','$2a$10$samplehash8','076-9999999','doctor',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(9,'Dr. Priya Mendis','dr.priya@primeheal.com','$2a$10$samplehash9','070-1111111','doctor',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(10,'Sanduni Kumari','sanduni@primeheal.com','$2a$10$samplehash10','071-2222222','receptionist',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(11,'Anjali Dissanayake','anjali@primeheal.com','$2a$10$samplehash11','077-3333333','receptionist',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(12,'Ruwan De Silva','ruwan@primeheal.com','$2a$10$samplehash12','076-4444444','accountant',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(13,'Admin User','admin@primeheal.com','$2a$10$samplehash13','071-0000000','admin',1,'2025-12-07 16:24:43','2025-12-07 16:24:43'),(17,'Kasun Perera','kasun.perera@email.com','$2a$10$hashedpassword','077-9876543','patient',1,'2026-05-09 11:13:22','2026-05-09 11:13:22');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-23 18:27:04
