// components/layouts/DashboardLayout.tsx
import Header from "@/components/Dashboard/Header";
import Footer from "@/components/Dashboard/Footer";
import SideNav from "@/components/Dashboard/SideNav";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 md:w-72 bg-gray-800 text-white flex-shrink-0 h-full">
        <div className="flex flex-col h-full justify-between pb-[150px]">
          <SideNav />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full overflow-auto">
        {/* Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-gray-100">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
