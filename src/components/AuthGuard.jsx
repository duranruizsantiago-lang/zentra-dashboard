import React from "react";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";

export default function AuthGuard({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
                {/* Secure blank loading state, avoids leaking unauthenticated screens */}
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    return children;
}
