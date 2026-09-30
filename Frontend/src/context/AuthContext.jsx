import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("tesla_pool_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("tesla_pool_token") || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          if (res.data) {
            setUser(res.data);
            localStorage.setItem("tesla_pool_user", JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn("Session check failed, clearing stored auth:", err.message);
          setUser(null);
          setToken(null);
          localStorage.removeItem("tesla_pool_token");
          localStorage.removeItem("tesla_pool_user");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { user: userData, token: accessToken } = res.data;
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("tesla_pool_token", accessToken);
    localStorage.setItem("tesla_pool_user", JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await api.post("/auth/register", formData);
    // After registration, auto login
    return await login(formData.email, formData.password);
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("tesla_pool_token");
      localStorage.removeItem("tesla_pool_user");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isPassenger: user?.role === "PASSENGER",
        isDriver: user?.role === "DRIVER",
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
