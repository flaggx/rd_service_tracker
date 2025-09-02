import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await login({ username, password });
        } catch (err) {
            console.error("Login failed:", err);
            alert(err?.body?.message || "Login failed");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
            />
            <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
            />
            <button type="submit">Login</button>
        </form>
    );
}