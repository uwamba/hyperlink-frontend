import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';

import Link from "next/link";

const SideNav = () => {
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isSubsOpen, setIsSubsOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isJobsOpen, setIsJobsOpen] = useState(false);

  return (
    <nav className="w-64 bg-gray-800 text-white h-full p-4">
      <ul className="space-y-4">
        <li>
          <Link href="/admin/dashboard">
            <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">Dashboard</span>
          </Link>
        </li>
        <li>
          <Link href="/profile">
            <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">Profile</span>
          </Link>
        </li>
        <li>
          <Link href="/settings">
            <span className="block p-3 bg-gray-900 hover:bg-gray-700 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">Settings</span>
          </Link>
        </li>

        {/* Subscriptions */}
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

        {/* Invoices */}
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
              <Link href="/admin/invoices/paid">
                <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Paid Invoice</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/invoices/overdue">
                <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Overdue Invoice</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/invoices/unpaid">
                <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Pending Invoice</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/invoices/add">
                <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Generate invoices</span>
              </Link>
            </li>
          </ul>
        </li>

        {/* Payments */}
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
              <Link href="/admin/payments/add">
                <span className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 ease-in-out">Add</span>
              </Link>
            </li>
          </ul>
        </li>

        {/* Clients */}
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
              <Link href="/admin/clients">
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

        {/* Plans */}
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

        {/* Jobs */}
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
          </ul>
        </li>
      </ul>
    </nav>
  );
};

export default SideNav;
