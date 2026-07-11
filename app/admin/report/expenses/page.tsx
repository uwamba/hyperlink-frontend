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

interface Expense {
  year: number;
  date: string;
  month?: number;
  total_amount: string;
  type?: string;
}

type Granularity = "monthly" | "annually" | "daily";

const fmtRWF    = (n: number) => `RWF ${n.toLocaleString()}`;
const fmtLabel  = (e: Expense, g: Granularity) =>
  g === "monthly"  ? `${e.month}/${e.year}` :
  g === "annually" ? String(e.year) :
  new Date(e.date).toLocaleDateString();

export default function ExpensesReport() {
  const [expenses, setExpenses]       = useState<Expense[]>([]);
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
      const res = await fetch(`${API_URL}/report/expensesReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate, granularity }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) setExpenses(json.data);
      else throw new Error(json.message || "Failed to load expenses report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // ── KPIs ──
  const totalAmount  = expenses.reduce((s, r) => s + parseFloat(r.total_amount), 0);
  const avgAmount    = expenses.length ? totalAmount / expenses.length : 0;
  const highestMonth = expenses.length
    ? expenses.reduce((a, b) => parseFloat(a.total_amount) >= parseFloat(b.total_amount) ? a : b)
    : null;

  // ── Chart ──
  const chartData = {
    labels: expenses.map((e) => fmtLabel(e, granularity)),
    datasets: [{
      label: "Total Expenses",
      data: expenses.map((e) => parseFloat(e.total_amount)),
      backgroundColor: "rgba(239,68,68,0.75)",
      borderColor: "#EF4444",
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
    const ws = XLSX.utils.json_to_sheet(expenses.map((e) => ({
      Period:         fmtLabel(e, granularity),
      "Total Amount": e.total_amount,
      ...(e.type ? { Type: e.type } : {}),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses Report");
    XLSX.writeFile(wb, "expenses_report.xlsx");
  };

  return (
    <DashboardLayout>
      <style>{`@media print { aside, .no-print { display:none!important } }`}</style>

      <div className="container mx-auto p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Expenses Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">Operational expense analysis</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              ↓ Excel
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              🖨 Print / PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Granularity</label>
            <select value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total Expenses" value={fmtRWF(totalAmount)} accentClass="border-l-red-500" />
              <KpiCard label="Avg / Period" value={fmtRWF(Math.round(avgAmount))} accentClass="border-l-orange-500" />
              <KpiCard label="Periods" value={String(expenses.length)} accentClass="border-l-gray-400" />
              <KpiCard
                label="Highest Period"
                value={highestMonth ? fmtLabel(highestMonth, granularity) : "—"}
                sub={highestMonth ? fmtRWF(parseFloat(highestMonth.total_amount)) : undefined}
                accentClass="border-l-rose-400"
              />
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Expenses Over Time</h3>
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
                      {expenses.some((e) => e.type) && (
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.length > 0 ? expenses.map((e, i) => (
                      <tr key={i} className={`${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-red-50 transition-colors`}>
                        <td className="px-4 py-3 text-sm text-gray-700">{fmtLabel(e, granularity)}</td>
                        {expenses.some((x) => x.type) && (
                          <td className="px-4 py-3 text-sm text-gray-600">{e.type || "—"}</td>
                        )}
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                          RWF {parseFloat(e.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="text-center py-10 text-gray-400">No expense data available</td></tr>
                    )}
                  </tbody>
                  {expenses.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                        {expenses.some((e) => e.type) && <td />}
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
