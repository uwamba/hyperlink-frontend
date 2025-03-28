// pages/dashboard.tsx
"use client";

import DashboardLayout from '@/components/layouts/DashboardLayout';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-semibold mb-4">Welcome to the CRM Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example Card 1 */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Leads Overview</h3>
          <p>Track your incoming leads here.</p>
        </div>
        
        {/* Example Card 2 */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Contacts Overview</h3>
          <p>Manage your contacts here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Client with auto gen invoice</h3>
          <p>Manage your contacts here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Client with manual gen invoice</h3>
          <p>Manage your contacts here.</p>
        </div>
        
        {/* Example Card 3 */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Invoice Overview</h3>
          <p>Auto generate invocie.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Invoice overdu invocie</h3>
          <p>Auto generate invocie.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
