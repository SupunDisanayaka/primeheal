import React, { createContext, useState } from "react";

export const DoctorContext = createContext();

const DoctorContextProvider = ({ children }) => {
  const getStoredDoctorName = () => {
    const stored = sessionStorage.getItem("currentDoctorName");
    if (stored) return stored;
    const token = sessionStorage.getItem("doctorToken") || sessionStorage.getItem("dToken");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(window.atob(base64));
          if (payload?.name) return payload.name;
        }
      } catch (e) { }
    }
    return sessionStorage.getItem("doctorToken") ? "Doctor" : "";
  };

  const [doctorToken, setDoctorToken] = useState(
    sessionStorage.getItem("doctorToken") || ""
  );
  
  const [currentDoctorId, setCurrentDoctorId] = useState(
    sessionStorage.getItem("currentDoctorId") || ""
  );
  
  const [currentDoctorName, setCurrentDoctorName] = useState(getStoredDoctorName);

  const login = async (email, password) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Doctor login response:', { status: response.status, data });

      if (data.success && data.user?.userType === "doctor") {
        const idVal = String(data.user._id || data.user.userID || data.user.doctorID || data.user.roleID || "");
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("receptionistToken");
        sessionStorage.removeItem("accountantToken");
        sessionStorage.removeItem("aToken");
        setDoctorToken(data.token);
        setCurrentDoctorId(idVal);
        const docName = data.user.name || "Doctor";
        setCurrentDoctorName(docName);
        sessionStorage.setItem("doctorToken", data.token);
        sessionStorage.setItem("currentDoctorId", idVal);
        sessionStorage.setItem("currentDoctorName", docName);
        return true;
      }
      
      console.log('Doctor login failed:', data);
      return false;
    } catch (error) {
      console.error('Doctor login error:', error);
      return false;
    }
  };

  const logout = () => {
    setDoctorToken("");
    setCurrentDoctorId("");
    setCurrentDoctorName("");
    sessionStorage.removeItem("doctorToken");
    sessionStorage.removeItem("currentDoctorId");
    sessionStorage.removeItem("currentDoctorName");
  };

  const value = {
    doctorToken,
    setDoctorToken,
    currentDoctorId,
    setCurrentDoctorId,
    currentDoctorName,
    login,
    logout
  };

  return (
    <DoctorContext.Provider value={value}>
      {children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
