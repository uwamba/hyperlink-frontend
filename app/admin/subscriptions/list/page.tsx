"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function SubscribeClient() {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    plan_id: "",
    start_date: "",
    end_date: "",
    status: "active",
  });

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    client_id: "",
    plan_id: "",
    start_date: "",
    end_date: "",
    status: "active",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
    }
    setAuthToken(token);

    const fetchData = async () => {
      try {
        const [clientsRes, plansRes, subsRes] = await Promise.all([
          fetch(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/plans`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/subscriptions`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!clientsRes.ok || !plansRes.ok || !subsRes.ok) throw new Error("Failed to fetch data");

        const clientsData = await clientsRes.json();
        const plansData = await plansRes.json();
        const subsData = await subsRes.json();

        setClients(clientsData.data);
        setPlans(plansData.data);
        setSubscriptions(subsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    fetchData();
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const openEditModal = (subscription: any) => {
    console.log("Opening edit modal for subscription:", subscription); // Debug log
    setEditingSub(subscription);
    setEditForm({
      client_id: subscription.client_id,
      plan_id: subscription.plan_id,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      status: subscription.status,
    });
    setShowEditModal(true);
  };

  const updateSubscription = async () => {
    if (!editingSub) return;

    const formDataToSend = new FormData();
    for (const [key, value] of Object.entries(editForm)) {
      formDataToSend.append(key, value);
    }

    try {
      const res = await fetch(`${API_URL}/subscriptions/${editingSub.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      });

      if (!res.ok) throw new Error("Update failed");

      const json = await res.json();
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === editingSub.id ? json.data : sub))
      );
      setShowEditModal(false);
      setEditingSub(null);
    } catch (err) {
      setError("Failed to update subscription.");
    }
  };

  const confirmDeleteSubscription = (id: number) => {
    console.log("Confirming delete for subscription ID:", id); // Debug log
    setSubscriptionToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteSubscription = async () => {
    if (!subscriptionToDelete) return;

    try {
      const res = await fetch(`${API_URL}/subscriptions/${subscriptionToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      setSubscriptions((prev) =>
        prev.filter((sub) => sub.id !== subscriptionToDelete)
      );
      setShowDeleteModal(false);
      setSubscriptionToDelete(null);
    } catch (err) {
      setError("Failed to delete subscription.");
    }
  };

  const handleGenerateInvoice = async (subscriptionId: number) => {
    console.log("Generating invoice for subscription ID:", subscriptionId); // Debug log
    try {
      const res = await fetch(`${API_URL}/generate-invoice/${subscriptionId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_${subscriptionId}.pdf`;
        link.click();
      } else {
        alert("Failed to generate invoice");
      }
    } catch (err) {
      alert("Error generating invoice");
    }
  };

  const handleDownloadContract = async (subscriptionId: number) => {
    console.log("Downloading contract for subscription ID:", subscriptionId); // Debug log
    try {
      const res = await fetch(`${API_URL}/download-contract/${subscriptionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `contract_${subscriptionId}.pdf`;
        link.click();
      } else {
        alert("Failed to download contract");
      }
    } catch (err) {
      alert("Error downloading contract");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Current Subscriptions</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {subscriptions.length === 0 ? (
          <p>No subscriptions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Start</th>
                  <th className="px-4 py-2">End</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-t">
                    <td className="px-4 py-2">{sub.client?.name || sub.client_id}</td>
                    <td className="px-4 py-2">{sub.plan?.name || sub.plan_id}</td>
                    <td className="px-4 py-2">{sub.start_date}</td>
                    <td className="px-4 py-2">{sub.end_date}</td>
                    <td className="px-4 py-2 capitalize">{sub.status}</td>
                    <td className="px-4 py-2 flex flex-wrap gap-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => openEditModal(sub)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => confirmDeleteSubscription(sub.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={() => handleGenerateInvoice(sub.id)}
                      >
                        Invoice
                      </button>
                      <button
                        className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                        onClick={() => handleDownloadContract(sub.id)}
                      >
                        Contract
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit and Delete Modals remain unchanged */}
      {/* Edit Modal */}
{showEditModal && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
      <h2 className="text-lg font-semibold mb-4">Edit Subscription</h2>
      <form>
        <div className="mb-4">
          <label className="block text-sm font-medium">Client</label>
          <select
            name="client_id"
            value={editForm.client_id}
            onChange={handleEditChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm"
          >
            <option value="">— Select client —</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Plan</label>
          <select
            name="plan_id"
            value={editForm.plan_id}
            onChange={handleEditChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm"
          >
            <option value="">— Select plan —</option>
            {plans.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={editForm.start_date}
            onChange={handleEditChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            name="end_date"
            value={editForm.end_date}
            onChange={handleEditChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            value={editForm.status}
            onChange={handleEditChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={updateSubscription}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Delete Confirmation Modal */}
{showDeleteModal && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
      <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete this subscription?</h2>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowDeleteModal(false)}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={deleteSubscription}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

    </DashboardLayout>
  );
}
