import React, { useContext } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Navbar from "./components/Navbar";
import Appointment from "./pages/Appointment";
import Complaints from "./pages/Complaints";
import Footer from "./components/Footer";
import { AppContext } from "./context/AppContext";


const App = () => {
  const { token } = useContext(AppContext);
  const location = useLocation();

  // Determine if we should display the clean, fullscreen login layout
  const isLoginScreen = (location.pathname === '/' && !token) || location.pathname === '/login';
  const isHome = location.pathname === '/' && token;

  return (
    <div className={isLoginScreen ? "w-full min-h-screen bg-white" : isHome ? "w-full min-h-screen bg-white relative" : "mx-4 sm:mx-[10%]"}>
      {!isLoginScreen && <Navbar />}
      <Routes>
        <Route path='/' element={token ? <Home /> : <Login />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={token ? <MyProfile /> : <Navigate to='/login' replace />} />
        <Route path='/my-appointments' element={token ? <MyAppointments /> : <Navigate to='/login' replace />} />
        <Route path='/complaints' element={<Complaints />} />
        <Route path='/appointment/:docID' element={<Appointment />} />
      </Routes>
      {!isLoginScreen && (
        <div className={isHome ? "mx-4 sm:mx-[10%]" : ""}>
          <Footer />
        </div>
      )}
    </div>
  );
};

export default App;
