"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Plan {
  id: string;
  name: string;
  price: string;
  duration: string;
  description: string;
}

export default function PlansList() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/plans`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.data)) {
          setPlans(data.data); // Set the 'data' array
        } else {
          throw new Error("Invalid data format received.");
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Plans List</h2>

        {error && <p className="text-red-500">{error}</p>}
        {loading && <p>Loading...</p>}

        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Duration</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b">
                <td className="px-4 py-2">{plan.name}</td>
                <td className="px-4 py-2">{plan.price}</td>
                <td className="px-4 py-2">{plan.duration}</td>
                <td className="px-4 py-2">{plan.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
