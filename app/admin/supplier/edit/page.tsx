"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Supplier {
  id: number;
  supplier_id: string;
  name: string;
  address: string | null;
  telephone: string | null;
  email: string;
}

export default function EditSupplier() {
  const router = useRouter();
  const { id } = router.query;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSupplier();
    }
  }, [id]);

  const fetchSupplier = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/suppliers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSupplier(data.data);
      } else {
        setError(data.message || "Failed to load supplier");
      }
    } catch (err) {
      setError("An error occurred while fetching supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupplier({ ...supplier!, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    try {
      const res = await fetch(`${API_URL}/suppliers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(supplier),
      });

      if (res.ok) {
        router.push("/suppliers");
      } else {
        const data = await res.json();
        setError(data.message || "Update failed");
      }
    } catch (err) {
      setError("An error occurred while updating");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Supplier</h2>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block font-medium">Supplier ID</label>
              <input
                type="text"
                name="supplier_id"
                value={supplier?.supplier_id || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={supplier?.name || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={supplier?.address || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium">Telephone</label>
              <input
                type="text"
                name="telephone"
                value={supplier?.telephone || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={supplier?.email || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
