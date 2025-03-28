"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function PaymentList() {
  const [payments, setPayments] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
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
                <th className="border px-4 py-2">Client ID</th>
                <th className="border px-4 py-2">Invoice ID</th>
                <th className="border px-4 py-2">Amount Paid</th>
                <th className="border px-4 py-2">Payment Method</th>
                <th className="border px-4 py-2">Transaction ID</th>
                <th className="border px-4 py-2">Payment Date</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.isArray(payments) && payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="border hover:bg-gray-100">
                    <td className="border px-4 py-2">{payment.client_id}</td>
                    <td className="border px-4 py-2">{payment.invoice_id}</td>
                    <td className="border px-4 py-2">
                      Ksh {parseFloat(payment.amount_paid).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{payment.payment_method}</td>
                    <td className="border px-4 py-2">{payment.transaction_id}</td>
                    <td className="border px-4 py-2">{new Date(payment.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4">
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
