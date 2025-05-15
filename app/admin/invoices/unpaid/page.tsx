"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function UnpaidInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      const response = await fetch(`${API_URL}/invoices/unpaid`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setInvoices(responseData.data);
        setFilteredInvoices(responseData.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (invoice: number) => {
    try {
      const response = await fetch(`${API_URL}/download-invoice/${invoice}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_${invoice}.pdf`;
        link.click();
      } else {
        console.error('Failed to generate invoice:', response);
        alert('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('An error occurred while generating the invoice');
    }
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount_paid: invoice.amount,
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
              ? { ...inv, status: parseFloat(paymentData.amount_paid) >= selectedInvoice.amount ? "paid pending" : "partial pending" }
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

  const handleDeleteInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setInvoices((prevInvoices) => prevInvoices.filter((invoice) => invoice.id !== invoiceId));
        setDeleteDialogOpen(false);
      } else {
        alert('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('An error occurred while deleting the invoice');
    }
  };

  const openDeleteDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);
    const filtered = invoices.filter(
      (inv) =>
        inv.invoice_no.toLowerCase().includes(query) ||
        (inv.client?.name || "").toLowerCase().includes(query)
    );
    setFilteredInvoices(filtered);
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIdx, startIdx + itemsPerPage);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  return (
    <DashboardLayout>
  <div className="container mx-auto p-6 max-w-full">
    <h2 className="text-2xl font-bold mb-4">Unpaid Invoices</h2>

    <input
      type="text"
      value={searchQuery}
      onChange={handleSearch}
      placeholder="Search by Invoice No or Client Name..."
      className="mb-4 p-2 w-full border border-gray-300 rounded"
    />

    {error && <p className="text-red-500">{error}</p>}

    {loading ? (
      <p>Loading...</p>
    ) : (
      <div className="overflow-x-auto max-h-[75vh] overflow-y-auto rounded shadow">
        <table className="min-w-[1000px] w-full border-collapse border border-gray-200 bg-white">
          <thead className="bg-gray-800 text-white sticky top-0 z-10">
            <tr>
              <th className="border px-4 py-2">Invoice No</th>
              <th className="border px-4 py-2">Client Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Amount</th>
              <th className="border px-4 py-2">Due Date</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInvoices.length > 0 ? (
              currentInvoices.map((invoice) => (
                <tr key={invoice.id} className="border hover:bg-gray-100">
                  <td className="border px-4 py-2">{invoice.id}</td>
                  <td className="border px-4 py-2">{invoice.client?.name || "N/A"}</td>
                  <td className="border px-4 py-2">{invoice.client?.email || "-"}</td>
                  <td className="border px-4 py-2">{invoice.client?.phone || "-"}</td>
                  <td className="border px-4 py-2">Ksh {parseFloat(invoice.amount).toLocaleString()}</td>
                  <td className="border px-4 py-2">{invoice.due_date}</td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      invoice.status === "paid"
                        ? "bg-green-500 text-white"
                        : invoice.status === "partial"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="border px-4 py-2 flex flex-wrap gap-2">
                    <button onClick={() => handleGenerateInvoice(invoice.id)} className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">View</button>
                    {invoice.status !== "paid" && (
                      <button onClick={() => openPaymentModal(invoice)} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Pay</button>
                    )}
                    <button onClick={() => openDeleteDialog(invoice)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4">No unpaid invoices found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {/* Pagination */}
    {!loading && totalPages > 1 && (
      <div className="flex justify-center mt-4 gap-2 flex-wrap">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            className={`px-3 py-1 border rounded ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-white"}`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    )}
  </div>

  {/* (Payment modal and delete confirmation can follow as before) */}
</DashboardLayout>

  );
}
