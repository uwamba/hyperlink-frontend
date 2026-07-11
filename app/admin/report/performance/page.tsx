"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
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

interface BaseReportRow {
  user_id: number;
  user_name: string;
  [key: string]: any;
}

type EndpointKey =
  | "userPerformance" | "performancePayments" | "items"
  | "deliveryNotes"   | "subscriptions"        | "invoices"
  | "purchases"       | "assets";

const endpointsMap: Record<EndpointKey, { endpoint: string; keysMapping: Record<string, string>; color: string }> = {
  userPerformance:    { endpoint: "user-performance",      color: "#8B5CF6",
    keysMapping: { clients_created_this_month: "Clients Created", clients_updated_this_month: "Clients Updated", tickets_created_this_month: "Tickets Created", tickets_updated_this_month: "Tickets Updated" } },
  performancePayments:{ endpoint: "performance-payments",  color: "#3B82F6",
    keysMapping: { created_this_month: "Payments Created", updated_this_month: "Payments Updated" } },
  items:              { endpoint: "items",                 color: "#F97316",
    keysMapping: { items_created_this_month: "Items Created", items_updated_this_month: "Items Updated" } },
  deliveryNotes:      { endpoint: "delivery-notes",        color: "#10B981",
    keysMapping: { created_this_month: "Delivery Notes Created", updated_this_month: "Delivery Notes Updated" } },
  subscriptions:      { endpoint: "subscriptions",         color: "#0EA5E9",
    keysMapping: { created_this_month: "Subscriptions Created", updated_this_month: "Subscriptions Updated" } },
  invoices:           { endpoint: "invoices",              color: "#EF4444",
    keysMapping: { invoices_paid_this_month: "Invoices Paid" } },
  purchases:          { endpoint: "purchases",             color: "#F59E0B",
    keysMapping: { purchases_created_this_month: "Purchases Created", purchases_updated_this_month: "Purchases Updated" } },
  assets:             { endpoint: "assets",                color: "#6366F1",
    keysMapping: { assets_created_this_month: "Assets Created", assets_updated_this_month: "Assets Updated" } },
};

const sectionLabels: Record<EndpointKey, string> = {
  userPerformance:    "Client & Ticket Activity",
  performancePayments:"Payments",
  items:              "Inventory Items",
  deliveryNotes:      "Delivery Notes",
  subscriptions:      "Subscriptions",
  invoices:           "Invoices",
  purchases:          "Purchases",
  assets:             "Assets",
};

export default function PerformanceReport() {
  const [data, setData] = useState<Record<EndpointKey, BaseReportRow[]>>({
    userPerformance: [], performancePayments: [], items: [],
    deliveryNotes: [], subscriptions: [], invoices: [], purchases: [], assets: [],
  });
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<EndpointKey>>(new Set());

  useEffect(() => { fetchAllReports(); }, []);

  const fetchAllReports = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) { setError("Authentication required."); setLoading(false); return; }
    try {
      const entries = Object.entries(endpointsMap);
      const results = await Promise.all(
        entries.map(([, { endpoint }]) =>
          fetch(`${API_URL}/stats/${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(async (res) => {
            if (!res.ok) {
              const j = await res.json().catch(() => null);
              throw new Error(j?.message || `Failed: ${endpoint}`);
            }
            return res.json();
          })
        )
      );
      const newData: Record<EndpointKey, BaseReportRow[]> = {} as any;
      entries.forEach(([key], i) => { newData[key as EndpointKey] = results[i].data || []; });
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (key: EndpointKey) => {
    const { keysMapping } = endpointsMap[key];
    const rows = data[key];
    if (!rows?.length) { alert("No data to export."); return; }
    const sheetData = rows.map((row) => {
      const r: Record<string, any> = { "User Name": row.user_name };
      Object.entries(keysMapping).forEach(([k, label]) => { r[label] = row[k] ?? 0; });
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, key);
    XLSX.writeFile(wb, `${key}_performance.xlsx`);
  };

  const toggleCollapse = (key: EndpointKey) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const renderSection = (key: EndpointKey) => {
    const { keysMapping, color } = endpointsMap[key];
    const rows = data[key];
    const isOpen = !collapsed.has(key);

    const chartData = {
      labels: rows.map((r) => r.user_name),
      datasets: Object.entries(keysMapping).map(([sourceKey, label], idx) => ({
        label,
        data: rows.map((r) => r[sourceKey] ?? 0),
        backgroundColor: idx === 0 ? `${color}BF` : `${color}7F`,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
      })),
    };

    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { usePointStyle: true, pointStyleWidth: 8, padding: 12 },
        },
      },
      scales: {
        y: {
          grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
          ticks: { stepSize: 1 },
          beginAtZero: true,
        },
        x: { grid: { display: false } },
      },
    };

    const totalActivity = rows.reduce((sum, r) =>
      sum + Object.keys(keysMapping).reduce((s, k) => s + (r[k] ?? 0), 0), 0
    );

    return (
      <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {/* Section header */}
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleCollapse(key)}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">{sectionLabels[key]}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {rows.length} user{rows.length !== 1 ? "s" : ""} · {totalActivity} total actions this month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); exportToExcel(key); }}
              className="text-xs px-3 py-1 rounded-md font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors no-print"
            >
              ↓ Excel
            </button>
            <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-gray-100">
            {rows.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No data available for this month</p>
            ) : (
              <>
                {/* Chart */}
                <div className="p-5 border-b border-gray-50">
                  <div style={{ height: 220 }}>
                    <Bar data={chartData} options={options} />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                        {Object.values(keysMapping).map((label) => (
                          <th key={label} className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                            {label}
                          </th>
                        ))}
                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((r, i) => {
                        const rowTotal = Object.keys(keysMapping).reduce((s, k) => s + (r[k] ?? 0), 0);
                        return (
                          <tr key={i} className={`${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-800">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ backgroundColor: color }}>
                                  {r.user_name?.[0]?.toUpperCase() || "?"}
                                </div>
                                {r.user_name}
                              </div>
                            </td>
                            {Object.keys(keysMapping).map((sourceKey) => (
                              <td key={sourceKey} className="px-4 py-2.5 text-sm text-right text-gray-600">
                                {(r[sourceKey] ?? 0).toLocaleString()}
                              </td>
                            ))}
                            <td className="px-4 py-2.5 text-sm text-right font-bold text-gray-800">
                              {rowTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <style>{`@media print { aside, .no-print { display:none!important } }`}</style>

      <div className="container mx-auto p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Performance Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">Activity metrics per user — current month</p>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
            🖨 Print / PDF
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
          </div>
        ) : (
          <div>
            {(Object.keys(endpointsMap) as EndpointKey[]).map((key) => renderSection(key))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
