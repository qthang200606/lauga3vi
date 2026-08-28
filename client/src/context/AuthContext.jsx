import { createContext, useState, useEffect } from "react";
import { getMeApi } from "../api/authApi";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const res = await getMeApi();
          setUser(res.data);
        } catch (error) {
          console.error("Kiểm tra đăng nhập thất bại:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const loginSuccess = (data) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginSuccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};