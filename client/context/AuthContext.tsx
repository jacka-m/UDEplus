import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

export interface User {
  id: string;
  username: string;
  zipCode: string;
  language: string; // e.g., "en", "es", "fr"
  completedOnboarding: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("ude_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("ude_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newUser: User) => {
    setUser(newUser);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("ude_user", JSON.stringify(newUser));
    }, 500);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    localStorage.removeItem("ude_user");
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("ude_user", JSON.stringify(updatedUser));
    }, 500);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      updateUser,
      isAuthenticated: !!user,
    }),
    [user, isLoading, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
