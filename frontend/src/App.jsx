import { useState, useEffect } from "react";
import Login from "./components/Login";
import TicketBoard from "./components/TicketBoard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Optional: check if user is already logged in on page load
  useEffect(() => {
    fetch("http://localhost:3001/auth/me", {
      credentials: "include", // include session cookie
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    fetch("http://localhost:3001/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => setUser(null));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <>
          <button onClick={handleLogout}>Logout</button>
          <TicketBoard user={user} />
        </>
      )}
    </div>
  );
}

export default App;
