"use client";

import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Company Name";
const COMPANY_TIN = process.env.NEXT_PUBLIC_COMPANY_TIN || "TIN Number";
const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "Bank Account Name";
const BANK_ACCOUNT_RWF = process.env.NEXT_PUBLIC_BANK_ACCOUNT_RWF || "RWF Account";
const BANK_ACCOUNT_USD = process.env.NEXT_PUBLIC_BANK_ACCOUNT_USD || "USD Account";

export default function DeliveryNoteList() {
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (authToken) fetchDeliveryNotes();
  }, [authToken]);

  useEffect(() => {
    handleSearch(searchQuery);
    setCurrentPage(1);
  }, [searchQuery, deliveryNotes]);

  const fetchDeliveryNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/delivery-notes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.data)) {
        setDeliveryNotes(data.data);
        setFilteredNotes(data.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    const lower = query.toLowerCase();
    const results = deliveryNotes.filter((note) =>
      note.delivery_number.toLowerCase().includes(lower) ||
      note.client?.name?.toLowerCase().includes(lower) ||
      note.recipient?.toLowerCase().includes(lower)
    );
    setFilteredNotes(results);
  };

  const downloadPDFHtml = async () => {
  const input = document.getElementById("delivery-note-html");
  if (!input) return;

  const canvas = await html2canvas(input, {
    scale: 2, // Higher resolution for better quality
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();   // usually 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // usually 297mm

  const margin = 10; // 10mm margins
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  const positionX = margin;
  const positionY = margin;

  pdf.addImage(imgData, "PNG", positionX, positionY, contentWidth, contentHeight);
  pdf.save(`delivery-note-${selectedNote?.delivery_number}.pdf`);
};

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Delivery Notes</h2>
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          placeholder="Search by client, delivery number or recipient"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4 px-4 py-2 border rounded w-full sm:w-1/2"
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Delivery Number</th>
                  <th className="border px-4 py-2">Client</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentNotes.length > 0 ? (
                  currentNotes.map((note) => (
                    <tr key={note.id} className="border">
                      <td className="border px-4 py-2">{note.delivery_number}</td>
                      <td className="border px-4 py-2">{note.client?.name || "N/A"}</td>
                      <td className="border px-4 py-2">{note.delivery_date}</td>
                      <td className="border px-4 py-2 space-x-2">
                        <button onClick={() => setSelectedNote(note)} className="text-blue-500">View</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-2">No matching delivery notes found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm">
                Showing {indexOfFirst + 1}-{Math.min(indexOfLast, filteredNotes.length)} of {filteredNotes.length}
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2">{currentPage}</span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* HTML Modal for Selected Note */}
      {selectedNote && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-lg relative overflow-y-auto max-h-[90vh]">
      {/* Close Button */}
      <button
        onClick={() => setSelectedNote(null)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
      >
        &times;
      </button>

      {/* Printable Content */}
      <div id="delivery-note-html" className="text-sm text-gray-800 leading-relaxed">
        {/* Header Row: Logo Left, Title + Number Right */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <img src="/images/logo.png" alt="Company Logo" className="h-16 object-contain" />
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">DELIVERY NOTE</h2>
            <p className="text-gray-700">Delivery Note #: <span className="font-semibold">{selectedNote.delivery_number}</span></p>
            <p className="text-gray-700">Date: {selectedNote.delivery_date}</p>
          </div>
        </div>

        {/* Company Info */}
        <div className="mb-4">
          <strong>Company:</strong> {COMPANY_NAME}<br />
          <strong>TIN:</strong> {COMPANY_TIN}
        </div>

        {/* Bill To and Ship To in a Row */}
        <div className="flex justify-between mb-4">
          <div className="w-1/2 pr-2">
            <strong>Bill To:</strong><br />
            {selectedNote.client?.name || selectedNote.recipient}
          </div>
          <div className="w-1/2 pl-2">
            <strong>Ship To:</strong><br />
            {selectedNote.recipient}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1 text-left">Item</th>
              <th className="border px-2 py-1 text-left">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {selectedNote.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{item.item_name}</td>
                <td className="border px-2 py-1">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bank Account Info */}
        <div className="mt-6">
          <strong>ACCOUNT:</strong><br />
          Bank Account Name: {BANK_ACCOUNT_NAME}<br />
          Bank of Kigali (RWF): {BANK_ACCOUNT_RWF}<br />
          Bank of Kigali (USD): {BANK_ACCOUNT_USD}
        </div>
      </div>

      {/* Download PDF Button */}
      <div className="mt-4 text-right">
        <button
          onClick={downloadPDFHtml}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Download PDF
        </button>
      </div>
    </div>
  </div>
)}

      
    </DashboardLayout>
  );
}
