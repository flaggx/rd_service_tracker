import React, { useEffect, useState } from "react";
import { apiFetch } from "../fetch";

export default function TicketBoard() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    async function loadTickets() {
      const data = await apiFetch("/tickets");
      setTickets(data);
    }
    loadTickets();
  }, []);

  return (
    <div>
      <h2>Ticket Board</h2>
      {tickets.map(t => (
        <div key={t.id}>
          <strong>{t.title}</strong> — {t.status}
        </div>
      ))}
    </div>
  );
}
