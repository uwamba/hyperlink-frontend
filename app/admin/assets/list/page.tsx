"use client";

import { useState, useEffect } from "react";
import DashboardLayout from '@/components/layouts/DashboardLayout';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function AssetList() {
  const [assets, setAssets] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("Authentication required. Please log in.");
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (authToken) fetchAssets();
  }, [authToken]);

  const fetchAssets = async () => {
    if (!authToken) return;

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
    if (!authToken) return;
    try {
      const response = await fetch(`${API_URL}/assets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete asset");
      setAssets(assets.filter((asset) => asset.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Asset List</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Serial Number</th>
                <th className="border px-4 py-2">Value</th>
                <th className="border px-4 py-2">Purchase Date</th>
                <th className="border px-4 py-2">Location</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(assets) && assets.length > 0 ? (
                assets.map((asset) => (
                  <tr key={asset.id} className="border">
                    <td className="border px-4 py-2">{asset.name}</td>
                    <td className="border px-4 py-2">{asset.category}</td>
                    <td className="border px-4 py-2">{asset.serial_number}</td>
                    <td className="border px-4 py-2">{asset.value}</td>
                    <td className="border px-4 py-2">{asset.purchase_date}</td>
                    <td className="border px-4 py-2">{asset.location}</td>
                    <td className="border px-4 py-2">{asset.status}</td>
                    <td className="border px-4 py-2 flex gap-2 flex-wrap">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => console.log("View asset", asset.id)}
                      >
                        View
                      </button>
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => console.log("Edit asset", asset.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => deleteAsset(asset.id)}
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
        )}
      </div>
    </DashboardLayout>
  );
}
