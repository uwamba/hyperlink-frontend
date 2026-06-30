"use client";

import { useState, useRef, useEffect } from "react";
import { getBanks, getMomo, type PaymentOption } from "@/data/paymentMethods";

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
  const [subProvider, setSubProvider]   = useState("");
  const [banks, setBanks]               = useState<PaymentOption[]>([]);
  const [momoList, setMomoList]         = useState<PaymentOption[]>([]);
  const [proof, setProof]               = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBanks(getBanks());
    setMomoList(getMomo());
  }, []);

  // Reset sub-provider when method changes
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentData({ ...paymentData, payment_method: e.target.value });
    setSubProvider("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
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

    const needsProvider =
      paymentData.payment_method === "MPESA" ||
      paymentData.payment_method === "Bank Transfer";
    if (needsProvider && !subProvider) {
      setError(
        paymentData.payment_method === "MPESA"
          ? "Please select a MoMo provider."
          : "Please select a bank."
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    // Build combined payment method string
    const finalMethod =
      subProvider
        ? `${paymentData.payment_method === "MPESA" ? subProvider : `Bank Transfer - ${subProvider}`}`
        : paymentData.payment_method;

    try {
      const formData = new FormData();
      formData.append("client_id",      invoice.client_id);
      formData.append("invoice_id",     invoice.id);
      formData.append("amount_paid",    paymentData.amount_paid);
      formData.append("payment_method", finalMethod);
      formData.append("transaction_id", paymentData.transaction_id || `TXN-${Date.now()}`);
      formData.append("proof",          proof);

      const res = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` },
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

  const isMomo = paymentData.payment_method === "MPESA";
  const isBank = paymentData.payment_method === "Bank Transfer";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[440px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Pay Invoice <span className="text-blue-600">#{invoice.invoice_no}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Total due: <strong>RWF {parseFloat(invoice.amount).toLocaleString()}</strong>
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Amount */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Amount Paid (RWF)</label>
            <input
              type="number"
              name="amount_paid"
              value={paymentData.amount_paid}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Method</label>
            <select
              name="payment_method"
              value={paymentData.payment_method}
              onChange={handleMethodChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MPESA">MoMo (Mobile Money)</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {/* MoMo sub-selector */}
          {isMomo && momoList.length > 0 && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">MoMo Provider</label>
              <select
                value={subProvider}
                onChange={(e) => setSubProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select provider —</option>
                {momoList.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Bank sub-selector */}
          {isBank && banks.length > 0 && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Bank</label>
              <select
                value={subProvider}
                onChange={(e) => setSubProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select bank —</option>
                {banks.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Transaction ID */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Transaction ID <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="transaction_id"
              value={paymentData.transaction_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Auto-generated if left blank"
            />
          </div>

          {/* Payment Proof */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Payment Proof <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(receipt or PDF)</span>
            </label>

            {proof ? (
              <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="proof preview"
                    className="w-12 h-12 object-cover rounded border border-blue-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center text-xl flex-shrink-0">
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
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                📎 Click to attach payment proof
              </button>
            )}

            {proof && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-1 p-1.5 border border-gray-200 rounded text-xs text-gray-400 hover:text-gray-600 transition-colors"
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
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !proof}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {submitting ? (
              <><span className="animate-spin inline-block">⏳</span> Submitting…</>
            ) : (
              "Submit Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
