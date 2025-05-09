"use client";

import { useEffect, useState } from "react";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaTimesCircle,
  FaChartLine,
  FaBox,
  FaDollarSign,
  FaStore,
} from "react-icons/fa";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Define the interfaces
interface FinancialStats {
  total_sales: string;
  total_purchases: string;
  total_expenses: string;
  [key: string]: string; // optional for extra fields
}

interface GeneralStats {
  total_assets_value: string;
  total_clients: number;
  active_clients: number;
  [key: string]: string | number;
}

interface StatsData {
  weekly: FinancialStats;
  monthly: FinancialStats;
  annual: FinancialStats;
  general: GeneralStats;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    const dateParam = `&date=${selectedDate.toISOString().split("T")[0]}`;

    fetch(`${API_URL}/statistics?period=${period}${dateParam}`)
      .then((response) => response.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load statistics");
        setLoading(false);
      });
  }, [selectedDate, period]);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-10">Dashboard Overview</h1>

        {/* Period & Date Selector */}
        <div className="mb-6">
          <label htmlFor="period" className="mr-2">Select Period:</label>
          <select id="period" value={period} onChange={handlePeriodChange} className="p-2 border rounded">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>

          <label htmlFor="date" className="ml-4 mr-2">Select Date:</label>
          <input
            type="date"
            id="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={handleDateChange}
            className="p-2 border rounded"
          />
        </div>

        {/* Financial Overview */}
        <Section title="💰 Financial Overview">
          <StatsGrid>
            <StatCard
              title="Total Sales"
              value={stats?.[period]?.total_sales ?? "N/A"}
              icon={<FaDollarSign className="text-green-500 text-3xl" />}
            />
            <StatCard
              title="Total Purchases"
              value={stats?.[period]?.total_purchases ?? "N/A"}
              icon={<FaBox className="text-blue-500 text-3xl" />}
            />
            <StatCard
              title="Total Expenses"
              value={stats?.[period]?.total_expenses ?? "N/A"}
              icon={<FaChartLine className="text-red-500 text-3xl" />}
            />
          </StatsGrid>
        </Section>

        {/* General Stats */}
        <Section title="🌍 General Stats">
          <StatsGrid>
            <StatCard
              title="Total Clients"
              value={stats?.general?.total_clients ?? "N/A"}
              icon={<FaUsers className="text-blue-500 text-3xl" />}
            />
            <StatCard
              title="Active Clients"
              value={stats?.general?.active_clients ?? "N/A"}
              icon={<FaCheckCircle className="text-green-500 text-3xl" />}
            />
          </StatsGrid>
          <StatsGrid>
            
            <StatCard
              title="Assets Value"
              value={stats?.general?.total_assets_value ?? "N/A"}
              icon={<FaCheckCircle className="text-green-500 text-3xl" />}
            />
          </StatsGrid>
        </Section>
      </div>
    </DashboardLayout>
  );
}

// --- Reusable components ---
function StatCard({ title, value, icon }: { title: string; value: any; icon: JSX.Element }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 hover:shadow-lg transition">
      {icon}
      <div>
        <h3 className="text-sm text-gray-500">{title}</h3>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function StatsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="text-lg font-medium mb-2">{title}</h4>
      {children}
    </div>
  );
}
