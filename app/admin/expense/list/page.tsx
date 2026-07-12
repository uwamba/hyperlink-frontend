"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Expense {
  id: number;
  description: string;
  amount: number;
  expense_date: string;
  category: string | null;
  created_at: string;
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    expense_date: "",
    category: "",
  });

  // 🧭 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20; // Adjust as needed

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setAuthToken(token);
    fetchExpenses(token, currentPage);
  }, [currentPage]);

  const fetchExpenses = async (token: string | null, page = 1) => {
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      // 👇 Adjust this if your backend supports pagination
      const response = await fetch(`${API_URL}/expenses?page=${page}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();

      if (response.ok) {
        // If backend returns paginated data:
        // Example format: { data: [...], meta: { current_page, last_page } }
        if (json.meta) {
          setExpenses(json.data || []);
          setCurrentPage(json.meta.current_page || 1);
          setTotalPages(json.meta.last_page || 1);
        } else {
          // Otherwise, fallback to client-side pagination
          const all = json.data || [];
          setTotalPages(Math.ceil(all.length / itemsPerPage));
          const start = (page - 1) * itemsPerPage;
          setExpenses(all.slice(start, start + itemsPerPage));
        }
      } else {
        throw new Error(json.message || "Failed to load expenses");
      }
    } catch (err) {
      setError("Failed to fetch expenses.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteExpense = (id: number) => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteExpense = async () => {
    if (!expenseToDelete || !authToken) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${expenseToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete expense");
      setExpenses((prev) => prev.filter((exp) => exp.id !== expenseToDelete));
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    } catch (err) {
      setError("Failed to delete expense.");
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      category: expense.category || "",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updateExpense = async () => {
    if (!editingExpense || !authToken) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to update expense");

      setExpenses((prev) =>
        prev.map((exp) => (exp.id === editingExpense.id ? json.data : exp))
      );

      setShowEditModal(false);
      setEditingExpense(null);
    } catch (err) {
      setError("Failed to update expense.");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Expense List</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="border px-4 py-2">Description</th>
                  <th className="border px-4 py-2">Amount</th>
                  <th className="border px-4 py-2">Category</th>
                  <th className="border px-4 py-2">Expense Date</th>
                  <th className="border px-4 py-2">Created At</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border hover:bg-gray-100">
                      <td className="border px-4 py-2">{expense.description}</td>
                      <td className="border px-4 py-2">
                        FRW {parseFloat(expense.amount.toString()).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2">{expense.category || "-"}</td>
                      <td className="border px-4 py-2">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2">
                        {new Date(expense.created_at).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2 flex gap-2">
                        <button
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          onClick={() => openEditModal(expense)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          onClick={() => confirmDeleteExpense(expense.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 🧭 Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this expense?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setExpenseToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={deleteExpense}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Expense</h2>
            <div className="flex flex-col gap-4">
              <input
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
                className="border px-3 py-2 rounded"
              />
              <input
                name="amount"
                type="number"
                value={editForm.amount}
                onChange={handleEditChange}
                placeholder="Amount"
                className="border px-3 py-2 rounded"
              />
              <select
                name="category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="border px-3 py-2 rounded"
              >
                <option value="">Select a category</option>
                <option value="Stationery">Stationery</option>
                <option value="Transport">Transport</option>
                <option value="Food">Food</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
              <input
                name="expense_date"
                type="date"
                value={editForm.expense_date}
                onChange={handleEditChange}
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateExpense}
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
