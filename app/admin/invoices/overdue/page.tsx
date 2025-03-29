"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function OverdueInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount_paid: "",
    payment_method: "MPESA",
    transaction_id: "",
  });
  const handleGenerateInvoice = async (subscriptionId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    }
    setAuthToken(token);
    try {
      // Fetch the PDF from the backend
      const response = await fetch(`${API_URL}/download-invoice/${subscriptionId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if the response is OK (successful)
      if (response.ok) {
        // Create a Blob object to trigger the download
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_${subscriptionId}.pdf`; // Name of the downloaded file
        link.click();
      } else {
        alert('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('An error occurred while generating the invoice');
    }
  };
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
      fetchInvoices();
    }
  }, [authToken]);

  const fetchInvoices = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/invoices/overdue`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setInvoices(responseData.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount_paid: invoice.amount, // Default full amount
      payment_method: "MPESA",
      transaction_id: "",
    });
    setModalOpen(true);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const submitPayment = async () => {
    if (!authToken || !selectedInvoice) return;

    const paymentRequest = {
      client_id: selectedInvoice.client_id,
      invoice_id: selectedInvoice.id,
      amount_paid: parseFloat(paymentData.amount_paid),
      payment_method: paymentData.payment_method,
      transaction_id: paymentData.transaction_id || `TXN-${Date.now()}`,
    };

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(paymentRequest),
      });

      const responseData = await response.json();

      if (response.ok) {
        setInvoices((prevInvoices) =>
          prevInvoices.map((inv) =>
            inv.id === selectedInvoice.id
              ? { ...inv, status: parseFloat(paymentData.amount_paid) >= selectedInvoice.amount ? "paid" : "partial" }
              : inv
          )
        );
        setModalOpen(false);
      } else {
        throw new Error(responseData.message || "Payment failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during payment.");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Overdue Invoices</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-4 py-2">Invoice No</th>
                <th className="border px-4 py-2">Client ID</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Due Date</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.isArray(invoices) && invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border hover:bg-gray-100">
                    <td className="border px-4 py-2">{invoice.invoice_no}</td>
                    <td className="border px-4 py-2">{invoice.client_id}</td>
                    <td className="border px-4 py-2">
                      Ksh {parseFloat(invoice.amount).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{invoice.due_date}</td>
                    <td className="border px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          invoice.status === "paid"
                            ? "bg-green-500 text-white"
                            : invoice.status === "partial"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="border px-4 py-2 flex gap-2">
                     <button 
                      onClick={() => handleGenerateInvoice(invoice.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        View Invoice 
                      </button>
                      {invoice.status !== "paid" && (
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          onClick={() => openPaymentModal(invoice)}
                        >
                          Pay Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No unpaid invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Payment Modal */}
        {modalOpen && selectedInvoice && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-bold mb-4">Pay Invoice #{selectedInvoice.invoice_no}</h2>

              <label className="block mb-2">Amount Paid</label>
              <input
                type="number"
                name="amount_paid"
                value={paymentData.amount_paid}
                onChange={handlePaymentChange}
                className="w-full p-2 border rounded mb-4"
              />

              <label className="block mb-2">Payment Method</label>
              <select
                name="payment_method"
                value={paymentData.payment_method}
                onChange={handlePaymentChange}
                className="w-full p-2 border rounded mb-4"
              >
                <option value="MPESA">MPESA</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayPal">PayPal</option>
              </select>

              <label className="block mb-2">Transaction ID</label>
              <input
                type="text"
                name="transaction_id"
                value={paymentData.transaction_id}
                onChange={handlePaymentChange}
                className="w-full p-2 border rounded mb-4"
                placeholder="Optional"
              />

              <div className="flex justify-end gap-2">
                <button className="bg-gray-400 px-4 py-2 rounded" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={submitPayment}>
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
