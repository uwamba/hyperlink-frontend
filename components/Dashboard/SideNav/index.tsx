import { useState, useEffect } from "react";
import { ChevronDownIcon } from '@heroicons/react/solid';
import Link from "next/link";

const SideNav = () => {
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isSubsOpen, setIsSubsOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isJobsOpen, setIsJobsOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isSupportsOpen, setIsSupportsOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isSuppliersOpen, setIsSuppliersOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const [isDeliveryNotesOpen, setIsDeliveryNotesOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isFloatOpen, setIsFloatOpen] = useState(false);


  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUserRole(userData.role); // Assuming userData has a 'role' field
    }
  }, []);
  const matchesSearch = (text) => {
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <nav className="w-64 bg-gray-800 text-white h-screen p-4 overflow-y-auto">

      {/* Search input added */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ul className="space-y-4">
        <li>
          <Link href="/admin/dashboard">
            <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">Dashboard</span>
          </Link>
        </li>
       
        {/* Conditionally render setings */}
        {(userRole === 'super_user') && (
        <li>
          <Link href="/admin/settings">
            <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">Settings</span>
          </Link>
        </li>
     )}
        {/* Conditionally render Clients */}
        {(userRole === 'super_user' || userRole === 'sales') && matchesSearch("Clients") && (
          <li>
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Reports
              <span className={`inline-block transition-transform duration-200 ${isReportsOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isReportsOpen ? "max-h-100 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/report/purchases">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Purchases</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/report/expenses">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Expenses</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/report/sales">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Sales</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/report/stock">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Stock</span>
                </Link>
              </li>
               <li>
                <Link href="/admin/report/performance">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Users Performance</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

         {(userRole === 'super_user') && matchesSearch("Clients") && (
          <li>
            <button
              onClick={() => setIsClientsOpen(!isClientsOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Clients
              <span className={`inline-block transition-transform duration-200 ${isClientsOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isClientsOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/clients/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/clients/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Plans */}
        {(userRole === 'super_user') && (
          <li>
            <button
              onClick={() => setIsPlansOpen(!isPlansOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Plans
              <span className={`inline-block transition-transform duration-200 ${isPlansOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isPlansOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/plans/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/plans/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}
        {/* Conditionally render Floats */}
        {(userRole === 'super_user' || userRole === 'manager')  && (
          <li>
            <button
              onClick={() => setIsFloatOpen(!isFloatOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Peticash Floats
              <span className={`inline-block transition-transform duration-200 ${isFloatOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isFloatOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/float/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/float/request">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add  Request</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Subscriptions */}
        {(userRole === 'super_user' || userRole === 'manager' || userRole==='sales' ) && (
          <li>
            <button
              onClick={() => setIsSubsOpen(!isSubsOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Subscriptions
              <span className={`inline-block transition-transform duration-200 ${isSubsOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isSubsOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/subscriptions/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/subscriptions/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Invoices */}
        {(userRole === 'super_user' || userRole === 'sales') && (
          <li>
            <button
              onClick={() => setIsInvoicesOpen(!isInvoicesOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Invoices
              <span className={`inline-block transition-transform duration-200 ${isInvoicesOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isInvoicesOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/invoices/overdue">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Overdue Invoices</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/invoices/paid">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Paid Invoices</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/invoices/unpaid">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Unpaid Invoices</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Payments */}
        {(userRole === 'super_user' || userRole === 'manager') && (
          <li>
            <button
              onClick={() => setIsPaymentsOpen(!isPaymentsOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Payments
              <span className={`inline-block transition-transform duration-200 ${isPaymentsOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isPaymentsOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/payments/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/invoices/unpaid">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {(userRole === 'super_user' || userRole === 'manager') && (
          <li>
            <button
              onClick={() => setIsStockOpen(!isStockOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Stock Management
              <span className={`inline-block transition-transform duration-200 ${isStockOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isStockOpen ? "max-h-80 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <div className="group">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out cursor-pointer">
                    Products
                  </span>
                  <ul className="ml-4 mt-2 space-y-1 hidden group-hover:block">
                    <li>
                      <Link href="/admin/stock/products/add">
                        <span className="block p-2 bg-gray-600 hover:bg-gray-500 rounded transition">Add Product</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/stock/products/list">
                        <span className="block p-2 bg-gray-600 hover:bg-gray-500 rounded transition">List Products</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                      <Link href="/admin/stock/stock_out">
                        <span className="block p-2 bg-gray-600 hover:bg-gray-500 rounded transition">Delivered Stock</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/stock/stock_in">
                        <span className="block p-2 bg-gray-600 hover:bg-gray-500 rounded transition">Stock</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin/stock/new_stock">
                        <span className="block p-2 bg-gray-600 hover:bg-gray-500 rounded transition">New Stock</span>
                      </Link>
                    </li>

             

            </ul>
          </li>
        )}
        {/* Conditionally render Jobs */}
        {(userRole === 'super_user') && (
          <li>
            <button
              onClick={() => setIsJobsOpen(!isJobsOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Jobs
              <span className={`inline-block transition-transform duration-200 ${isJobsOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isJobsOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/jobs/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/jobs/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Supports */}
        {(userRole === 'super_user' || userRole === 'technician') && (
          <li>
            <button
              onClick={() => setIsSupportsOpen(!isSupportsOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Supports
              <span className={`inline-block transition-transform duration-200 ${isSupportsOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isSupportsOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/supports/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/supports/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Expenses */}
        {(userRole === 'super_user' || userRole === 'manager') && (
          <li>
            <button
              onClick={() => setIsExpensesOpen(!isExpensesOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Expenses
              <span className={`inline-block transition-transform duration-200 ${isExpensesOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isExpensesOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/expense/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/expense/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Suppliers */}
        {(userRole === 'super_user' || userRole === 'manager') && (
          <li>
            <button
              onClick={() => setIsSuppliersOpen(!isSuppliersOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Suppliers
              <span className={`inline-block transition-transform duration-200 ${isSuppliersOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isSuppliersOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/suppliers/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/suppliers/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render Asset Management */}
        {(userRole === 'super_user' || userRole === 'manager') && (
          <li>
            <button
              onClick={() => setIsAssetsOpen(!isAssetsOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Asset Management
              <span className={`inline-block transition-transform duration-200 ${isAssetsOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isAssetsOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/assets/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List Assets</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/assets/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New Asset</span>
                </Link>
              </li>
            </ul>
          </li>
        )}
        {/* Conditionally render Asset Management */}
        {(userRole === 'super_user') && (
          <li>
            <button
              onClick={() => setIsUsersOpen(!isUsersOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              User Management
              <span className={`inline-block transition-transform duration-200 ${isUsersOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isUsersOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/user/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List Users</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/user/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New User</span>
                </Link>
              </li>
            </ul>
          </li>
        )}
        {/* Conditionally render Asset Management */}
        {(userRole === 'super_user' || userRole==='manager') && (
          <li>
            <button
              onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Purchase Management
              <span className={`inline-block transition-transform duration-200 ${isPurchasesOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isPurchasesOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/purchases/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/purchases/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add New Purchases</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {/* Conditionally render deluvery notes Management */}
        {(userRole === 'super_user' || userRole==='manager') && (
          <li>
            <button
              onClick={() => setIsDeliveryNotesOpen(!isDeliveryNotesOpen)}
              className="block w-full text-left p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out"
            >
              Delivery Management
              <span className={`inline-block transition-transform duration-200 ${isDeliveryNotesOpen ? "rotate-180" : "rotate-0"}`}>
                <ChevronDownIcon className="w-5 h-5 inline-block" />
              </span>
            </button>
            <ul className={`ml-6 space-y-2 ${isDeliveryNotesOpen ? "max-h-40 overflow-hidden transition-all duration-500 ease-in-out" : "max-h-0 overflow-hidden"}`}>
              <li>
                <Link href="/admin/delivery_note/list">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/delivery_note/add">
                  <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Create New Delivery</span>
                </Link>
              </li>
            </ul>
          </li>
        )}



      </ul>
    </nav>
  );
};

export default SideNav;
