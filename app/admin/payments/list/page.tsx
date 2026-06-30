"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending:  "bg-orange-100 text-orange-700",
    rejected: "bg-red-100 text-red-700",
  };
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`;
};

export default function PaymentList() {
  const [payments, setPayments]   = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userRole, setUserRole]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem("authToken");
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
      if (userData?.role) setUserRole(userData.role);
    }
  }, []);

  useEffect(() => {
    if (authToken) fetchPayments();
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
          Authorization:  `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchPayments();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Something went wrong while updating status. " + err);
    }
  };

  const canApprove = userRole === "super_user" || userRole === "manager";

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} payment{payments.length !== 1 ? "s" : ""}</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <table className="min-w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Amount Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                  {canApprove && (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {payments.length > 0 ? (
                  payments.map((payment, idx) => (
                    <tr
                      key={payment.id}
                      className={`${idx % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {payment.invoice?.invoice_no || `#${payment.invoice_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {payment.invoice?.client?.name || payment.client?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        RWF {parseFloat(payment.amount_paid).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{payment.payment_method}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">{payment.transaction_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusBadge(payment.status)}>{payment.status}</span>
                      </td>
                      {canApprove && (
                        <td className="px-4 py-3">
                          {payment.status === "pending" ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleStatusChange(payment.id, "approved")}
                                className="text-xs px-3 py-1 rounded-md font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(payment.id, "rejected")}
                                className="text-xs px-3 py-1 rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={canApprove ? 8 : 7} className="text-center py-12 text-gray-400">
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
