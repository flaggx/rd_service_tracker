import React from "react";
import { useAuth } from "../hooks/useAuth";
import Login from "./Login";

export default function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Login />;

  return <>{children}</>;
}