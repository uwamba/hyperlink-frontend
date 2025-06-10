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
  [key: string]: any; // flexible keys for each endpoint
}

type EndpointKey =
  | "userPerformance"
  | "performancePayments"
  | "items"
  | "deliveryNotes"
  | "subscriptions"
  | "invoices"
  | "purchases"
  | "assets";

const endpointsMap: Record<
  EndpointKey,
  { endpoint: string; keysMapping: Record<string, string> }
> = {
  userPerformance: {
    endpoint: "user-performance",
    keysMapping: {
      clients_created_this_month: "Clients Created",
      clients_updated_this_month: "Clients Updated",
      tickets_created_this_month: "Tickets Created",
      tickets_updated_this_month: "Tickets Updated",
    },
  },
  performancePayments: {
    endpoint: "performance-payments",
    keysMapping: {
      created_this_month: "Performance Payments Created",
      updated_this_month: "Performance Payments Updated",
    },
  },
  items: {
    endpoint: "items",
    keysMapping: {
      items_created_this_month: "Items Created",
      items_updated_this_month: "Items Updated",
    },
  },
  deliveryNotes: {
    endpoint: "delivery-notes",
    keysMapping: {
      created_this_month: "Delivery Notes Created",
      updated_this_month: "Delivery Notes Updated",
    },
  },
  subscriptions: {
    endpoint: "subscriptions",
    keysMapping: {
      created_this_month: "Subscriptions Created",
      updated_this_month: "Subscriptions Updated",
    },
  },
  invoices: {
    endpoint: "invoices",
    keysMapping: {
      invoices_paid_this_month: "Invoices Paid",
    },
  },
  purchases: {
    endpoint: "purchases",
    keysMapping: {
      purchases_created_this_month: "Purchases Created",
      purchases_updated_this_month: "Purchases Updated",
    },
  },
  assets: {
    endpoint: "assets",
    keysMapping: {
      assets_created_this_month: "Assets Created",
      assets_updated_this_month: "Assets Updated",
    },
  },
};

export default function PerformanceReport() {
  // State holds data per endpoint
  const [data, setData] = useState<Record<EndpointKey, BaseReportRow[]>>({
    userPerformance: [],
    performancePayments: [],
    items: [],
    deliveryNotes: [],
    subscriptions: [],
    invoices: [],
    purchases: [],
    assets: [],
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const entries = Object.entries(endpointsMap);

      // Note the '/stats/' prefix added here
      const results = await Promise.all(
        entries.map(([key, { endpoint }]) =>
          fetch(`${API_URL}/stats/${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }).then(async (res) => {
            if (!res.ok) {
              const json = await res.json().catch(() => null);
              throw new Error(json?.message || `Failed to fetch ${endpoint}`);
            }
            return res.json();
          })
        )
      );

      const newData: Record<EndpointKey, BaseReportRow[]> = {} as any;

      entries.forEach(([key], i) => {
        newData[key as EndpointKey] = results[i].data || [];
      });

      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // Export data for given endpoint to Excel
  const exportToExcel = (key: EndpointKey) => {
    const { keysMapping } = endpointsMap[key];
    const rows = data[key];
    if (!rows || rows.length === 0) {
      alert("No data to export.");
      return;
    }

    const sheetData = rows.map((row) => {
      const rowData: Record<string, any> = { "User Name": row.user_name };
      Object.entries(keysMapping).forEach(([sourceKey, label]) => {
        rowData[label] = row[sourceKey] ?? 0;
      });
      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, key);
    XLSX.writeFile(wb, `${key}_performance.xlsx`);
  };

  // Render chart and table for each endpoint
  const renderReportSection = (key: EndpointKey) => {
    const { keysMapping } = endpointsMap[key];
    const rows = data[key];

    if (!rows || rows.length === 0) {
      return (
        <p className="text-center py-4 text-gray-500" key={key}>
          No data available for {key}
        </p>
      );
    }

    const chartData = {
      labels: rows.map((r) => r.user_name),
      datasets: Object.entries(keysMapping).map(([sourceKey, label], idx) => ({
        label,
        data: rows.map((r) => r[sourceKey] ?? 0),
        backgroundColor: `hsl(${(idx * 50) % 360}, 70%, 60%)`,
      })),
    };

    return (
      <section key={key} className="mb-10">
        <h3 className="text-xl font-semibold mb-4 capitalize">
          {key.replace(/([A-Z])/g, " $1")}
        </h3>
        <button
          onClick={() => exportToExcel(key)}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          Export {key} to Excel
        </button>
        <div className="border rounded-lg mb-4 p-4 overflow-x-auto max-w-full">
          <Bar data={chartData} options={{ responsive: true }} />
        </div>
        <div className="border rounded-lg overflow-auto max-h-[300px]">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="bg-gray-800 text-white sticky top-0">
              <tr>
                <th className="px-3 py-2 border">User</th>
                {Object.values(keysMapping).map((label) => (
                  <th key={label} className="px-3 py-2 border">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-100">
                  <td className="border px-3 py-2">{r.user_name}</td>
                  {Object.keys(keysMapping).map((sourceKey) => (
                    <td key={sourceKey} className="border px-3 py-2">
                      {r[sourceKey] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" id="performance-report">
        <h2 className="text-2xl font-bold mb-6">User Performance Report</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {(Object.keys(endpointsMap) as EndpointKey[]).map((key) =>
              renderReportSection(key)
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
