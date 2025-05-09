"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Asset {
  id: number;
  name: string;
  category: string;
  serial_number: string;
  value: string;
  purchase_date: string;
  location: string;
  status: string;
  created_at: string;
}

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    serial_number: "",
    value: "",
    purchase_date: "",
    location: "",
    status: "",
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
    if (authToken) fetchAssets();
  }, [authToken]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_URL}/assets`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const responseData = await response.json();
      if (response.ok && Array.isArray(responseData.data)) {
        setAssets(responseData.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/assets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete asset");
      setAssets((prev) => prev.filter((asset) => asset.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const openViewModal = (asset: Asset) => {
    setViewingAsset(asset);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setEditForm({
      name: asset.name,
      category: asset.category,
      serial_number: asset.serial_number,
      value: asset.value,
      purchase_date: asset.purchase_date,
      location: asset.location,
      status: asset.status,
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updateAsset = async () => {
    if (!editingAsset) return;
    try {
      const res = await fetch(`${API_URL}/assets/${editingAsset.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update asset");

      setAssets((prev) =>
        prev.map((a) => (a.id === editingAsset.id ? json.data : a))
      );
      setEditingAsset(null);
    } catch (err) {
      setError("Failed to update asset.");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Link
            href="/admin/assets/add"
            className="inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            &larr; Add new
          </Link>
        </div>

        <h2 className="text-2xl font-bold mb-4">Asset List</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Category</th>
                  <th className="border px-4 py-2">Serial Number</th>
                  <th className="border px-4 py-2">Value</th>
                  <th className="border px-4 py-2">Purchase Date</th>
                  <th className="border px-4 py-2">Location</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2 min-w-[250px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{asset.name}</td>
                      <td className="border px-4 py-2">{asset.category}</td>
                      <td className="border px-4 py-2">{asset.serial_number}</td>
                      <td className="border px-4 py-2">{asset.value}</td>
                      <td className="border px-4 py-2">{asset.purchase_date}</td>
                      <td className="border px-4 py-2">{asset.location}</td>
                      <td className="border px-4 py-2">{asset.status}</td>
                      <td className="border px-4 py-2 whitespace-nowrap flex items-center gap-x-2">
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          onClick={() => openViewModal(asset)}
                        >
                          View
                        </button>
                        <button
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          onClick={() => openEditModal(asset)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this asset?")) {
                              deleteAsset(asset.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      No assets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Asset Details</h2>
            <p><strong>Name:</strong> {viewingAsset.name}</p>
            <p><strong>Category:</strong> {viewingAsset.category}</p>
            <p><strong>Serial Number:</strong> {viewingAsset.serial_number}</p>
            <p><strong>Value:</strong> {viewingAsset.value}</p>
            <p><strong>Purchase Date:</strong> {viewingAsset.purchase_date}</p>
            <p><strong>Location:</strong> {viewingAsset.location}</p>
            <p><strong>Status:</strong> {viewingAsset.status}</p>
            <div className="mt-4 text-right">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => setViewingAsset(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Asset</h2>
            <div className="flex flex-col gap-4">
              {Object.entries(editForm).map(([key, value]) => (
                <input
                  key={key}
                  name={key}
                  value={value}
                  onChange={handleEditChange}
                  placeholder={key.replace("_", " ")}
                  className="border px-3 py-2 rounded"
                  type={key === "value" ? "number" : key === "purchase_date" ? "date" : "text"}
                />
              ))}
              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={() => setEditingAsset(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={updateAsset}
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
