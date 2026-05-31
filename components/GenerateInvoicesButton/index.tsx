"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Detail {
  subscription_id: string;
  client: string;
  plan: string;
  start_date: string;
  billing_date: string;
  result: string;
}

interface GenerateResult {
  message: string;
  created: number;
  skipped: number;
  no_invoice: number;
  total: number;
  errors: { subscription_id: string; client: string; error: string }[];
  details: Detail[];
  last_run: string;
  current_run: string;
}

interface LastState {
  last_run: string | null;
  total_active: number;
  last_created: number;
  last_skipped: number;
  last_no_invoice: number;
  never_run: boolean;
}

export default function GenerateInvoicesButton({ onDone }: { onDone?: () => void }) {
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<GenerateResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [lastState, setLastState]   = useState<LastState | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getToken = () => localStorage.getItem("authToken") || "";

  // Load last run state on mount
  useEffect(() => {
    fetchLastState();
  }, []);

  const fetchLastState = async () => {
    try {
      const res = await fetch(`${API_URL}/invoices/generate-status`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLastState(data);
      }
    } catch {}
  };

  const handleGenerate = async () => {
    if (!confirm("Generate invoices for all active subscriptions now?")) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/invoices/generate`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to generate invoices.");
        return;
      }

      setResult(data);
      setLastState({
        last_run:        data.current_run,
        total_active:    data.total,
        last_created:    data.created,
        last_skipped:    data.skipped,
        last_no_invoice: data.no_invoice,
        never_run:       false,
      });
      onDone?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-end">

      {/* Last run info */}
      {lastState && !lastState.never_run && !result && (
        <div className="text-xs text-gray-400 text-right">
          Last run: {lastState.last_run} ·{" "}
          {lastState.total_active} active ·{" "}
          {lastState.last_created} created ·{" "}
          {lastState.last_no_invoice} without invoices
        </div>
      )}

      {lastState?.never_run && !result && (
        <div className="text-xs text-orange-500">
          ⚠️ Invoice generation has never been run
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? (
          <><span className="animate-spin inline-block">⏳</span> Generating...</>
        ) : (
          <>⚡ Generate Invoices</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="text-xs rounded-lg px-3 py-2 bg-red-50 border border-red-200 text-red-600 max-w-sm">
          ❌ {error}
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="text-xs rounded-lg border max-w-sm w-full overflow-hidden">

          {/* Header */}
          <div className="px-3 py-2 bg-green-50 border-b border-green-200">
            <div className="font-semibold text-green-700">✅ Generation complete</div>
            <div className="text-green-600 mt-0.5">{result.message}</div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 divide-x bg-white">
            {[
              { label: "Active", value: result.total, color: "text-gray-700" },
              { label: "Created", value: result.created, color: "text-green-600" },
              { label: "Existed", value: result.skipped, color: "text-blue-600" },
              { label: "No Invoice", value: result.no_invoice, color: "text-orange-500" },
            ].map((s) => (
              <div key={s.label} className="px-2 py-2 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-gray-400 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="px-3 py-2 bg-red-50 border-t border-red-100">
              <div className="font-semibold text-red-600">
                ⚠️ {result.errors.length} error(s)
              </div>
              {result.errors.map((e, i) => (
                <div key={i} className="text-red-500 mt-0.5">
                  {e.client}: {e.error}
                </div>
              ))}
            </div>
          )}

          {/* Details toggle */}
          <div className="border-t">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="w-full px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 text-left flex items-center justify-between"
            >
              <span>📋 Per-subscription details ({result.details.length})</span>
              <span>{showDetails ? "▲" : "▼"}</span>
            </button>

            {showDetails && (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left text-gray-500">Client</th>
                      <th className="px-2 py-1 text-left text-gray-500">Plan</th>
                      <th className="px-2 py-1 text-left text-gray-500">Start</th>
                      <th className="px-2 py-1 text-left text-gray-500">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.details.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-2 py-1 font-medium">{d.client}</td>
                        <td className="px-2 py-1 text-gray-500">{d.plan}</td>
                        <td className="px-2 py-1 text-gray-400">{d.start_date}</td>
                        <td className="px-2 py-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            d.result.startsWith("created") ? "bg-green-100 text-green-700" :
                            d.result === "skipped"         ? "bg-blue-100 text-blue-600"   :
                            d.result.startsWith("error")   ? "bg-red-100 text-red-600"     :
                                                             "bg-gray-100 text-gray-500"
                          }`}>
                            {d.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}