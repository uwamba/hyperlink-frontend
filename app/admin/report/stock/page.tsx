"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

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

export default function StockReport() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'monthly' | 'annually' | 'daily'>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchStockReport();
  }, [granularity, startDate, endDate]);

  const fetchStockReport = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/report/stockReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          granularity: granularity,
        }),
      });
  
      const responseData = await response.json();
  
      if (response.ok && responseData.status === "success") {
        const periodData = responseData.data.period_data;
  
        // Map the response data to fit the Stock[] interface
        const mappedStocks = Object.keys(periodData).map((key) => {
          const { in_stock_value, delivered_stock_value } = periodData[key];
          const [year, month] = key.split("-");
          const date=key
  
          // Ensure all required fields are included in the mapped object
          return {
            year: parseInt(year),
            month: parseInt(month),
            date:date,
            in_stock_value,
            delivered_stock_value,
            in_stock_count: 0,  // Default value or retrieve from API if available
            delivered_count: 0, // Default value or retrieve from API if available
          };
        });
  
        setStocks(mappedStocks); // Update the state with the mapped stocks data
      } else {
        throw new Error(responseData.message || "Failed to fetch stock report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };
  
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      stocks.map((stock) => ({
        'Period': formatLabel(stock),
        'Total Stock': stock.in_stock_value,
        'Sold Stock': stock.delivered_stock_value,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");
    XLSX.writeFile(wb, "stock_report.xlsx");
  };

  const formatLabel = (stock: Stock) => {
    if (granularity === "monthly" && stock.month && stock.year) {
      return `${stock.month}-${stock.year}`;
    } else if (granularity === "annually" && stock.year) {
      return stock.year.toString();
    } else if (granularity === "daily" && stock.date) {
      return new Date(stock.date).toLocaleDateString();
    }
    return "No data";  // Improved fallback message
  };
  

  const chartData = {
    labels: stocks.map(formatLabel),
    datasets: [
      {
        label: "In Stock Value",
        data: stocks.map((stock) => stock.in_stock_value),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
      },
      {
        label: "Delivered Stock Value",
        data: stocks.map((stock) => stock.delivered_stock_value),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" id="stock-report">
        <h2 className="text-2xl font-bold mb-4">Stock Report</h2>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Granularity</label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as 'monthly' | 'annually' | 'daily')}
              className="border rounded px-2 py-1"
            >
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Export to Excel
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-2">Stock Overview (Bar)</h3>
                <Bar data={chartData} options={{ responsive: true }} />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-2">Stock Trends (Line)</h3>
                <Line data={chartData} options={{ responsive: true }} />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-2">Stock Distribution (Doughnut)</h3>
                <Doughnut
                  data={{
                    labels: ["Total Stock", "Sold Stock"],
                    datasets: [
                      {
                        data: [
                          stocks.reduce((sum, stock) => sum + stock.in_stock_value, 0),
                          stocks.reduce((sum, stock) => sum + stock.delivered_stock_value, 0),
                        ],
                        backgroundColor: [
                          "rgba(54, 162, 235, 0.6)",
                          "rgba(255, 206, 86, 0.6)",
                        ],
                      },
                    ],
                  }}
                  options={{ responsive: true }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-y-scroll h-[450px]">
              <table className="w-full border-collapse">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-2 border">Period</th>
                    <th className="px-4 py-2 border">Total Stock</th>
                    <th className="px-4 py-2 border">Sold Stock</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {stocks.length > 0 ? (
                    stocks.map((stock, index) => (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="border px-4 py-2">{formatLabel(stock)}</td>
                        <td className="border px-4 py-2">{stock.in_stock_value}</td>
                        <td className="border px-4 py-2">{stock.delivered_stock_value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-4">
                        No stock data available
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
