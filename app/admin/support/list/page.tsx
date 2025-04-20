"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

type SupportTicket = {
  id: string;
  client_id: number;
  email: string;
  description: string;
  address: string;
  status: string;
  feedback: string | null;
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchTickets();
    }
  }, [authToken]);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/supports`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTickets(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch tickets.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (ticket: SupportTicket) => {
    try {
      const response = await fetch(`${API_URL}/supports/${ticket.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status: ticket.status,
          feedback: ticket.feedback,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update ticket.");
      }

      alert("Ticket updated and feedback email sent.");
      fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update.");
    }
  };

  const handleStatusChange = (id: string, value: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: value } : t))
    );
  };

  const handleFeedbackChange = (id: string, value: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, feedback: value } : t))
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Support Tickets</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-4 py-2">Client ID</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Feedback</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border hover:bg-gray-100">
                    <td className="border px-4 py-2">{ticket.client_id}</td>
                    <td className="border px-4 py-2">{ticket.email}</td>
                    <td className="border px-4 py-2">{ticket.description}</td>
                    <td className="border px-4 py-2">
                      <select
                        className="border rounded px-2 py-1"
                        value={ticket.status}
                        onChange={(e) =>
                          handleStatusChange(ticket.id, e.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="border px-4 py-2">
                      <textarea
                        className="w-full border rounded px-2 py-1"
                        value={ticket.feedback || ""}
                        onChange={(e) =>
                          handleFeedbackChange(ticket.id, e.target.value)
                        }
                      />
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        onClick={() => updateTicket(ticket)}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
