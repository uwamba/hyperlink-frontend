"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function PaymentList() {
  const [payments, setPayments] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      fetchPayments();
    }
  }, [authToken]);

  const fetchPayments = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/payments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setPayments(responseData.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchPayments(); // Refresh the list after status update
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Something went wrong while updating status. "+err);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Payments List</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-4 py-2">Invoice ID</th>
                <th className="border px-4 py-2">Amount Paid</th>
                <th className="border px-4 py-2">Payment Method</th>
                <th className="border px-4 py-2">Transaction ID</th>
                <th className="border px-4 py-2">Payment Date</th>
                <th className="border px-4 py-2">Status</th>
                {(userRole === "super_user" || userRole === "manager") && (
                  <th className="border px-4 py-2">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.isArray(payments) && payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="border hover:bg-gray-100">
                  
                    <td className="border px-4 py-2">{payment.invoice_id}</td>
                    <td className="border px-4 py-2">
                      RWF {parseFloat(payment.amount_paid).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{payment.payment_method}</td>
                    <td className="border px-4 py-2">{payment.transaction_id}</td>
                    <td className="border px-4 py-2">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="border px-4 py-2 capitalize">{payment.status}</td>
                    {(userRole === "super_user" || userRole === "manager") && (
                      <td className="border px-4 py-2 space-x-2">
                        {payment.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(payment.id, "approved")}
                              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(payment.id, "rejected")}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    No payments found
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
