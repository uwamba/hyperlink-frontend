// components/layouts/DashboardLayout.tsx
import Header from "@/components/Dashboard/Header";
import Footer from "@/components/Dashboard/Footer";
import SideNav from "@/components/Dashboard/SideNav";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      {/* Sidebar */}
      <div className="flex flex-1">
        <SideNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />

          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
