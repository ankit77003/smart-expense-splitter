import React from "react";
import { api, setToken } from "./api";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(() => {
    const raw = localStorage.getItem("ses_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    const { token, user: u } = await api.login({ email, password });
    setToken(token);
    localStorage.setItem("ses_user", JSON.stringify(u));
    setUser(u);
  };

  const register = async (name, email, password) => {
    const { token, user: u } = await api.register({ name, email, password });
    setToken(token);
    localStorage.setItem("ses_user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("ses_user");
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

