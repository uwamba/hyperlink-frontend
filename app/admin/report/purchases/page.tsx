"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import KpiCard from "@/components/reports/KpiCard";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Purchase {
  year: number;
  date: string;
  month?: number;
  total_amount: string;
}

type Granularity = "monthly" | "annually" | "daily";

const fmtRWF   = (n: number) => `RWF ${n.toLocaleString()}`;
const fmtLabel = (p: Purchase, g: Granularity) =>
  g === "monthly"  ? `${p.month}/${p.year}` :
  g === "annually" ? String(p.year) :
  new Date(p.date).toLocaleDateString();

export default function PurchasesReport() {
  const [purchases, setPurchases]     = useState<Purchase[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");

  useEffect(() => { fetchReport(); }, [granularity, startDate, endDate]);

  const fetchReport = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) { setError("Authentication required."); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/report/purchasesReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate, granularity }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) setPurchases(json.data);
      else throw new Error(json.message || "Failed to load purchases report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // ── KPIs ──
  const totalAmount = purchases.reduce((s, r) => s + parseFloat(r.total_amount), 0);
  const avgAmount   = purchases.length ? totalAmount / purchases.length : 0;
  const highestPeriod = purchases.length
    ? purchases.reduce((a, b) => parseFloat(a.total_amount) >= parseFloat(b.total_amount) ? a : b)
    : null;
  const lowestPeriod = purchases.length
    ? purchases.reduce((a, b) => parseFloat(a.total_amount) <= parseFloat(b.total_amount) ? a : b)
    : null;

  // ── Chart ──
  const chartData = {
    labels: purchases.map((p) => fmtLabel(p, granularity)),
    datasets: [{
      label: "Total Amount",
      data: purchases.map((p) => parseFloat(p.total_amount)),
      backgroundColor: "rgba(249,115,22,0.75)",
      borderColor: "#F97316",
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => fmtRWF(ctx.raw) } },
    },
    scales: {
      y: {
        grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
        ticks: { callback: (v: any) => `RWF ${Number(v).toLocaleString()}` },
      },
      x: { grid: { display: false } },
    },
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(purchases.map((p) => ({
      Period: fmtLabel(p, granularity),
      "Total Amount": p.total_amount,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases Report");
    XLSX.writeFile(wb, "purchases_report.xlsx");
  };

  return (
    <DashboardLayout>
      <style>{`@media print { aside, .no-print { display:none!important } }`}</style>

      <div className="container mx-auto p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Purchases Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">Procurement spend analysis</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              ↓ Excel
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              🖨 Print / PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Granularity</label>
            <select value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total Purchases" value={fmtRWF(totalAmount)} accentClass="border-l-orange-500" />
              <KpiCard label="Avg / Period" value={fmtRWF(Math.round(avgAmount))} accentClass="border-l-amber-500" />
              <KpiCard
                label="Highest Period"
                value={highestPeriod ? fmtLabel(highestPeriod, granularity) : "—"}
                sub={highestPeriod ? fmtRWF(parseFloat(highestPeriod.total_amount)) : undefined}
                accentClass="border-l-red-400"
              />
              <KpiCard
                label="Lowest Period"
                value={lowestPeriod ? fmtLabel(lowestPeriod, granularity) : "—"}
                sub={lowestPeriod ? fmtRWF(parseFloat(lowestPeriod.total_amount)) : undefined}
                accentClass="border-l-green-400"
              />
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Purchases Over Time</h3>
              <div style={{ height: 300 }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Detail</h3>
              </div>
              <div className="overflow-y-auto max-h-80">
                <table className="min-w-full">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Period</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases.length > 0 ? purchases.map((p, i) => (
                      <tr key={i} className={`${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-orange-50 transition-colors`}>
                        <td className="px-4 py-3 text-sm text-gray-700">{fmtLabel(p, granularity)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                          RWF {parseFloat(p.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={2} className="text-center py-10 text-gray-400">No purchase data available</td></tr>
                    )}
                  </tbody>
                  {purchases.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">{fmtRWF(totalAmount)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
