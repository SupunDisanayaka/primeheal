import React, { createContext, useState } from "react";

export const DoctorContext = createContext();

const DoctorContextProvider = ({ children }) => {
  const [doctorToken, setDoctorToken] = useState(
    localStorage.getItem("doctorToken") || ""
  );
  
  const [currentDoctorId, setCurrentDoctorId] = useState(
    localStorage.getItem("currentDoctorId") || ""
  );

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
        const idVal = data.user._id || data.user.userID || data.user.doctorID || "";
        setDoctorToken(data.token);
        setCurrentDoctorId(idVal);
        localStorage.setItem("doctorToken", data.token);
        localStorage.setItem("currentDoctorId", idVal);
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
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("currentDoctorId");
  };

  const value = {
    doctorToken,
    setDoctorToken,
    currentDoctorId,
    setCurrentDoctorId,
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