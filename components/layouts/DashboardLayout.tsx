// components/layouts/DashboardLayout.tsx
import Header from "@/components/Dashboard/Header";
import Footer from "@/components/Dashboard/Footer";
import SideNav from "@/components/Dashboard/SideNav";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen">
      {/* Sidebar */}
      <div className="flex">
        <SideNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />
          
          {/* Main Content Area */}
          <main className="flex-1 p-6">
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
