import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // On component mount, check localStorage
    try {
      const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (storedUserInfo) {
        setUserInfo(storedUserInfo);
      }
    } catch (error) {
      console.error('Failed to parse user info from localStorage');
      localStorage.removeItem('userInfo');
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUserInfo(userData);
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;