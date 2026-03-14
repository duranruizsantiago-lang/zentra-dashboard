import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error retrieving Supabase session", error);
            }
            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };
        checkSession();

        // Listen for internal Supabase auth state changes (login, logout, token refresh)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                    setUser(session?.user || null);
                    setIsAuthenticated(!!session?.user);
                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        try {
            if (!email || !password || typeof email !== "string" || typeof password !== "string") {
                console.error("[AuthContext] Invalid credentials format");
                return false;
            }

            console.log("[AuthContext] Calling supabase.auth.signInWithPassword for:", email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("[AuthContext] Login failed:", error.message, "| Status:", error.status, "| Full error:", JSON.stringify(error));
                return false;
            }

            if (data?.user) {
                console.log("[AuthContext] Login success! User ID:", data.user.id);
                setUser(data.user);
                setIsAuthenticated(true);
                return true;
            }
            console.error("[AuthContext] No user in response data");
            return false;
        } catch (err) {
            console.error("[AuthContext] Auth Exception:", err.message, err);
            return false;
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout failed:", error.message);
        }
        setIsAuthenticated(false);
        setUser(null);
    };

    const resetPassword = async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error("[AuthContext] Password reset error:", err);
            return { success: false, error: err.message };
        }
    };

    const updatePassword = async (newPassword) => {
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error("[AuthContext] Password update error:", err);
            return { success: false, error: err.message };
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, resetPassword, updatePassword, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
