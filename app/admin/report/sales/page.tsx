"use client";

import { useState, useEffect, useRef } from "react";
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

interface Sale {
  year: number;
  date: string;
  month?: number;
  total_income: string;
  total_transactions: number;
}

type Granularity = "monthly" | "annually" | "daily";

const fmtRWF = (n: number) => `RWF ${n.toLocaleString()}`;
const fmtLabel = (s: Sale, g: Granularity) =>
  g === "monthly"  ? `${s.month}/${s.year}` :
  g === "annually" ? String(s.year) :
  new Date(s.date).toLocaleDateString();

export default function SalesReport() {
  const [sales, setSales]             = useState<Sale[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const printRef                      = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchReport(); }, [granularity, startDate, endDate]);

  const fetchReport = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) { setError("Authentication required."); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/report/salesReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate, granularity }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) setSales(json.data);
      else throw new Error(json.message || "Failed to load sales report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // ── KPIs ──
  const totalIncome       = sales.reduce((s, r) => s + parseFloat(r.total_income), 0);
  const totalTransactions = sales.reduce((s, r) => s + r.total_transactions, 0);
  const avgIncome         = sales.length ? totalIncome / sales.length : 0;
  const bestPeriod        = sales.length
    ? sales.reduce((a, b) => parseFloat(a.total_income) >= parseFloat(b.total_income) ? a : b)
    : null;

  // ── Chart ──
  const chartData = {
    labels: sales.map((s) => fmtLabel(s, granularity)),
    datasets: [{
      label: "Total Income",
      data: sales.map((s) => parseFloat(s.total_income)),
      backgroundColor: "rgba(59,130,246,0.75)",
      borderColor: "#3B82F6",
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

  // ── Excel ──
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sales.map((s) => ({
      Period:             fmtLabel(s, granularity),
      "Total Income":     s.total_income,
      "Total Transactions": s.total_transactions,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, "sales_report.xlsx");
  };

  const handlePrint = () => window.print();

  return (
    <DashboardLayout>
      <style>{`@media print { aside, .no-print { display:none!important } .print-area { padding:0 } }`}</style>

      <div className="container mx-auto p-6 print-area" ref={printRef}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sales Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">Revenue and transaction analysis</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              ↓ Excel
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              🖨 Print / PDF
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Granularity</label>
            <select value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total Income" value={fmtRWF(totalIncome)} accentClass="border-l-blue-500" />
              <KpiCard label="Total Transactions" value={totalTransactions.toLocaleString()} accentClass="border-l-emerald-500" />
              <KpiCard label="Avg Income / Period" value={fmtRWF(Math.round(avgIncome))} accentClass="border-l-violet-500" />
              <KpiCard
                label="Best Period"
                value={bestPeriod ? fmtLabel(bestPeriod, granularity) : "—"}
                sub={bestPeriod ? fmtRWF(parseFloat(bestPeriod.total_income)) : undefined}
                accentClass="border-l-amber-500"
              />
            </div>

            {/* ── Chart ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Income Over Time</h3>
              <div style={{ height: 300 }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Detail</h3>
              </div>
              <div className="overflow-y-auto max-h-80">
                <table className="min-w-full">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Period</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Total Income</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales.length > 0 ? sales.map((s, i) => (
                      <tr key={i} className={`${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                        <td className="px-4 py-3 text-sm text-gray-700">{fmtLabel(s, granularity)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                          RWF {parseFloat(s.total_income).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {s.total_transactions.toLocaleString()}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="text-center py-10 text-gray-400">No sales data available</td></tr>
                    )}
                  </tbody>
                  {sales.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">{fmtRWF(totalIncome)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">{totalTransactions.toLocaleString()}</td>
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
