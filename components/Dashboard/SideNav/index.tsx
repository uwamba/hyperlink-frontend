import { useState } from "react";
import Link from "next/link";

const SideNav = () => {
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isSubsOpen, setIsSubsOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);

  return (
    <nav className="w-64 bg-gray-800 text-white h-full p-4">
      <ul className="space-y-4">
        <li>
          <Link href="/admin/dashboard">
            <span className="block p-2 hover:bg-gray-700 rounded">Dashboard</span>
          </Link>
        </li>
        <li>
          <Link href="/profile">
            <span className="block p-2 hover:bg-gray-700 rounded">Profile</span>
          </Link>
        </li>
        <li>
          <Link href="/settings">
            <span className="block p-2 hover:bg-gray-700 rounded">Settings</span>
          </Link>
        </li>

        {/* Subscriptions */}
    
        <li>
          <button
            onClick={() => setIsSubsOpen(!isSubsOpen)}
            className="block w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            Subscriptions {isSubsOpen ? "▲" : "▼"}
          </button>
          {isSubsOpen && (
            <ul className="ml-4 space-y-2">
              <li>
                <Link href="/admin/subscriptions/list">
                  <span className="block p-2 hover:bg-gray-600 rounded">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/subscriptions/add">
                  <span className="block p-2 hover:bg-gray-600 rounded">Add New</span>
                </Link>
              </li>
            </ul>
          )}
        </li>
        {/* Invoices */}
    
        <li>
          <button
            onClick={() => setIsInvoicesOpen(!isInvoicesOpen)}
            className="block w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            Invoices {isInvoicesOpen ? "▲" : "▼"}
          </button>
          {isInvoicesOpen && (
            <ul className="ml-4 space-y-2">
              <li>
                <Link href="/admin/invoices/paid">
                  <span className="block p-2 hover:bg-gray-600 rounded">Paid Invoice</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/invoices/overdu">
                  <span className="block p-2 hover:bg-gray-600 rounded">Overdue Invoice</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/invoices/unpaid">
                  <span className="block p-2 hover:bg-gray-600 rounded">Pending Invoice</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/invoices/add">
                  <span className="block p-2 hover:bg-gray-600 rounded">Generate invoices</span>
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Payments */}
    
        <li>
          <button
            onClick={() => setIsPaymentsOpen(!isPaymentsOpen)}
            className="block w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            Payments {isPaymentsOpen ? "▲" : "▼"}
          </button>
          {isPaymentsOpen && (
            <ul className="ml-4 space-y-2">
              <li>
                <Link href="/admin/payments/list">
                  <span className="block p-2 hover:bg-gray-600 rounded">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/payments/add">
                  <span className="block p-2 hover:bg-gray-600 rounded">Add</span>
                </Link>
              </li>
            </ul>
          )}
        </li>


        {/* Clients */}
        <li>
          <button
            onClick={() => setIsClientsOpen(!isClientsOpen)}
            className="block w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            Clients {isClientsOpen ? "▲" : "▼"}
          </button>
          {isClientsOpen && (
            <ul className="ml-4 space-y-2">
              <li>
                <Link href="/admin/clients">
                  <span className="block p-2 hover:bg-gray-600 rounded">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/clients/add">
                  <span className="block p-2 hover:bg-gray-600 rounded">Add New</span>
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Plans */}
        <li>
          <button
            onClick={() => setIsPlansOpen(!isPlansOpen)}
            className="block w-full text-left p-2 hover:bg-gray-700 rounded"
          >
            Plans {isPlansOpen ? "▲" : "▼"}
          </button>
          {isPlansOpen && (
            <ul className="ml-4 space-y-2">
              <li>
                <Link href="/admin/plans/list">
                  <span className="block p-2 hover:bg-gray-600 rounded">List</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/plans/add">
                  <span className="block p-2 hover:bg-gray-600 rounded">Add New</span>
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default SideNav;
