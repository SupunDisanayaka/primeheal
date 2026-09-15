import React, { createContext, useState } from "react";

export const AdminContext = createContext();

const AdminContextProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(
    sessionStorage.getItem("adminToken") || ""
  );

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
        sessionStorage.setItem("adminToken", data.token);
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
    sessionStorage.removeItem("adminToken");
  };

  const value = {
    adminToken,
    setAdminToken,
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
