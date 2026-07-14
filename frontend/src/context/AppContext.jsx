<<<<<<< HEAD
import { createContext, useState, useEffect, useCallback } from "react";
import { getDoctors, getUserProfile } from "../services/api";
=======
import { createContext, useState } from "react";
import { doctors } from "../assets/assets";
import avatar_blue_hair from "../assets/avatar_blue_hair.png";
>>>>>>> 84f2d783fcc04ef938456dcd307ac9b12820a753

export const AppContext = createContext();

const USD_TO_LKR_RATE = 300;

const toLkr = (value) => Number((Number(value ?? 0) * USD_TO_LKR_RATE).toFixed(2));

const AppContextProvider = ({ children }) => {
<<<<<<< HEAD
  const currencySymbol = 'Rs. '
  const [token, setToken] = useState(localStorage.getItem('token') || false)
  const [userData, setUserData] = useState(null)
  const [profileLoading, setProfileLoading] = useState(Boolean(localStorage.getItem('token')))
  const [profileError, setProfileError] = useState(null)
  const [doctors, setDoctors] = useState([])

  const fetchDoctorsData = useCallback(async () => {
    try {
      const data = await getDoctors();
      if (data.success) {
        setDoctors(data.doctors.map((doctor) => ({
          ...doctor,
          fees: 2500
        })));
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  }, [])

  const loadUserProfile = useCallback(async () => {
    setProfileError(null)

    if (token) {
      setProfileLoading(true)
      try {
        const data = await getUserProfile();
        if (data.success) {
          setUserData(data.profile);
        } else {
          setUserData(null);
          setProfileError(data.message || 'Unable to load profile');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserData(null);
        setProfileError(error.response?.data?.message || error.message || 'Unable to load profile');
        // If unauthorized, token might be invalid
        if (error.response && error.response.status === 401) {
          setToken(false);
          localStorage.removeItem('token');
        }
      } finally {
        setProfileLoading(false)
      }
    } else {
      setUserData(null);
      setProfileLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchDoctorsData();
  }, [fetchDoctorsData])

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile])
=======
  const currencySymbol = 'LKR '  
  const [token, setToken] = useState(false)
  const [userData, setUserData] = useState({
    name: "Kasun Dilanka",
    image: avatar_blue_hair,
    email: 'richardjameswap@gmail.com',
    phone: '0715442254',
    address: {
      line1: "159/1, high level road",
      line2: "maharagama",
    },
    gender: 'Male',
    dob: '2000-01-20'
  })
>>>>>>> 84f2d783fcc04ef938456dcd307ac9b12820a753

  const value = {
    doctors,
    currencySymbol,
    toLkr,
    token,
    setToken,
    userData,
<<<<<<< HEAD
    setUserData,
    profileLoading,
    profileError,
    loadUserProfile,
    fetchDoctorsData
=======
    setUserData
>>>>>>> 84f2d783fcc04ef938456dcd307ac9b12820a753
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
