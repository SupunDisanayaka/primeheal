import { createContext, useState } from "react";
import { doctors } from "../assets/assets";
import avatar_blue_hair from "../assets/avatar_blue_hair.png";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
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

  const value = {
    doctors,
    currencySymbol,
    token,
    setToken,
    userData,
    setUserData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
