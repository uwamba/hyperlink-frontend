"use client";

import { useState, useEffect } from "react";
import DashboardLayout from '@/components/layouts/DashboardLayout';


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ClientList() {
  const [clients, setClients] = useState<any[]>([]);  // Ensures clients is always an array
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("Authentication required. Please log in");
      setError("Authentication required. Please log in.");
    } else {
      console.log("use authenticated");
      setAuthToken(token);  // This will now trigger the effect after the token is set.
    }
  }, []); // Only runs once, when the component mounts

  useEffect(() => {
    if (authToken) {
      fetchClients();
    }
  }, [authToken]); // This effect depends on authToken and will run whenever it's updated

  const fetchClients = async () => {
    console.log(authToken);
    if (!authToken) return;
    
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const responseData = await response.json();
      
      // Check if responseData contains the 'data' field
      if (response.ok && Array.isArray(responseData.data)) {
        setClients(responseData.data); // Set the 'data' array
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  

  const deleteClient = async (id: number) => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_URL}/clients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete client");
      setClients(clients.filter((client) => client.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <DashboardLayout>

<div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Client List</h2>
      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Address</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(clients) && clients.length > 0 ? (
              clients.map((client) => (
                <tr key={client.id} className="border">
                  <td className="border px-4 py-2">{client.name}</td>
                  <td className="border px-4 py-2">{client.email}</td>
                  <td className="border px-4 py-2">{client.phone}</td>
                  <td className="border px-4 py-2">{client.address}</td>
                  <td className="border px-4 py-2 flex gap-2">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      onClick={() => console.log("Edit client", client.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => deleteClient(client.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4">No clients found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>

    </DashboardLayout>
    
  );
}
