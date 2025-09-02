import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, apiFetch } from "../fetch";

const AuthContext = createContext({
    user: null,
    loading: true,
    login: async (_creds) => {},
    logout: async () => {},
    refresh: async () => {},
    setUser: (_u) => {}
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await apiFetch("/auth/me");
            if (res && res.authenticated && res.user) {
                setUser(res.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = useCallback(async ({ username, password }) => {
        await api.auth.login({ username, password });
        await refresh();
    }, [refresh]);

    const logout = useCallback(async () => {
        try {
            await api.auth.logout();
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({ user, loading, login, logout, refresh, setUser }), [
        user,
        loading,
        login,
        logout,
        refresh
    ]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}

export default AuthProvider;