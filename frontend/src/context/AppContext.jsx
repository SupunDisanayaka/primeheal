import { createContext, useState, useEffect, useCallback } from "react";
import { getDoctors, getUserProfile } from "../services/api";
import { doctors as mockDoctors } from "../assets/assets";
import avatar_blue_hair from "../assets/avatar_blue_hair.png";

export const AppContext = createContext();

const USD_TO_LKR_RATE = 300;

const toLkr = (value) => Number((Number(value ?? 0) * USD_TO_LKR_RATE).toFixed(2));

const AppContextProvider = ({ children }) => {
  const currencySymbol = 'LKR '
  const defaultMockProfile = {
    name: "Kasun Dilanka",
    image: avatar_blue_hair,
    profileImage: avatar_blue_hair,
    email: 'richardjameswap@gmail.com',
    phone: '0715442254',
    address: {
      line1: "159/1, high level road",
      line2: "maharagama",
    },
    gender: 'Male',
    dob: '2000-01-20'
  };

  const [token, setToken] = useState(localStorage.getItem('token') || false)
  const [userData, setUserData] = useState(localStorage.getItem('token') ? null : defaultMockProfile)
  const [profileLoading, setProfileLoading] = useState(Boolean(localStorage.getItem('token')))
  const [profileError, setProfileError] = useState(null)
  const [doctors, setDoctors] = useState(mockDoctors)

  const fetchDoctorsData = useCallback(async () => {
    try {
      const data = await getDoctors();
      if (data.success) {
        setDoctors(data.doctors.map((doctor) => ({
          ...doctor,
          fees: doctor.fees || 2500
        })));
      } else {
        setDoctors(mockDoctors);
      }
    } catch (error) {
      console.error("Error fetching doctors, falling back to mock doctors:", error);
      setDoctors(mockDoctors);
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
          setUserData(defaultMockProfile);
          setProfileError(data.message || 'Unable to load profile');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserData(defaultMockProfile);
        setProfileError(error.response?.data?.message || error.message || 'Unable to load profile');
        if (error.response && error.response.status === 401) {
          setToken(false);
          localStorage.removeItem('token');
        }
      } finally {
        setProfileLoading(false)
      }
    } else {
      setUserData(defaultMockProfile);
      setProfileLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchDoctorsData();
  }, [fetchDoctorsData])

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile])

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
    fetchDoctorsData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
