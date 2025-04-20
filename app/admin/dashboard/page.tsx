"use client";

import { useEffect, useState } from "react";
import { FaUsers, FaFileInvoiceDollar, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DashboardLayout from "@/components/layouts/DashboardLayout"; // Make sure to import your layout

interface DashboardStats {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  total_invoices: number;
  unpaid_invoices: number;
  total_payments_received: number;
  daily_invoices: number;
  daily_payments: number;
  weekly_invoices: number;
  weekly_payments: number;
  monthly_invoices: number;
  monthly_payments: number;
  annual_invoices: number;
  annual_payments: number;
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/client-statistics`)
      .then(response => response.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center text-lg mt-10">Loading statistics...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Clients" value={stats?.total_clients} icon={<FaUsers className="text-blue-500 text-3xl" />} />
          <StatCard title="Active Clients" value={stats?.active_clients} icon={<FaCheckCircle className="text-green-500 text-3xl" />} />
          <StatCard title="Inactive Clients" value={stats?.inactive_clients} icon={<FaTimesCircle className="text-red-500 text-3xl" />} />
        </div>

        {/* Invoice & Payment Stats */}
        <h2 className="text-2xl font-semibold mt-8 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Invoices" value={stats?.total_invoices} icon={<FaFileInvoiceDollar className="text-indigo-500 text-3xl" />} />
          <StatCard title="Unpaid Invoices" value={stats?.unpaid_invoices} icon={<FaTimesCircle className="text-red-500 text-3xl" />} />
          <StatCard title="Total Payments" value={`$${stats?.total_payments_received}`} icon={<FaCheckCircle className="text-green-500 text-3xl" />} />
        </div>

        {/* Periodic Stats */}
        <h2 className="text-2xl font-semibold mt-8 mb-4">Periodic Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Daily Invoices" value={stats?.daily_invoices} icon={<FaFileInvoiceDollar className="text-indigo-500 text-3xl" />} />
          <StatCard title="Daily Payments" value={`$${stats?.daily_payments}`} icon={<FaCheckCircle className="text-green-500 text-3xl" />} />
          <StatCard title="Weekly Invoices" value={stats?.weekly_invoices} icon={<FaFileInvoiceDollar className="text-indigo-500 text-3xl" />} />
          <StatCard title="Weekly Payments" value={`$${stats?.weekly_payments}`} icon={<FaCheckCircle className="text-green-500 text-3xl" />} />
          <StatCard title="Monthly Invoices" value={stats?.monthly_invoices} icon={<FaFileInvoiceDollar className="text-indigo-500 text-3xl" />} />
          <StatCard title="Monthly Payments" value={`$${stats?.monthly_payments}`} icon={<FaCheckCircle className="text-green-500 text-3xl" />} />
          <StatCard title="Annual Invoices" value={stats?.annual_invoices} icon={<FaFileInvoiceDollar className="text-indigo-500 text-3xl" />} />
          <StatCard title="Annual Payments" value={`$${stats?.annual_payments}`} icon={<FaCheckCircle className="text-green-500 text-3xl" />} />
        </div>

        {/* Subscription Stats */}
        <h2 className="text-2xl font-semibold mt-8 mb-4">Subscription Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Subscriptions" value={stats?.total_subscriptions} icon={<FaUsers className="text-blue-500 text-3xl" />} />
          <StatCard title="Active Subscriptions" value={stats?.active_subscriptions} icon={<FaCheckCircle className="text-green-500 text-3xl" />} />
          <StatCard title="Expired Subscriptions" value={stats?.expired_subscriptions} icon={<FaTimesCircle className="text-red-500 text-3xl" />} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon }: { title: string, value: any, icon: JSX.Element }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
      {icon}
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
