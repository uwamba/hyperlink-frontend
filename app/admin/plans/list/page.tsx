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
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    provider_price: "",
    duration: "",
    description: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setAuthToken(token);
    fetchPlans(token);
  }, []);

  const fetchPlans = async (token: string | null) => {
    try {
      const res = await fetch(`${API_URL}/plans`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const confirmDeletePlan = (id: number) => {
    setPlanToDelete(id);
    setShowDeleteModal(true);
  };

  const deletePlan = async () => {
    if (!planToDelete) return;

    try {
      const res = await fetch(`${API_URL}/plans/${planToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error("Failed to delete plan");

      setPlans((prev) => prev.filter((plan) => plan.id !== planToDelete));
      setShowDeleteModal(false);
      setPlanToDelete(null);
    } catch (err) {
      setError("Failed to delete plan.");
    }
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      price: String(plan.price),
      provider_price: String(plan.provider_price),
      duration: String(plan.duration),
      description: plan.description,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updatePlan = async () => {
    if (!editingPlan) return;

    try {
      const res = await fetch(`${API_URL}/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price),
          provider_price: parseFloat(editForm.provider_price),
          duration: parseInt(editForm.duration),
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to update plan");

      setPlans((prev) =>
        prev.map((plan) => (plan.id === editingPlan.id ? json.data : plan))
      );

      setShowEditModal(false);
      setEditingPlan(null);
    } catch (err) {
      setError("Failed to update plan.");
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
                  <th className="px-4 py-2 text-left">Actions</th>
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
                    <td className="px-4 py-2 flex gap-2">
                   
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => confirmDeletePlan(plan.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this plan?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPlanToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={deletePlan}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Plan</h2>
            <div className="flex flex-col gap-4">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="border px-3 py-2 rounded"
              />
              <input
                name="price"
                value={editForm.price}
                onChange={handleEditChange}
                placeholder="Price"
                type="number"
                className="border px-3 py-2 rounded"
              />
              <input
                name="provider_price"
                value={editForm.provider_price}
                onChange={handleEditChange}
                placeholder="Provider Price"
                type="number"
                className="border px-3 py-2 rounded"
              />
              <input
                name="duration"
                value={editForm.duration}
                onChange={handleEditChange}
                placeholder="Duration (days)"
                type="number"
                className="border px-3 py-2 rounded"
              />
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updatePlan}
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
