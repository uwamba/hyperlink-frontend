"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import * as XLSX from "xlsx"; // Import XLSX library

// Register the necessary components for the bar chart
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Update Sale interface based on the available fields
interface Sale {
  year: number;
  date: number;
  month?: number; // Optional, only used in monthly data
  total_income: string;
  total_transactions: number;
}

export default function SalesReport() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'monthly' | 'annually' | 'daily'>('monthly'); // Add granularity state

  useEffect(() => {
    fetchSalesReport();
  }, [granularity]); // Fetch data whenever granularity changes

  const fetchSalesReport = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/report/salesReport`, {
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
        setSales(responseData.data);
      } else {
        throw new Error(responseData.message || "Failed to load sales report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // Export table data to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sales.map((sale) => ({
      'Year/Month': granularity === 'monthly' 
                    ? `${sale.month}-${sale.year}` 
                    : granularity === 'annually' 
                    ? sale.year 
                    : new Date(sale.date).toLocaleDateString(),
      'Total Income': sale.total_income,
      'Total Transactions': sale.total_transactions,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

    // Export the workbook to Excel
    XLSX.writeFile(wb, "sales_report.xlsx");
  };

  // Prepare chart data
  const chartData = {
    labels: sales.map((sale) => {
      if (granularity === "monthly") {
        return `${sale.month}-${sale.year}`;
      } else if (granularity === "annually") {
        return sale.year.toString();
      }
      return new Date(sale.date).toLocaleDateString(); // Daily format if 'daily' granularity
    }),

    datasets: [
      {
        label: "Total Income",
        data: sales.map((sale) => parseFloat(sale.total_income)),
        backgroundColor: "rgba(75, 192, 192, 0.6)", // Bar color
        borderColor: "rgb(75, 192, 192)", // Border color
        borderWidth: 1,
      },
      {
        label: "Total Transactions",
        data: sales.map((sale) => sale.total_transactions),
        backgroundColor: "rgba(255, 99, 132, 0.6)", // Bar color
        borderColor: "rgb(255, 99, 132)", // Border color
        borderWidth: 1,
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" id="sales-report">
        <h2 className="text-2xl font-bold mb-4">Sales Report</h2>

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
            <div className="border rounded-lg mb-6 p-4">
              <h3 className="text-xl font-semibold">Sales Overview</h3>
          
              <Bar data={chartData} options={{ responsive: true }} />
            </div>

            <div className="border rounded-lg overflow-y-scroll h-[450px]">
              <table className="w-full border-collapse">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-2 border">Year/Month</th>
                    <th className="px-4 py-2 border">Total Income</th>
                    <th className="px-4 py-2 border">Total Transactions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {sales.length > 0 ? (
                    sales.map((sale, index) => (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="border px-4 py-2">
                          {granularity === 'monthly'
                            ? `${sale.month}-${sale.year}`
                            : granularity === 'annually'
                            ? sale.year
                            : new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2">{sale.total_income}</td>
                        <td className="border px-4 py-2">{sale.total_transactions}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-4">
                        No sales data available
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
