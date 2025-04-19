"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Supplier {
  id: number;
  name: string;
}

export default function PurchaseForm() {
  const [formData, setFormData] = useState({
    supplier_id: "",
    invoice_number: "",
    purchase_date: "",
    total_amount: "",
    note: "",
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return setError("Authentication required");
    setAuthToken(token);
    fetchSuppliers(token);
  }, []);

  const fetchSuppliers = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuppliers(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch suppliers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching suppliers");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create purchase");
      }

      setSuccess("Purchase recorded successfully!");
      setFormData({
        supplier_id: "",
        invoice_number: "",
        purchase_date: "",
        total_amount: "",
        note: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto p-4 bg-white shadow-md rounded-md">
        <h2 className="text-xl font-bold mb-4">Record Purchase</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            name="supplier_id"
            value={formData.supplier_id}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="invoice_number"
            placeholder="Invoice Number"
            value={formData.invoice_number}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="date"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="number"
            name="total_amount"
            placeholder="Total Amount"
            value={formData.total_amount}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <textarea
            name="note"
            placeholder="Note (optional)"
            value={formData.note}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Purchase"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
