"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Props {
  invoice: any;
  onClose: () => void;
}

interface Proof {
  url: string;
  type: "image" | "pdf";
  name: string;
  size: number;
  created_at: string;
  payment_id: string;
}

export default function ProofViewerModal({ invoice, onClose }: Props) {
  const [proofs, setProofs]   = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [selected, setSelected] = useState<Proof | null>(null);

  const getToken = () => localStorage.getItem("authToken") || "";

  useEffect(() => {
    fetchProofs();
  }, []);

  const fetchProofs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all payments for this invoice
      const res = await fetch(`${API_URL}/invoices/${invoice.id}/payments`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) throw new Error("Failed to load payments.");
      const data = await res.json();
      const payments: any[] = data.payments || data.data || [];

      if (payments.length === 0) {
        setProofs([]);
        setLoading(false);
        return;
      }

      // Fetch proof for each payment
      const proofResults: Proof[] = [];
      for (const payment of payments) {
        try {
          const proofRes = await fetch(`${API_URL}/payments/${payment.id}/proof`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
          });
          if (proofRes.ok) {
            const proofData = await proofRes.json();
            if (proofData.proof) {
              proofResults.push(proofData.proof);
            }
          }
        } catch {}
      }

      setProofs(proofResults);
      if (proofResults.length > 0) setSelected(proofResults[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proofs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Payment Proofs</h2>
            <p className="text-sm text-gray-500">Invoice #{invoice.invoice_no}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <span className="animate-spin mr-2">⏳</span> Loading proofs...
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={fetchProofs}
                className="mt-4 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:opacity-90"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && proofs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-gray-500 text-sm font-medium">No payment proofs found</p>
              <p className="text-gray-400 text-xs mt-1">Proofs are uploaded when a payment is submitted</p>
            </div>
          )}

          {!loading && !error && proofs.length > 0 && (
            <div className="flex flex-col gap-4">

              {/* Proof selector tabs if multiple */}
              {proofs.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {proofs.map((p, i) => (
                    <button
                      key={p.payment_id}
                      onClick={() => setSelected(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        selected?.payment_id === p.payment_id
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Proof {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected proof viewer */}
              {selected && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">

                  {/* Image proof */}
                  {selected.type === "image" && (
                    <div className="bg-gray-50 flex items-center justify-center p-4 min-h-[280px]">
                      <img
                        src={selected.url}
                        alt={selected.name}
                        className="max-w-full max-h-[400px] rounded-lg shadow object-contain"
                      />
                    </div>
                  )}

                  {/* PDF proof */}
                  {selected.type === "pdf" && (
                    <div className="bg-gray-50 flex flex-col items-center justify-center p-8 min-h-[200px] gap-4">
                      <div className="text-6xl">📄</div>
                      <div className="text-center">
                        <div className="font-medium text-gray-800">{selected.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {(selected.size / 1024).toFixed(0)} KB · PDF Document
                        </div>
                      </div>
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Open PDF ↗
                      </a>
                    </div>
                  )}

                  {/* Proof metadata */}
                  <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-700 truncate max-w-[260px]">
                        {selected.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {(selected.size / 1024).toFixed(0)} KB ·{" "}
                        {new Date(selected.created_at).toLocaleString([], {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Open ↗
                      </a>
                      <a
                        href={selected.url}
                        download={selected.name}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-800 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        ⬇ Download
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}