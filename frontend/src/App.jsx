import React from "react";
import Login from "./components/Login";
import TicketBoard from "./components/TicketBoard";
import { AuthProvider, useAuth } from "./hooks/useAuth";

function InnerApp() {
    const { user, loading, logout } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {!user ? (
                <Login />
            ) : (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>Signed in as {user.username}</div>
                        <button onClick={logout}>Logout</button>
                    </div>
                    <TicketBoard />
                </>
            )}
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <InnerApp />
        </AuthProvider>
    );
}