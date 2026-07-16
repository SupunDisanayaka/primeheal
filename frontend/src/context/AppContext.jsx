import { createContext, useState, useEffect, useCallback } from "react";
import { getDoctors, getUserProfile } from "../services/api";

export const AppContext = createContext();

const USD_TO_LKR_RATE = 300;

const toLkr = (value) => Number((Number(value ?? 0) * USD_TO_LKR_RATE).toFixed(2));

const AppContextProvider = ({ children }) => {
  const currencySymbol = 'LKR '

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
          fees: doctor.fees || 2500
        })));
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
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

  const backendUrl = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL.replace('/api', '') : 'http://localhost:5000';

  const value = {
    doctors,
    currencySymbol,
    toLkr,
    token,
    setToken,
    userData,
    setUserData,
    profileLoading,
    profileError,
    loadUserProfile,
    fetchDoctorsData,
    backendUrl
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
