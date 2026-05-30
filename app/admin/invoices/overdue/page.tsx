"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PaymentModal from "@/components/PaymentModal";
import ProofViewerModal from "@/components/ProofViewerModal";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function OverdueInvoices() {
  const [invoices, setInvoices]             = useState<any[]>([]);
  const [authToken, setAuthToken]           = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [loading, setLoading]               = useState(true);
  const [modalOpen, setModalOpen]           = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [proofModalOpen, setProofModalOpen]   = useState(false);
  const [proofInvoice, setProofInvoice]       = useState<any | null>(null);

  // ── Generate invoices state ───────────────────────────────────────────────
  const [generating, setGenerating]         = useState(false);
  const [generateResult, setGenerateResult] = useState<{
    created: number; skipped: number; total: number; errors: string[];
  } | null>(null);

  const getToken = () => localStorage.getItem("authToken") || "";

  // ── Generate invoices for all active subscriptions ────────────────────────
  const generateInvoices = useCallback(async (silent = false) => {
    const token = getToken();
    if (!token) return;
    if (!silent) setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/invoices/generate`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setGenerateResult(data);
        // Auto-hide result after 8 seconds
        setTimeout(() => setGenerateResult(null), 8000);
      }
    } catch {
      // Silent fail on auto-generate — don't block page load
    } finally {
      if (!silent) setGenerating(false);
    }
  }, []);

  // ── Auth + initial load ───────────────────────────────────────────────────
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
      // Auto-generate silently on page open, then fetch list
      generateInvoices(true).then(() => fetchInvoices());
    }
  }, [authToken]);

  // ── Fetch overdue invoices ────────────────────────────────────────────────
  const fetchInvoices = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/invoices/overdue`, {
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

  // ── Manual generate + refresh ─────────────────────────────────────────────
  const handleManualGenerate = async () => {
    if (!confirm("Generate invoices for all active subscriptions now?")) return;
    setGenerating(true);
    await generateInvoices(false);
    await fetchInvoices();
  };

  // ── Download invoice PDF ──────────────────────────────────────────────────
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

  // ── Payment modal ─────────────────────────────────────────────────────────
  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  // ── Delete invoice ────────────────────────────────────────────────────────
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!authToken || !confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      } else {
        throw new Error("Failed to delete invoice.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting.");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-2xl font-bold">Overdue Invoices</h2>

          <div className="flex flex-col items-end gap-2">
            {/* Generate button */}
            <button
              onClick={handleManualGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {generating ? (
                <><span className="animate-spin inline-block">⏳</span> Generating...</>
              ) : (
                <>⚡ Generate Invoices</>
              )}
            </button>

            {/* Result banner */}
            {generateResult && (
              <div className="text-xs rounded-lg px-3 py-2 bg-green-50 border border-green-200 text-green-700 flex flex-col gap-0.5 min-w-[240px]">
                <span className="font-semibold">✅ Generation complete</span>
                <span>
                  <strong>{generateResult.created}</strong> created ·{" "}
                  <strong>{generateResult.skipped}</strong> already existed ·{" "}
                  <strong>{generateResult.total}</strong> subscriptions checked
                </span>
                {generateResult.errors?.length > 0 && (
                  <span className="text-red-500">⚠️ {generateResult.errors[0]}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* ── Table ── */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200 shadow-md rounded-lg">
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
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border hover:bg-gray-100">
                      <td className="border px-4 py-2">{invoice.invoice_no}</td>
                      <td className="border px-4 py-2">{invoice.client_id}</td>
                      <td className="border px-4 py-2">
                        Ksh {parseFloat(invoice.amount).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2">{invoice.due_date}</td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          invoice.status === "paid"    ? "bg-green-500 text-white" :
                          invoice.status === "partial" ? "bg-yellow-500 text-white" :
                                                         "bg-red-500 text-white"
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="border px-4 py-2 flex gap-2">
                        <button
                          onClick={() => handleGenerateInvoice(invoice.id)}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          View PDF
                        </button>
                        <button
                          onClick={() => { setProofInvoice(invoice); setProofModalOpen(true); }}
                          className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 text-sm"
                        >
                          Proof
                        </button>
                        {invoice.status !== "paid" && (
                          <button
                            onClick={() => openPaymentModal(invoice)}
                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      No overdue invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Proof Viewer Modal ── */}
        {proofModalOpen && proofInvoice && (
          <ProofViewerModal
            invoice={proofInvoice}
            onClose={() => { setProofModalOpen(false); setProofInvoice(null); }}
          />
        )}

        {/* ── Payment Modal (with proof upload) ── */}
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