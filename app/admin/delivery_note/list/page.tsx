"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
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
    setCurrentPage(1); // Reset to page 1 on new search
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

  const downloadPDF = (note: any) => {
    if (!note || !note.items || note.items.length === 0) {
      setError("No items available for this delivery note.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(22).setFont("helvetica", "bold").text("DELIVERY NOTE", 20, 20);
    doc.setFontSize(16).text(`DELIVERY NOTE # ${note.delivery_number}`, 20, 30);
    doc.text(COMPANY_NAME, 20, 40);
    doc.setFontSize(12).setFont("helvetica", "normal").text(`TIN: ${COMPANY_TIN}`, 20, 50);

    doc.setFont("helvetica", "bold").text("Bill To:", 20, 65);
    doc.setFont("helvetica", "normal").text(note.client?.name || note.recipient, 40, 65);

    doc.setFont("helvetica", "bold").text("Ship To:", 20, 75);
    doc.setFont("helvetica", "normal").text(note.recipient, 40, 75);

    doc.setFont("helvetica", "bold").text(`${note.delivery_date} Date:`, 20, 85);

    let currentY = 100;
    const startX = 20;
    doc.setFont("helvetica", "bold");
    doc.text("Item", startX, currentY);
    doc.text("Quantity", startX + 90, currentY);

    currentY += 10;
    doc.setFont("helvetica", "normal");

    note.items.forEach((item: any) => {
      const itemName = item.item_name || "";
      const quantity = item.quantity || 0;
      const splitItemName = doc.splitTextToSize(itemName, 80);
      doc.text(splitItemName, startX, currentY);
      doc.text(String(quantity), startX + 90, currentY);
      currentY += 10 + (splitItemName.length - 1) * 6;
    });

    currentY += 20;
    doc.setFont("helvetica", "bold").setFontSize(12).text("ACCOUNT:", startX, currentY);
    doc.setFont("helvetica", "normal").text(`Bank Account Name: ${BANK_ACCOUNT_NAME}`, startX, currentY + 10);
    doc.text(`Bank of Kigali: ${BANK_ACCOUNT_RWF} (RWF)`, startX, currentY + 20);
    doc.text(`Bank of Kigali: ${BANK_ACCOUNT_USD} (USD)`, startX, currentY + 30);

    doc.save(`delivery-note-${note.delivery_number}.pdf`);
  };

  // Pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Delivery Notes</h2>
        {error && <p className="text-red-500">{error}</p>}

        {/* Search Input */}
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
                        <button onClick={() => setSelectedNote(note)} className="text-blue-500">
                          View
                        </button>
                        <button onClick={() => downloadPDF(note)} className="text-green-500">
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-2">
                      No matching delivery notes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
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

      {/* Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setSelectedNote(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Delivery Note #{selectedNote.delivery_number}</h3>
            <p><strong>Client:</strong> {selectedNote.client?.name || selectedNote.recipient}</p>
            <p><strong>Recipient:</strong> {selectedNote.recipient}</p>
            <p><strong>Date:</strong> {selectedNote.delivery_date}</p>

            <h4 className="mt-4 font-semibold">Items:</h4>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              {selectedNote.items && selectedNote.items.length > 0 ? (
                selectedNote.items.map((item: any, index: number) => (
                  <li key={index}>
                    {item.item_name} — Quantity: {item.quantity}
                  </li>
                ))
              ) : (
                <li>No items found for this note.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
