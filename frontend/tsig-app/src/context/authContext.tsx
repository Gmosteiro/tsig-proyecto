// src/context/AuthContext.tsx
import { createContext, useContext, useState } from "react";

import { User } from "../lib/types/types";

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
    const [user, setUser] = useState<User | null>(null);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(newUser);

        setTimeout(logout, 300 * 60 * 1000); //5 horas
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const value: AuthContextType = {
        isAuthenticated: !!token,
        token,
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};