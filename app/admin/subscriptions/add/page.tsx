"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function SubscribeClient() {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    plan_id: "",
    start_date: "",
    end_date: "",
    billing_date: "",
    status: "active",
  });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    }
    setAuthToken(token);

    const fetchData = async () => {
      try {
        const clientsResponse = await fetch(`${API_URL}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const plansResponse = await fetch(`${API_URL}/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!clientsResponse.ok || !plansResponse.ok) {
          throw new Error("Failed to fetch clients or plans");
        }

        const clientsData = await clientsResponse.json();
        const plansData = await plansResponse.json();

        setClients(clientsData.data);
        setPlans(plansData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    fetchData();
  }, [authToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!authToken) {
      setError("You are not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });
      if (contractFile) {
        payload.append("contract", contractFile);
      }

      const response = await fetch(`${API_URL}/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Subscription creation failed");
      }

      setSuccess("Client subscribed successfully!");
      setFormData({
        client_id: "",
        plan_id: "",
        start_date: "",
        end_date: "",
        billing_date: "",
        status: "active",
      });
      setContractFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-center text-2xl font-bold">Subscribe Client to Plan</h2>

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-500">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                Select Client
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="plan_id" className="block text-sm font-medium text-gray-700">
                Select Plan
              </label>
              <select
                name="plan_id"
                value={formData.plan_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price} / {plan.duration}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="billing_date" className="block text-sm font-medium text-gray-700">
                Billing Date
              </label>
              <input
                type="date"
                name="billing_date"
                value={formData.billing_date}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contract" className="block text-sm font-medium text-gray-700">
                Contract File (PDF/DOC)
              </label>
              <input
                type="file"
                name="contract"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Subscribing..." : "Subscribe Client"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
