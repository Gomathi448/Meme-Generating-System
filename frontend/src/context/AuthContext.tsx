import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginData: any) => Promise<void>;
  register: (regData: any) => Promise<void>;
  googleLogin: (googlePayload: any) => Promise<void>;
  logout: () => void;
  updateUserQuota: (quotaUsed: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = "http://localhost:8000/api/v1";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem("refreshToken"));
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      } else {
        // Token is invalid/expired
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching user profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const handleAuthSuccess = (data: any) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("refreshToken", data.refresh_token);
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser({
      id: data.id,
      username: data.username,
      role: data.role,
      email: "", // profile call will fill this
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
      is_active: true,
      created_at: new Date().toISOString()
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const login = async (loginData: any) => {
    setIsLoading(true);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });
    if (!res.ok) {
      const err = await res.json();
      setIsLoading(false);
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    handleAuthSuccess(data);
  };

  const register = async (regData: any) => {
    setIsLoading(true);
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regData),
    });
    if (!res.ok) {
      const err = await res.json();
      setIsLoading(false);
      throw new Error(err.detail || "Registration failed");
    }
    
    // Auto-login after successful signup
    await login({ username: regData.username, password: regData.password });
  };

  const googleLogin = async (payload: any) => {
    setIsLoading(true);
    const res = await fetch(`${API_BASE_URL}/auth/oauth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setIsLoading(false);
      throw new Error("Google login simulation failed");
    }
    const data = await res.json();
    handleAuthSuccess(data);
  };

  const updateUserQuota = (quotaUsed: number) => {
    // Quota updates can be synced with user stats locally
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout: handleLogout,
        updateUserQuota,
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
