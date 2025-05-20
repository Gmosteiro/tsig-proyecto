// src/components/core/UnverifiedOnlyRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";

const UnverifiedOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.verified) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default UnverifiedOnlyRoute;