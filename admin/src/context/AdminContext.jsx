import React, { createContext, useState } from "react";

export const AdminContext = createContext();

const AdminContextProvider = ({ children }) => {
  const getStoredAdminName = () => {
    const stored = sessionStorage.getItem("currentAdminName");
    if (stored) return stored;
    const token = sessionStorage.getItem("adminToken") || sessionStorage.getItem("aToken");
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
    return sessionStorage.getItem("adminToken") ? "Administrator" : "";
  };

  const [adminToken, setAdminToken] = useState(
    sessionStorage.getItem("adminToken") || ""
  );
  const [currentAdminName, setCurrentAdminName] = useState(getStoredAdminName);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('Admin login response:', { status: response.status, data });
      
      if (data.success && data.user?.userType === 'admin') {
        sessionStorage.removeItem("doctorToken");
        sessionStorage.removeItem("currentDoctorId");
        sessionStorage.removeItem("receptionistToken");
        sessionStorage.removeItem("accountantToken");
        sessionStorage.removeItem("dToken");
        setAdminToken(data.token);
        const name = data.user?.name || "Administrator";
        setCurrentAdminName(name);
        sessionStorage.setItem("adminToken", data.token);
        sessionStorage.setItem("currentAdminName", name);
        return true;
      }
      console.log('Admin login failed:', data);
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = () => {
    setAdminToken("");
    setCurrentAdminName("");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("currentAdminName");
  };

  const value = {
    adminToken,
    setAdminToken,
    currentAdminName,
    login,
    logout
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
