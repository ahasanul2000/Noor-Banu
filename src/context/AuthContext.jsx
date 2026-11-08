"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY } from "@/lib/api";

const AuthContext = createContext(undefined);

// Cached copy of the profile so the navbar/checkout can use it before /account responds.
const USER_KEY = "noorbanu_user";

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch { /* storage unavailable */ }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // True until we've checked localStorage (and the token with the server).
    const [loading, setLoading] = useState(true);

    const saveSession = useCallback((token, profile) => {
        if (token) writeStorage(TOKEN_KEY, token);
        writeStorage(USER_KEY, profile ? JSON.stringify(profile) : null);
        setUser(profile);
    }, []);

    const clearSession = useCallback(() => {
        writeStorage(TOKEN_KEY, null);
        writeStorage(USER_KEY, null);
        setUser(null);
    }, []);

    // Restore the session after mount (localStorage isn't available during SSR).
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!readStorage(TOKEN_KEY)) {
            setLoading(false);
            return;
        }
        try {
            const cached = JSON.parse(readStorage(USER_KEY) || "null");
            if (cached) setUser(cached);
        } catch { /* ignore a corrupt cache */ }

        api.getAccount().then((res) => {
            if (res.ok) saveSession(null, res.data);
            else if (res.status === 401) clearSession(); // token revoked or expired
            setLoading(false);
        });
    }, [saveSession, clearSession]);
    /* eslint-enable react-hooks/set-state-in-effect */

    /** Each action resolves to the api result ({ ok, message, errors }) so forms can show errors. */
    const login = async (loginId, password) => {
        const res = await api.login(loginId, password);
        if (res.ok) saveSession(res.token, res.data);
        return res;
    };

    const register = async (details) => {
        const res = await api.register(details);
        if (res.ok) saveSession(res.token, res.data);
        return res;
    };

    const logout = async () => {
        await api.logout();
        clearSession();
    };

    const updateProfile = async (details) => {
        const res = await api.updateAccount(details);
        if (res.ok) saveSession(null, res.data);
        return res;
    };

    return (
        <AuthContext.Provider value={{ user, loading, isLoggedIn: Boolean(user), login, register, logout, updateProfile }}>
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
