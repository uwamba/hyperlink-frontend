"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Supplier {
  id: number;
  name: string;
  email: string;
  address: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  provider_price: number;
  duration: number;
  description: string;
  provider_name: string;
  supplier: Supplier | null;
  created_at: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const token = localStorage.getItem("authToken");

    try {
      const res = await fetch(`${API_URL}/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (res.ok) {
        setPlans(json.data || []);
      } else {
        setError(json.message || "Failed to load plans.");
      }
    } catch (err) {
      setError("An error occurred while fetching plans.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6">All Plans</h1>

        {loading && <p>Loading plans...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Provider</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Supplier</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{plan.name}</td>
                    <td className="px-4 py-2">${plan.price}</td>
                    <td className="px-4 py-2">
                      {plan.provider_name} (${plan.provider_price})
                    </td>
                    <td className="px-4 py-2">{plan.duration} days</td>
                    <td className="px-4 py-2">
                      {plan.supplier ? (
                        <>
                          <div className="font-semibold">{plan.supplier.name}</div>
                          <div className="text-sm text-gray-500">{plan.supplier.email}</div>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{plan.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
