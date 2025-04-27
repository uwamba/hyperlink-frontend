"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import * as XLSX from "xlsx"; // Import XLSX library

// Register the necessary components for the pie chart
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Update Purchase interface based on the available fields
interface Purchase {
  year: number;
  date: number;
  month?: number; // Optional, only used in monthly data
  total_amount: string;
}

export default function PurchaseReport() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'monthly' | 'annually' | 'daily'>('monthly'); // Add granularity state

  useEffect(() => {
    fetchPurchaseReport();
  }, [granularity]); // Fetch data whenever granularity changes

  const fetchPurchaseReport = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/report/purchasesReport`, {
        method: 'POST', // Set to POST request
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json', // Ensure correct content type
        },
        body: JSON.stringify({
          start_date: "", // Add start_date if needed
          end_date: "",   // Add end_date if needed
          granularity: granularity, // or 'daily', 'annually'
        }),
      });

      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setPurchases(responseData.data);
      } else {
        throw new Error(responseData.message || "Failed to load purchase report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // Export table data to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(purchases.map((purchase) => ({
      'Year/Month': granularity === 'monthly' 
                    ? `${purchase.month}-${purchase.year}` 
                    : granularity === 'annually' 
                    ? purchase.year 
                    : new Date(purchase.date).toLocaleDateString(),
      'Total Amount': purchase.total_amount,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Report");

    // Export the workbook to Excel
    XLSX.writeFile(wb, "purchase_report.xlsx");
  };

  // Prepare chart data
  const chartData = {
    labels: purchases.map((purchase) => {
      if (granularity === "monthly") {
        return `${purchase.month}-${purchase.year}`;
      } else if (granularity === "annually") {
        return purchase.year.toString();
      }
      return new Date(purchase.date).toLocaleDateString(); // Daily format if 'daily' granularity
    }),

    datasets: [
      {
        label: "Total Amount",
        data: purchases.map((purchase) => parseFloat(purchase.total_amount)),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF5733", "#33FF57", "#5733FF", "#FF33A1",
        ], // Different colors for each segment
        hoverOffset: 4,
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" id="purchase-report">
        <h2 className="text-2xl font-bold mb-4">Purchase Report</h2>

        {error && <p className="text-red-500">{error}</p>}

        <div>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'monthly' | 'annually' | 'daily')}
            className="mb-4"
          >
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="daily">Daily</option>
          </select>
        </div>

        <div className="mb-4">
          <button
            onClick={exportToExcel}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Export to Excel
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            {/* Pie Chart Section */}
            <div className="border rounded-lg mb-6 p-4">
              <h3 className="text-xl font-semibold">Purchase Overview</h3>
              <Pie data={chartData} options={{ responsive: true }} />
            </div>

            {/* Table Section */}
            <div className="border rounded-lg overflow-y-scroll h-[450px]">
              <table className="w-full border-collapse">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-2 border">Year/Month</th>
                    <th className="px-4 py-2 border">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {purchases.length > 0 ? (
                    purchases.map((purchase, index) => (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="border px-4 py-2">
                          {granularity === 'monthly'
                            ? `${purchase.month}-${purchase.year}`
                            : granularity === 'annually'
                            ? purchase.year
                            : new Date(purchase.date).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2">{purchase.total_amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center py-4">
                        No purchase data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
