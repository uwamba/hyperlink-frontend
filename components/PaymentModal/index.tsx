"use client";

import { useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Props {
  invoice: any;
  onClose: () => void;
  onSuccess: (invoiceId: string, newStatus: string) => void;
}

export default function PaymentModal({ invoice, onClose, onSuccess }: Props) {
  const [paymentData, setPaymentData] = useState({
    amount_paid:    String(invoice.amount),
    payment_method: "MPESA",
    transaction_id: "",
  });
  const [proof, setProof]           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem("authToken") || "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Only images (JPG, PNG, GIF, WebP) and PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }
    setError(null);
    setProof(file);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!proof) {
      setError("Payment proof is required. Please attach a receipt or screenshot.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("client_id",      invoice.client_id);
      formData.append("invoice_id",     invoice.id);
      formData.append("amount_paid",    paymentData.amount_paid);
      formData.append("payment_method", paymentData.payment_method);
      formData.append("transaction_id", paymentData.transaction_id || `TXN-${Date.now()}`);
      formData.append("proof",          proof);

      const res = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Payment failed. Please try again.");
        return;
      }

      const newStatus = parseFloat(paymentData.amount_paid) >= invoice.amount ? "paid" : "partial";
      onSuccess(invoice.id, newStatus);
      onClose();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[420px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">
          Pay Invoice #{invoice.invoice_no}
        </h2>

        {/* Amount */}
        <label className="block mb-1 text-sm font-medium">Amount Paid</label>
        <input
          type="number"
          name="amount_paid"
          value={paymentData.amount_paid}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
        />

        {/* Payment Method */}
        <label className="block mb-1 text-sm font-medium">Payment Method</label>
        <select
          name="payment_method"
          value={paymentData.payment_method}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
        >
          <option value="MPESA">MOMO</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="card">CARD</option>
          <option value="cash">CASH</option>
        </select>

        {/* Transaction ID */}
        <label className="block mb-1 text-sm font-medium">Transaction ID</label>
        <input
          type="text"
          name="transaction_id"
          value={paymentData.transaction_id}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-4"
          placeholder="Optional"
        />

        {/* Payment Proof — required */}
        <label className="block mb-1 text-sm font-medium">
          Payment Proof <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">(receipt screenshot or PDF)</span>
        </label>

        {/* Preview */}
        {proof && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="proof preview"
                className="w-14 h-14 object-cover rounded border border-blue-200 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-blue-100 rounded flex items-center justify-center text-2xl flex-shrink-0">
                📄
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-800 truncate">{proof.name}</div>
              <div className="text-xs text-blue-500">{(proof.size / 1024).toFixed(0)} KB</div>
            </div>
            <button
              onClick={() => { setProof(null); setPreviewUrl(null); }}
              className="text-red-400 hover:text-red-600 text-lg flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* File picker button */}
        {!proof && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            📎 Click to attach payment proof
          </button>
        )}

        {proof && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full mb-4 p-2 border border-gray-200 rounded text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Change file
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !proof}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <><span className="animate-spin inline-block">⏳</span> Submitting...</>
            ) : (
              "Submit Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}