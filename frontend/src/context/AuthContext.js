import React, { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../services/api";

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      localStorage.removeItem("auth_token");
      setUser(null);
      setError("Authentication failed. Please log in again.");
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      localStorage.setItem("auth_token", token);
      setUser(user);
      setError(null);
      return user;
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      localStorage.setItem("auth_token", token);
      setUser(user);
      setError(null);
      return user;
    } catch (err) {
      console.error("Registration failed:", err);
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
