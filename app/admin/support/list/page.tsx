"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

type SupportTicket = {
  id: string;
  client_id: string;
  email: string;
  issue: string;
  category: string;
  description: string;
  address: string;
  status: string;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    name: string;
    phone: string;
  };
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      const response = await fetch(`${API_URL}/supports/${ticket.id}`, {
        method: "PUT",
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

      alert("Ticket updated successfully!");
      fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update ticket.");
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

  

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Support Tickets</h2>
        
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full p-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full p-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading tickets...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200 shadow-md rounded-lg">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="border px-4 py-2">Client</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Issue</th>
                  <th className="border px-4 py-2">Category</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Created</th>
                  <th className="border px-4 py-2">Feedback</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border hover:bg-gray-50">
                      <td className="border px-4 py-2">
                        <div className="font-medium">{ticket.client?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">ID: {ticket.client_id}</div>
                      </td>
                      <td className="border px-4 py-2">{ticket.email}</td>
                      <td className="border px-4 py-2">{ticket.issue}</td>
                      <td className="border px-4 py-2 capitalize">{ticket.category}</td>
                      <td className="border px-4 py-2">
                        <select
                          className={`w-full p-1 rounded border ${
                            ticket.status === 'pending' ? 'bg-yellow-100' :
                            ticket.status === 'in_progress' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2 text-sm">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="border px-4 py-2">
                        <textarea
                          className="w-full p-1 border rounded text-sm"
                          value={ticket.feedback || ""}
                          onChange={(e) => handleFeedbackChange(ticket.id, e.target.value)}
                          placeholder="Enter feedback..."
                        />
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          onClick={() => updateTicket(ticket)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      No support tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}