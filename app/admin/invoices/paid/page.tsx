"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import GenerateInvoicesButton from "@/components/GenerateInvoicesButton";
import PaymentModal from "@/components/PaymentModal";
import ProofViewerModal from "@/components/ProofViewerModal";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    paid:    "bg-green-100 text-green-700",
    partial: "bg-yellow-100 text-yellow-700",
    unpaid:  "bg-red-100 text-red-700",
  };
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`;
};

export default function PaidInvoices() {
  const [invoices, setInvoices]               = useState<any[]>([]);
  const [authToken, setAuthToken]             = useState<string | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [modalOpen, setModalOpen]             = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [proofModalOpen, setProofModalOpen]   = useState(false);
  const [proofInvoice, setProofInvoice]       = useState<any | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const getToken = () => localStorage.getItem("authToken") || "";

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) setError("Authentication required. Please log in.");
    else setAuthToken(token);
  }, []);

  useEffect(() => {
    if (authToken) fetchInvoices();
  }, [authToken]);

  const fetchInvoices = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/invoices/paid`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const handleGenerateInvoice = async (invoiceId: string) => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/download-invoice/${invoiceId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `invoice_${invoiceId}.pdf`;
        link.click();
      } else {
        alert("Failed to generate invoice");
      }
    } catch {
      alert("An error occurred while generating the invoice");
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
        setDeleteConfirmationOpen(false);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete invoice.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting.");
    }
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 overflow-x-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Paid Invoices</h2>
            <p className="text-sm text-gray-500 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
          </div>
          <GenerateInvoicesButton onDone={() => fetchInvoices()} />
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Invoice No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {invoices.length > 0 ? (
                  invoices.map((invoice, idx) => (
                    <tr key={invoice.id} className={`${idx % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{invoice.invoice_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-medium">{invoice.client?.name || "—"}</div>
                        {invoice.client?.email && (
                          <div className="text-xs text-gray-400">{invoice.client.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        RWF {parseFloat(invoice.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{invoice.due_date}</td>
                      <td className="px-4 py-3">
                        <span className={statusBadge(invoice.status)}>{invoice.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleGenerateInvoice(invoice.id)}
                            className="text-xs px-3 py-1 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => { setProofInvoice(invoice); setProofModalOpen(true); }}
                            className="text-xs px-3 py-1 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                          >
                            Proof
                          </button>
                          {invoice.status !== "paid" && (
                            <button
                              onClick={() => openPaymentModal(invoice)}
                              className="text-xs px-3 py-1 rounded-md font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedInvoice(invoice); setDeleteConfirmationOpen(true); }}
                            className="text-xs px-3 py-1 rounded-md font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      No paid invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmationOpen && selectedInvoice && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Confirm Deletion</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete invoice <strong>#{selectedInvoice.invoice_no}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  onClick={() => setDeleteConfirmationOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {proofModalOpen && proofInvoice && (
          <ProofViewerModal
            invoice={proofInvoice}
            onClose={() => { setProofModalOpen(false); setProofInvoice(null); }}
          />
        )}

        {modalOpen && selectedInvoice && (
          <PaymentModal
            invoice={selectedInvoice}
            onClose={() => { setModalOpen(false); setSelectedInvoice(null); }}
            onSuccess={(invoiceId, newStatus) => {
              setInvoices((prev) =>
                prev.map((inv) => inv.id === invoiceId ? { ...inv, status: newStatus } : inv)
              );
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
