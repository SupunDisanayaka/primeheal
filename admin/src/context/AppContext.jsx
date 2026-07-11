import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { AdminContext } from "./AdminContext";
import { getDoctors, getAdminAppointments, getAdminDashboard, getAdminRecentAppointments, updateAdminAppointmentStatus } from "../services/api";

export const AppContext = createContext();

const USD_TO_LKR_RATE = 300;

const toLkr = (value) => Number((Number(value ?? 0) * USD_TO_LKR_RATE).toFixed(2));

const AppContextProvider = ({ children }) => {
  const currencySymbol = "Rs. ";

  const [doctors, setDoctors] = useState([]);

  React.useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getDoctors();
        if (data.success) {
          setDoctors(data.doctors.map((doctor) => ({
            ...doctor,
            fees: toLkr(doctor.fees)
          })));
        }
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      }
    };
    fetchDoctors();
  }, []);

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

  const { adminToken } = useContext(AdminContext);

  const getFallbackAppointments = () => ([
    {
      _id: "apt1",
      patientName: "Edward Vincent",
      patientEmail: "richardjameswap@gmail.com",
      patientPhone: "+1 123 456 7890",
      patientGender: "Male",
      patientDob: "2000-01-20",
      docId: "doc1",
      slotDate: getFormattedDate(0),
      slotTime: "08:30 PM",
      amount: toLkr(50),
      status: "Pending",
      createdAt: new Date("2026-06-11T10:30:00")
    },
    {
      _id: "apt2",
      patientName: "Edward Vincent",
      patientEmail: "richardjameswap@gmail.com",
      patientPhone: "+1 123 456 7890",
      patientGender: "Male",
      patientDob: "2000-01-20",
      docId: "doc2",
      slotDate: getFormattedDate(0),
      slotTime: "10:30 AM",
      amount: toLkr(60),
      status: "Completed",
      createdAt: new Date("2026-06-11T11:45:00")
    },
    {
      _id: "apt3",
      patientName: "Edward Vincent",
      patientEmail: "richardjameswap@gmail.com",
      patientPhone: "+1 123 456 7890",
      patientGender: "Male",
      patientDob: "2000-01-20",
      docId: "doc3",
      slotDate: getFormattedDate(-1),
      slotTime: "02:00 PM",
      amount: toLkr(30),
      status: "Cancelled",
      createdAt: new Date("2026-06-11T09:15:00")
    },
    {
      _id: "apt4",
      patientName: "Sophia Martinez",
      patientEmail: "sophia@example.com",
      patientPhone: "+1 987 654 3210",
      patientGender: "Female",
      patientDob: "1995-05-12",
      docId: "doc1",
      slotDate: getFormattedDate(0),
      slotTime: "11:00 AM",
      amount: toLkr(50),
      status: "Completed",
      createdAt: new Date("2026-06-11T14:20:00")
    },
    {
      _id: "apt5",
      patientName: "Liam Johnson",
      patientEmail: "liam@example.com",
      patientPhone: "+1 555 019 2834",
      patientGender: "Male",
      patientDob: "1988-11-30",
      docId: "doc4",
      slotDate: getFormattedDate(1),
      slotTime: "04:30 PM",
      amount: toLkr(40),
      status: "Pending",
      createdAt: new Date("2026-06-11T16:10:00")
    },
    {
      _id: "apt6",
      patientName: "Olivia Brown",
      patientEmail: "olivia@example.com",
      patientPhone: "+1 555 014 9988",
      patientGender: "Female",
      patientDob: "1992-08-15",
      docId: "doc6",
      slotDate: getFormattedDate(0),
      slotTime: "11:30 AM",
      amount: toLkr(50),
      status: "Pending",
      createdAt: new Date("2026-06-11T10:00:00")
    }
  ]);

  // Live admin appointments replace the mock set when an admin is signed in.
  const [appointments, setAppointments] = useState(getFallbackAppointments);
  const [adminDashboardStats, setAdminDashboardStats] = useState(null);
  const [adminRecentAppointments, setAdminRecentAppointments] = useState([]);
  const [adminRecentTransactions, setAdminRecentTransactions] = useState([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminDataError, setAdminDataError] = useState(null);

  const refreshAdminData = useCallback(async () => {
    if (!adminToken) {
      setAppointments(getFallbackAppointments());
      setAdminDashboardStats(null);
      setAdminRecentAppointments([]);
      setAdminRecentTransactions([]);
      setAdminDataError(null);
      return;
    }

    setAdminDataLoading(true);
    setAdminDataError(null);

    try {
      const [appointmentsResponse, dashboardResponse, recentResponse] = await Promise.all([
        getAdminAppointments(),
        getAdminDashboard(),
        getAdminRecentAppointments()
      ]);

      console.log('[ADMIN CONTEXT] appointments loaded', {
        appointmentCount: appointmentsResponse.appointments?.length || 0,
        stats: dashboardResponse.stats || null,
        recentCount: recentResponse.appointments?.length || 0,
        recentTransactionsCount: dashboardResponse.recentTransactions?.length || 0
      });

      setAppointments(appointmentsResponse.appointments || []);
      setAdminDashboardStats(dashboardResponse.stats || null);
      setAdminRecentAppointments(recentResponse.appointments || []);
      setAdminRecentTransactions(dashboardResponse.recentTransactions || []);
    } catch (error) {
      console.error('[ADMIN CONTEXT] failed to load admin appointment data', error);
      setAdminDataError(error.response?.data?.message || error.message || 'Unable to load admin appointments');
    } finally {
      setAdminDataLoading(false);
    }
  }, [adminToken]);

  const syncAppointmentStatus = useCallback(async (appointmentId, status) => {
    const response = await updateAdminAppointmentStatus(appointmentId, status);
    await refreshAdminData();
    return response;
  }, [refreshAdminData]);

  useEffect(() => {
    refreshAdminData();

    if (!adminToken) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refreshAdminData();
    }, 5000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAdminData();
      }
    };

    window.addEventListener('focus', refreshAdminData);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshAdminData);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [adminToken, refreshAdminData]);

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
      phone: "+1 555-0101",
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
      phone: "+1 555-0102",
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
      phone: "+1 555-0201",
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
      phone: "+1 555-0202",
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

  const loginReceptionist = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (data.success && data.user?.userType === "receptionist") {
        setReceptionistToken(data.token);
        setCurrentReceptionistId(data.user._id);
        localStorage.setItem("receptionistToken", data.token);
        localStorage.setItem("currentReceptionistId", data.user._id);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Receptionist login error:", error);
      return false;
    }
  };

  const logoutReceptionist = () => {
    setReceptionistToken("");
    setCurrentReceptionistId("");
    localStorage.removeItem("receptionistToken");
    localStorage.removeItem("currentReceptionistId");
  };

  const loginAccountant = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (data.success && data.user?.userType === "accountant") {
        setAccountantToken(data.token);
        setCurrentAccountantId(data.user._id);
        localStorage.setItem("accountantToken", data.token);
        localStorage.setItem("currentAccountantId", data.user._id);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Accountant login error:", error);
      return false;
    }
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
    adminDashboardStats,
    adminRecentAppointments,
    adminRecentTransactions,
    adminDataLoading,
    adminDataError,
    refreshAdminData,
    syncAppointmentStatus,
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
    toLkr,
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