"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setSuppliers(responseData.data);
      } else {
        throw new Error(responseData.message || "Failed to load suppliers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No suppliers found
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
