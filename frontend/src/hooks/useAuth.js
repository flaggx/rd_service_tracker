import { useCallback, useEffect, useState } from "react";
import { api, apiFetch } from "../fetch";

export function useAuth() {
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

    return { user, setUser, loading, refresh, login, logout };
}

export { useAuth, AuthProvider } from "../context/AuthProvider";
