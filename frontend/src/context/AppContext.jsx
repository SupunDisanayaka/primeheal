import { createContext, useState, useEffect } from "react";
import { getDoctors, getUserProfile } from "../services/api";

export const AppContext = createContext();

const USD_TO_LKR_RATE = 300;

const toLkr = (value) => Number((Number(value ?? 0) * USD_TO_LKR_RATE).toFixed(2));

const AppContextProvider = ({ children }) => {
  const currencySymbol = 'Rs. '
  const [token, setToken] = useState(localStorage.getItem('token') || false)
  const [userData, setUserData] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDoctorsData = async () => {
    try {
      const data = await getDoctors();
      if (data.success) {
        setDoctors(data.doctors.map((doctor) => ({
          ...doctor,
          fees: toLkr(doctor.fees)
        })));
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  }

  const loadUserProfile = async () => {
    if (token) {
      try {
        const data = await getUserProfile();
        if (data.success) {
          setUserData(data.profile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // If unauthorized, token might be invalid
        if (error.response && error.response.status === 401) {
          setToken(false);
          localStorage.removeItem('token');
        }
      }
    } else {
      setUserData(false);
    }
  }

  useEffect(() => {
    fetchDoctorsData();
  }, [])

  useEffect(() => {
    loadUserProfile();
  }, [token])

  const value = {
    doctors,
    currencySymbol,
    toLkr,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfile,
    fetchDoctorsData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
