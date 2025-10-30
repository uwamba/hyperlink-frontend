"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function FloatList() {
  const [floats, setFloats] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingFloat, setEditingFloat] = useState<any | null>(null);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedReason, setEditedReason] = useState("");

  // NEW: pagination states
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = JSON.parse(localStorage.getItem("user") || "null");

    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
      if (userData?.role) {
        setUserRole(userData.role);
      }
    }
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchFloats();
    }
  }, [authToken]);

  const fetchFloats = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/petty-cash-floats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setFloats(responseData.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (floatId: string, newStatus: string) => {
    if (!authToken) return;

    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user?.id) {
      alert("User info not found. Please log in again.");
      return;
    }

    const confirmAction = window.confirm(
      `Are you sure you want to ${newStatus.toUpperCase()} this float request?`
    );

    if (!confirmAction) return;

    try {
      const response = await fetch(`${API_URL}/petty-cash-floats/${floatId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus, approved_by: user.id }),
      });

      if (response.ok) {
        fetchFloats();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating status: " + err);
    }
  };

  const handleEdit = (float: any) => {
    setEditingFloat(float);
    setEditedAmount(float.amount);
    setEditedReason(float.reason);
  };

  const handleEditSubmit = async () => {
    if (!authToken || !editingFloat) return;

    try {
      const response = await fetch(`${API_URL}/petty-cash-floats/${editingFloat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: editedAmount,
          reason: editedReason,
        }),
      });

      if (response.ok) {
        setEditingFloat(null);
        fetchFloats();
      } else {
        alert("Failed to update float.");
      }
    } catch (err) {
      alert("Error updating float: " + err);
    }
  };

  const handleDelete = async (floatId: string) => {
    if (!authToken) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this float?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/petty-cash-floats/${floatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        fetchFloats();
      } else {
        alert("Failed to delete float.");
      }
    } catch (err) {
      alert("Error deleting float: " + err);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(floats.length / itemsPerPage);
  const displayedFloats = floats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const userBalance = floats[0]?.user?.balance ?? 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Float Requests</h2>

        <div className="mb-4 flex justify-between items-center">
          <p className="text-lg font-medium text-gray-700">
            Current Balance:{" "}
            <span className="font-bold text-green-600">
              RWF {parseFloat(userBalance).toLocaleString()}
            </span>
          </p>

          {/* Items per page selector */}
          <div>
            <label className="mr-2 font-medium text-gray-700">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing limit
              }}
              className="border rounded px-2 py-1"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="ml-1 text-gray-700">items</span>
          </div>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="border px-4 py-2">Float ID</th>
                  <th className="border px-4 py-2">Requested By</th>
                  <th className="border px-4 py-2">Amount</th>
                  <th className="border px-4 py-2">Reason</th>
                  <th className="border px-4 py-2">Date Requested</th>
                  <th className="border px-4 py-2">Status</th>
                  {userRole === "super_user" && (
                    <th className="border px-4 py-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white">
                {displayedFloats.length > 0 ? (
                  displayedFloats.map((float) => (
                    <tr key={float.id} className="border hover:bg-gray-100">
                      <td className="border px-4 py-2">{float.id}</td>
                      <td className="border px-4 py-2">{float.user?.name || "N/A"}</td>
                      <td className="border px-4 py-2">
                        RWF {parseFloat(float.amount).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2">{float.reason}</td>
                      <td className="border px-4 py-2">
                        {new Date(float.created_at).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2 capitalize">{float.status}</td>
                      {userRole === "super_user" && (
                        <td className="border px-4 py-2 space-x-2">
                          {float.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(float.id, "approved")}
                                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(float.id, "rejected")}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(float)}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(float.id)}
                            className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No float requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination controls */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-gray-600">
                Page {currentPage} of {totalPages || 1}
              </p>
              <div className="space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Edit Form */}
        {editingFloat && (
          <div className="mt-6 border p-4 rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">Edit Float #{editingFloat.id}</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium">Amount:</label>
                <input
                  type="number"
                  value={editedAmount}
                  onChange={(e) => setEditedAmount(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Reason:</label>
                <textarea
                  value={editedReason}
                  onChange={(e) => setEditedReason(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={handleEditSubmit}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingFloat(null)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
