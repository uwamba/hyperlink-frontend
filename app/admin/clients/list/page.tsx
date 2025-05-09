"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (authToken) fetchClients();
  }, [authToken]);

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.data)) {
        setClients(data.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteClient = (id: number) => {
    setClientToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteClient = async () => {
    if (!clientToDelete || !authToken) return;
    try {
      const response = await fetch(`${API_URL}/clients/${clientToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete client");
      setClients(clients.filter((client) => client.id !== clientToDelete));
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updateClient = async () => {
    if (!editingClient || !authToken) return;
    try {
      const response = await fetch(`${API_URL}/clients/${editingClient.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update client");

      setClients((prev) =>
        prev.map((client) =>
          client.id === editingClient.id ? data.data : client
        )
      );

      setShowEditModal(false);
      setEditingClient(null);
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
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Phone</th>
                  <th className="border px-4 py-2">Address</th>
                  <th className="border px-4 py-2 w-48">Actions</th> {/* Increased width for Actions column */}
                </tr>
              </thead>
              <tbody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client.id} className="border">
                      <td className="border px-4 py-2">{client.name}</td>
                      <td className="border px-4 py-2">{client.email}</td>
                      <td className="border px-4 py-2">{client.phone}</td>
                      <td className="border px-4 py-2">{client.address}</td>
                      <td className="border px-4 py-2 flex gap-2"> {/* Adjusted flex layout */}
                       
                       
                        <button
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          onClick={() => openEditModal(client)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          onClick={() => confirmDeleteClient(client.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this client?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={deleteClient}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Client</h2>
            <div className="flex flex-col gap-4">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="border px-3 py-2 rounded"
              />
              <input
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleEditChange}
                placeholder="Email"
                className="border px-3 py-2 rounded"
              />
              <input
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
                placeholder="Phone"
                className="border px-3 py-2 rounded"
              />
              <input
                name="address"
                value={editForm.address}
                onChange={handleEditChange}
                placeholder="Address"
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateClient}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
