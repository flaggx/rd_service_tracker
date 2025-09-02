import React, { useEffect, useState, useCallback } from "react";
import { api } from "../fetch";
import CreateTicketForm from "./CreateTicketForm";

export default function TicketBoard() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadTickets = useCallback(async () => {
        try {
            const res = await api.tickets.list(); // returns { data, pagination }
            setTickets(res.data || []);
        } catch (err) {
            console.error("Failed to load tickets:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    if (loading) return <div>Loading tickets...</div>;

    return (
        <div>
            <h2>Ticket Board</h2>

            <CreateTicketForm onCreated={loadTickets} />

            {tickets.length === 0 && <div>No tickets yet.</div>}
            {tickets.map(t => (
                <div key={t.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <div>
                        <strong>{t.accountName}</strong> — {t.city}
                    </div>
                    <div style={{ fontSize: "0.9em", color: "#555" }}>
                        Priority: {t.priority || "LOW"}
                        {t.workType ? ` | Work: ${t.workType}` : ""}
                        {t.lease ? " | Lease" : ""}
                        {t.underWarranty ? " | Under warranty" : ""}
                    </div>
                    {t.issueDescription && (
                        <div style={{ marginTop: 4 }}>{t.issueDescription}</div>
                    )}
                    {Array.isArray(t.images) && t.images.length > 0 && (
                        <ul style={{ marginTop: 6 }}>
                            {t.images.map(img => (
                                <li key={img.id}>
                                    <a href={img.url} target="_blank" rel="noreferrer">
                                        {img.url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}