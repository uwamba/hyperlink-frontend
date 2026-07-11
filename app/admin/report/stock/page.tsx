"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import KpiCard from "@/components/reports/KpiCard";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend
);

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Stock {
  year?: number;
  month?: number;
  date?: string;
  in_stock_value: number;
  delivered_stock_value: number;
  in_stock_count: number;
  delivered_count: number;
}

type Granularity = "monthly" | "annually" | "daily";

const fmtRWF   = (n: number) => `RWF ${n.toLocaleString()}`;
const fmtLabel = (s: Stock, g: Granularity) =>
  g === "monthly" && s.month && s.year ? `${s.month}/${s.year}` :
  g === "annually" && s.year           ? String(s.year) :
  s.date ? new Date(s.date).toLocaleDateString() : "—";

export default function StockReport() {
  const [stocks, setStocks]           = useState<Stock[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [view, setView]               = useState<"bar" | "line">("bar");

  useEffect(() => { fetchReport(); }, [granularity, startDate, endDate]);

  const fetchReport = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) { setError("Authentication required."); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/report/stockReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate, granularity }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        const periodData = json.data.period_data;
        const mapped: Stock[] = Object.keys(periodData).map((key) => {
          const { in_stock_value, delivered_stock_value } = periodData[key];
          const [year, month] = key.split("-");
          return {
            year: parseInt(year),
            month: parseInt(month),
            date: key,
            in_stock_value,
            delivered_stock_value,
            in_stock_count: 0,
            delivered_count: 0,
          };
        });
        setStocks(mapped);
      } else {
        throw new Error(json.message || "Failed to fetch stock report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // ── KPIs ──
  const totalInStock    = stocks.reduce((s, r) => s + r.in_stock_value, 0);
  const totalDelivered  = stocks.reduce((s, r) => s + r.delivered_stock_value, 0);
  const turnoverPct     = totalInStock > 0 ? ((totalDelivered / totalInStock) * 100).toFixed(1) : "0";

  // ── Chart data (shared for bar & line) ──
  const labels = stocks.map((s) => fmtLabel(s, granularity));
  const chartData = {
    labels,
    datasets: [
      {
        label: "In Stock Value",
        data: stocks.map((s) => s.in_stock_value),
        backgroundColor: "rgba(16,185,129,0.75)",
        borderColor: "#10B981",
        borderWidth: 2,
        borderRadius: 4,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Delivered Value",
        data: stocks.map((s) => s.delivered_stock_value),
        backgroundColor: "rgba(245,158,11,0.75)",
        borderColor: "#F59E0B",
        borderWidth: 2,
        borderRadius: 4,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { usePointStyle: true, pointStyleWidth: 8, padding: 16 },
      },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtRWF(ctx.raw)}` } },
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
    const ws = XLSX.utils.json_to_sheet(stocks.map((s) => ({
      Period:           fmtLabel(s, granularity),
      "In Stock Value": s.in_stock_value,
      "Delivered Value": s.delivered_stock_value,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");
    XLSX.writeFile(wb, "stock_report.xlsx");
  };

  return (
    <DashboardLayout>
      <style>{`@media print { aside, .no-print { display:none!important } }`}</style>

      <div className="container mx-auto p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Stock Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">Inventory movement and stock value analysis</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              ↓ Excel
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              🖨 Print / PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Granularity</label>
            <select value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {/* Chart toggle */}
          <div className="flex items-end no-print">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button onClick={() => setView("bar")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${view === "bar" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                Bar
              </button>
              <button onClick={() => setView("line")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${view === "line" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                Line
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Total In-Stock Value" value={fmtRWF(totalInStock)} accentClass="border-l-emerald-500" />
              <KpiCard label="Total Delivered Value" value={fmtRWF(totalDelivered)} accentClass="border-l-amber-500" />
              <KpiCard label="Turnover Rate" value={`${turnoverPct}%`} sub="Delivered ÷ In-Stock" accentClass="border-l-blue-500" />
              <KpiCard label="Periods" value={String(stocks.length)} accentClass="border-l-gray-400" />
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">
                Stock Movement
              </h3>
              <div style={{ height: 320 }}>
                {view === "bar"
                  ? <Bar data={chartData} options={{ ...chartOptions, borderSkipped: false } as any} />
                  : <Line data={chartData} options={chartOptions} />
                }
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
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">In-Stock Value</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Delivered Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stocks.length > 0 ? stocks.map((s, i) => (
                      <tr key={i} className={`${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-emerald-50 transition-colors`}>
                        <td className="px-4 py-3 text-sm text-gray-700">{fmtLabel(s, granularity)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-emerald-700">
                          RWF {s.in_stock_value.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-amber-700">
                          RWF {s.delivered_stock_value.toLocaleString()}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="text-center py-10 text-gray-400">No stock data available</td></tr>
                    )}
                  </tbody>
                  {stocks.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-bold text-gray-700">Total</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-emerald-700">{fmtRWF(totalInStock)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-amber-700">{fmtRWF(totalDelivered)}</td>
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
