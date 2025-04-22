"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Supplier {
  id: number;
  supplier_id: string;
  name: string;
  address: string | null;
  telephone: string | null;
  email: string;
  created_at: string;
}

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    telephone: "",
    email: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setAuthToken(token);
    fetchSuppliers(token);
  }, []);

  const fetchSuppliers = async (token: string | null) => {
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();
      if (response.ok && Array.isArray(json.data)) {
        setSuppliers(json.data);
      } else {
        throw new Error(json.message || "Failed to load suppliers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteSupplier = (id: number) => {
    setSupplierToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteSupplier = async () => {
    if (!supplierToDelete || !authToken) return;

    try {
      const res = await fetch(`${API_URL}/suppliers/${supplierToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error("Failed to delete supplier");

      setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete));
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    } catch (err) {
      setError("Failed to delete supplier.");
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      address: supplier.address || "",
      telephone: supplier.telephone || "",
      email: supplier.email,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updateSupplier = async () => {
    if (!editingSupplier || !authToken) return;

    try {
      const res = await fetch(`${API_URL}/suppliers/${editingSupplier.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to update supplier");

      setSuppliers((prev) =>
        prev.map((s) => (s.id === editingSupplier.id ? json.data : s))
      );

      setShowEditModal(false);
      setEditingSupplier(null);
    } catch (err) {
      setError("Failed to update supplier.");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Suppliers List</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-4 py-2">Supplier ID</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Address</th>
                <th className="border px-4 py-2">Telephone</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Created At</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border hover:bg-gray-100">
                    <td className="border px-4 py-2">{supplier.supplier_id}</td>
                    <td className="border px-4 py-2">{supplier.name}</td>
                    <td className="border px-4 py-2">{supplier.address || "-"}</td>
                    <td className="border px-4 py-2">{supplier.telephone || "-"}</td>
                    <td className="border px-4 py-2">{supplier.email}</td>
                    <td className="border px-4 py-2">
                      {new Date(supplier.created_at).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => openEditModal(supplier)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => confirmDeleteSupplier(supplier.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No suppliers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this supplier?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSupplierToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={deleteSupplier}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Supplier</h2>
            <div className="flex flex-col gap-4">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="border px-3 py-2 rounded"
              />
              <input
                name="address"
                value={editForm.address}
                onChange={handleEditChange}
                placeholder="Address"
                className="border px-3 py-2 rounded"
              />
              <input
                name="telephone"
                value={editForm.telephone}
                onChange={handleEditChange}
                placeholder="Telephone"
                className="border px-3 py-2 rounded"
              />
              <input
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                placeholder="Email"
                type="email"
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSupplier(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateSupplier}
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
