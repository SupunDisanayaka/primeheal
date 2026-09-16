import React, { createContext, useState } from "react";
import { assets } from "../assets/assets";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const currencySymbol = "LKR ";

  // Rich list of doctors with professional Unsplash avatars to ensure premium aesthetics
  const [doctors, setDoctors] = useState([
    {
      _id: "doc1",
      name: "Dr. Richard James",
      email: "richard@primeheal.com",
      image: assets.doc1,
      speciality: "General physician",
      degree: "MBBS",
      experience: "4 Years",
      about: "Dr. Richard James is dedicated to providing comprehensive medical care, with a strong focus on preventive health, early diagnosis, and personalized wellness plans tailored to each individual.",
      fees: 3500,
      available: true,
      address: {
        line1: "17th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc2",
      name: "Dr. Emily Larson",
      email: "emily@primeheal.com",
      image: assets.doc2,
      speciality: "Gynecologist",
      degree: "MBBS, MD",
      experience: "3 Years",
      about: "Dr. Emily Larson focuses on women's healthcare, offering exceptional prenatal care, gynecological evaluations, and supportive consultations across all stages of life.",
      fees: 4500,
      available: true,
      address: {
        line1: "27th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc3",
      name: "Dr. Sarah Patel",
      email: "sarah@primeheal.com",
      image: assets.doc3,
      speciality: "Dermatologist",
      degree: "MBBS",
      experience: "1 Year",
      about: "Dr. Sarah Patel provides comprehensive skin diagnostics, dermatological procedures, and aesthetic plans, prioritizing clinical safety and radiant skin health.",
      fees: 3000,
      available: true,
      address: {
        line1: "37th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc4",
      name: "Dr. Christopher Lee",
      email: "christopher@primeheal.com",
      image: assets.doc4,
      speciality: "Pediatricians",
      degree: "MBBS, DCH",
      experience: "2 Years",
      about: "Dr. Christopher Lee is highly committed to pediatric care, offering friendly childhood evaluations, immunizations, and developmental tracking in a welcoming environment.",
      fees: 4000,
      available: true,
      address: {
        line1: "47th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc5",
      name: "Dr. Jennifer Garcia",
      email: "jennifer@primeheal.com",
      image: assets.doc5,
      speciality: "Neurologist",
      degree: "MBBS, DM",
      experience: "4 Years",
      about: "Dr. Jennifer Garcia specializes in complex neurological diagnostics, stroke preventions, headache managements, and cutting-edge therapeutics.",
      fees: 3500,
      available: false,
      address: {
        line1: "57th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc6",
      name: "Dr. Andrew Williams",
      email: "andrew@primeheal.com",
      image: assets.doc6,
      speciality: "Gastroenterologist",
      degree: "MBBS",
      experience: "4 Years",
      about: "Dr. Andrew Williams focuses on digestive disorders, liver health management, endoscopies, and promoting optimal digestive well-being.",
      fees: 3800,
      available: true,
      address: {
        line1: "67th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc7",
      name: "Dr. Christopher Davis",
      email: "christopher.d@primeheal.com",
      image: assets.doc7,
      speciality: "General physician",
      degree: "MBBS",
      experience: "4 Years",
      about: "Dr. Christopher Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.",
      fees: 4200,
      available: true,
      address: {
        line1: "17th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc8",
      name: "Dr. Timothy White",
      email: "timothy@primeheal.com",
      image: assets.doc8,
      speciality: "Gynecologist",
      degree: "MBBS",
      experience: "3 Years",
      about: "Dr. Timothy White is dedicated to women's healthcare, offering exceptional prenatal care, gynecological evaluations, and supportive consultations across all stages of life.",
      fees: 4800,
      available: true,
      address: {
        line1: "27th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc9",
      name: "Dr. Ava Mitchell",
      email: "ava@primeheal.com",
      image: assets.doc9,
      speciality: "Dermatologist",
      degree: "MBBS",
      experience: "1 Year",
      about: "Dr. Ava Mitchell provides comprehensive skin diagnostics, dermatological procedures, and aesthetic plans, prioritizing clinical safety and radiant skin health.",
      fees: 3200,
      available: true,
      address: {
        line1: "37th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc10",
      name: "Dr. Jeffrey King",
      email: "jeffrey@primeheal.com",
      image: assets.doc10,
      speciality: "Pediatricians",
      degree: "MBBS",
      experience: "2 Years",
      about: "Dr. Jeffrey King is highly committed to pediatric care, offering friendly childhood evaluations, immunizations, and developmental tracking in a welcoming environment.",
      fees: 3900,
      available: true,
      address: {
        line1: "47th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc11",
      name: "Dr. Zoe Kelly",
      email: "zoe@primeheal.com",
      image: assets.doc11,
      speciality: "Neurologist",
      degree: "MBBS",
      experience: "4 Years",
      about: "Dr. Zoe Kelly specializes in complex neurological diagnostics, stroke preventions, headache managements, and cutting-edge therapeutics.",
      fees: 4500,
      available: true,
      address: {
        line1: "57th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc12",
      name: "Dr. Patrick Harris",
      email: "patrick@primeheal.com",
      image: assets.doc12,
      speciality: "Gastroenterologist",
      degree: "MBBS",
      experience: "4 Years",
      about: "Dr. Patrick Harris is dedicated to providing comprehensive gastroenterological care and rehabilitation plans, prioritizing clinical safety and healthy recovery.",
      fees: 4600,
      available: true,
      address: {
        line1: "57th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc13",
      name: "Dr. Chloe Evans",
      email: "chloe@primeheal.com",
      image: assets.doc13,
      speciality: "General physician",
      degree: "MBBS",
      experience: "4 Years",
      about: "Dr. Chloe Evans has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.",
      fees: 3600,
      available: true,
      address: {
        line1: "17th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc14",
      name: "Dr. Ryan Martinez",
      email: "ryan@primeheal.com",
      image: assets.doc14,
      speciality: "Gynecologist",
      degree: "MBBS",
      experience: "3 Years",
      about: "Dr. Ryan Martinez focuses on women's healthcare, offering exceptional prenatal care, gynecological evaluations, and supportive consultations.",
      fees: 4700,
      available: true,
      address: {
        line1: "27th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    },
    {
      _id: "doc15",
      name: "Dr. Amelia Hill",
      email: "amelia@primeheal.com",
      image: assets.doc15,
      speciality: "Dermatologist",
      degree: "MBBS",
      experience: "1 Year",
      about: "Dr. Amelia Hill provides comprehensive skin diagnostics, dermatological procedures, and aesthetic plans, prioritizing clinical safety and skin health.",
      fees: 3300,
      available: true,
      address: {
        line1: "37th Cross, Richmond",
        line2: "Circle, Ring Road, London"
      }
    }
  ]);

  const getFormattedDate = (offsetDays = 0) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}, ${month}, ${year}`;
  };

  // Comprehensive list of mock appointments with varying statuses (Pending, Completed, Cancelled)
  const [appointments, setAppointments] = useState([
    {
      _id: "apt1",
      patientName: "Edward Vincent",
      patientEmail: "richardjameswap@gmail.com",
      patientPhone: "+94 77 123 4567",
      patientGender: "Male",
      patientDob: "2000-01-20",
      docId: "doc1",
      slotDate: getFormattedDate(0),
      slotTime: "08:30 PM",
      amount: 3500,
      status: "Pending",
      createdAt: new Date("2026-06-11T10:30:00")
    },
    {
      _id: "apt2",
      patientName: "Edward Vincent",
      patientEmail: "richardjameswap@gmail.com",
      patientPhone: "+94 71 544 2254",
      patientGender: "Male",
      patientDob: "2000-01-20",
      docId: "doc2",
      slotDate: getFormattedDate(0),
      slotTime: "10:30 AM",
      amount: 4500,
      status: "Completed",
      createdAt: new Date("2026-06-11T11:45:00")
    },
    {
      _id: "apt3",
      patientName: "Edward Vincent",
      patientEmail: "richardjameswap@gmail.com",
      patientPhone: "+94 71 544 2254",
      patientGender: "Male",
      patientDob: "2000-01-20",
      docId: "doc3",
      slotDate: getFormattedDate(-1),
      slotTime: "02:00 PM",
      amount: 3000,
      status: "Cancelled",
      createdAt: new Date("2026-06-11T09:15:00")
    },
    {
      _id: "apt4",
      patientName: "Sophia Martinez",
      patientEmail: "sophia@example.com",
      patientPhone: "+94 77 987 6543",
      patientGender: "Female",
      patientDob: "1995-05-12",
      docId: "doc1",
      slotDate: getFormattedDate(0),
      slotTime: "11:00 AM",
      amount: 3500,
      status: "Completed",
      createdAt: new Date("2026-06-11T14:20:00")
    },
    {
      _id: "apt5",
      patientName: "Liam Johnson",
      patientEmail: "liam@example.com",
      patientPhone: "+94 76 555 0192",
      patientGender: "Male",
      patientDob: "1988-11-30",
      docId: "doc4",
      slotDate: getFormattedDate(1),
      slotTime: "04:30 PM",
      amount: 4000,
      status: "Pending",
      createdAt: new Date("2026-06-11T16:10:00")
    },
    {
      _id: "apt6",
      patientName: "Olivia Brown",
      patientEmail: "olivia@example.com",
      patientPhone: "+94 70 555 0149",
      patientGender: "Female",
      patientDob: "1992-08-15",
      docId: "doc6",
      slotDate: getFormattedDate(0),
      slotTime: "11:30 AM",
      amount: 3800,
      status: "Pending",
      createdAt: new Date("2026-06-11T10:00:00")
    }
  ]);

  const [doctorSchedules, setDoctorSchedules] = useState([
    {
      _id: "sched1",
      docId: "doc1",
      date: getFormattedDate(0),
      availableSlots: ["08:00 AM", "08:30 AM", "09:00 AM", "10:00 AM", "11:00 AM", "08:00 PM", "08:30 PM"]
    },
    {
      _id: "sched2",
      docId: "doc1",
      date: getFormattedDate(1),
      availableSlots: ["04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"]
    }
  ]);

  const [receptionists, setReceptionists] = useState([
    {
      _id: "rec1",
      name: "Alice Johnson",
      email: "alice@primeheal.com",
      phone: "+94 77 555 0101",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      shift: "Morning (08:00 AM - 04:00 PM)",
      deskBlock: "A-Block, Reception Desk 1",
      available: true,
      createdAt: new Date("2024-01-15T08:00:00")
    },
    {
      _id: "rec2",
      name: "David Smith",
      email: "david@primeheal.com",
      phone: "+94 71 555 0102",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
      shift: "Evening (04:00 PM - 12:00 AM)",
      deskBlock: "B-Block, Reception Desk 2",
      available: true,
      createdAt: new Date("2024-02-20T16:00:00")
    }
  ]);

  const [accountants, setAccountants] = useState([
    {
      _id: "acc1",
      name: "Sarah Jenkins",
      email: "sarah.j@primeheal.com",
      phone: "+94 77 555 0201",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      department: "Billing & Insurance",
      shift: "Full-Time (09:00 AM - 05:00 PM)",
      available: true,
      createdAt: new Date("2024-03-10T09:00:00")
    },
    {
      _id: "acc2",
      name: "Robert Miller",
      email: "robert@primeheal.com",
      phone: "+94 71 555 0202",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      department: "Payroll & Accounts",
      shift: "Full-Time (09:00 AM - 05:00 PM)",
      available: false,
      createdAt: new Date("2024-04-05T09:00:00")
    }
  ]);

  const [receptionistToken, setReceptionistToken] = useState(
    localStorage.getItem("receptionistToken") || ""
  );
  const [currentReceptionistId, setCurrentReceptionistId] = useState(
    localStorage.getItem("currentReceptionistId") || ""
  );

  const [accountantToken, setAccountantToken] = useState(
    localStorage.getItem("accountantToken") || ""
  );
  const [currentAccountantId, setCurrentAccountantId] = useState(
    localStorage.getItem("currentAccountantId") || ""
  );

  const loginReceptionist = (email, password) => {
    const foundRec = receptionists.find(
      (rec) => rec.email.toLowerCase() === email.toLowerCase()
    );
    if (foundRec && password === "receptionist") {
      const token = `mock-receptionist-token-${foundRec._id}`;
      setReceptionistToken(token);
      setCurrentReceptionistId(foundRec._id);
      localStorage.setItem("receptionistToken", token);
      localStorage.setItem("currentReceptionistId", foundRec._id);
      return true;
    }
    return false;
  };

  const logoutReceptionist = () => {
    setReceptionistToken("");
    setCurrentReceptionistId("");
    localStorage.removeItem("receptionistToken");
    localStorage.removeItem("currentReceptionistId");
  };

  const loginAccountant = (email, password) => {
    const foundAcc = accountants.find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase()
    );
    if (foundAcc && password === "accountant") {
      const token = `mock-accountant-token-${foundAcc._id}`;
      setAccountantToken(token);
      setCurrentAccountantId(foundAcc._id);
      localStorage.setItem("accountantToken", token);
      localStorage.setItem("currentAccountantId", foundAcc._id);
      return true;
    }
    return false;
  };

  const logoutAccountant = () => {
    setAccountantToken("");
    setCurrentAccountantId("");
    localStorage.removeItem("accountantToken");
    localStorage.removeItem("currentAccountantId");
  };

  const value = {
    doctors,
    setDoctors,
    appointments,
    setAppointments,
    receptionists,
    setReceptionists,
    accountants,
    setAccountants,
    receptionistToken,
    setReceptionistToken,
    currentReceptionistId,
    setCurrentReceptionistId,
    accountantToken,
    setAccountantToken,
    currentAccountantId,
    setCurrentAccountantId,
    loginReceptionist,
    logoutReceptionist,
    loginAccountant,
    logoutAccountant,
    currencySymbol,
    doctorSchedules,
    setDoctorSchedules
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;