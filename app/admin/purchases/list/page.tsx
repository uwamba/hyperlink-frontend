"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Purchase {
  id: number;
  invoice_number: string;
  supplier: {
    id: number;
    name: string;
  };
  purchase_date: string;
  total_amount: string;
  note: string | null;
  created_at: string;
}

export default function PurchaseList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/purchases`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setPurchases(responseData.data);
      } else {
        throw new Error(responseData.message || "Failed to load purchases");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Purchases List</h2>

        {error && <p className="text-red-500">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="border rounded-lg overflow-y-scroll h-[450px]">
            <table className="w-full border-collapse">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-2 border">Invoice</th>
                  <th className="px-4 py-2 border">Supplier</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Total Amount</th>
                  <th className="px-4 py-2 border">Note</th>
                  <th className="px-4 py-2 border">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{purchase.invoice_number}</td>
                      <td className="border px-4 py-2">{purchase.supplier?.name}</td>
                      <td className="border px-4 py-2">
                        {new Date(purchase.purchase_date).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2">{purchase.total_amount}</td>
                      <td className="border px-4 py-2">{purchase.note || "-"}</td>
                      <td className="border px-4 py-2">
                        {new Date(purchase.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No purchases found
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
