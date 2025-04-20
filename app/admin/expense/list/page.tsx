"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

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

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setExpenses(responseData.data);
      } else {
        throw new Error(responseData.message || "Failed to load expenses");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
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
          <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Expense Date</th>
                <th className="border px-4 py-2">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border hover:bg-gray-100">
                    <td className="border px-4 py-2">{expense.description}</td>
                    <td className="border px-4 py-2">
                      Ksh {parseFloat(expense.amount.toString()).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{expense.category || "-"}</td>
                    <td className="border px-4 py-2">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(expense.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
