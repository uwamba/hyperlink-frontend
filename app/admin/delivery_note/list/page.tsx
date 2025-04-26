"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// API and ENV Configs
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Company Name";
const COMPANY_TIN = process.env.NEXT_PUBLIC_COMPANY_TIN || "TIN Number";
const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "Bank Account Name";
const BANK_ACCOUNT_RWF = process.env.NEXT_PUBLIC_BANK_ACCOUNT_RWF || "RWF Account";
const BANK_ACCOUNT_USD = process.env.NEXT_PUBLIC_BANK_ACCOUNT_USD || "USD Account";

export default function DeliveryNoteList() {
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchDeliveryNotes();
    }
  }, [authToken]);

  const fetchDeliveryNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/delivery-notes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setDeliveryNotes(responseData.data);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (note: any) => {
    if (!note || !note.items || note.items.length === 0) {
      setError("No items available for this delivery note.");
      return;
    }
  
    const doc = new jsPDF();
  
    // Main Titles
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY NOTE", 20, 20);
  
    doc.setFontSize(16);
    doc.text(`DELIVERY NOTE # ${note.delivery_number}`, 20, 30);
  
    doc.setFontSize(16);
    doc.text(COMPANY_NAME, 20, 40);
  
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`TIN: ${COMPANY_TIN}`, 20, 50);
  
    // Billing Details
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(note.recipient, 40, 65);
  
    doc.setFont("helvetica", "bold");
    doc.text("Ship To:", 20, 75);
    doc.setFont("helvetica", "normal");
    doc.text(note.recipient, 40, 75);
  
    doc.setFont("helvetica", "bold");
    doc.text(`${note.delivery_date} Date:`, 20, 85);
  
    // Table Headers
    let currentY = 100;
    const startX = 20;
    doc.setFont("helvetica", "bold");
    doc.text("Item", startX, currentY);
    doc.text("Quantity", startX + 90, currentY);
    doc.text("Rate", startX + 120, currentY);
    doc.text("Amount", startX + 160, currentY);
  
    // Items
    currentY += 10;
    doc.setFont("helvetica", "normal");
  
    let totalAmount = 0;
  
    note.items.forEach((item: any) => {
      const itemName = item.item_name || "";
      const quantity = item.quantity || 0;
      const rate = item.rate || 0;
      const amount = quantity * rate;
  
      const splitItemName = doc.splitTextToSize(itemName, 80); // wrap long item names
  
      doc.text(splitItemName, startX, currentY);
      doc.text(String(quantity), startX + 90, currentY);
      doc.text(`RWF ${rate.toLocaleString()}`, startX + 120, currentY);
      doc.text(`RWF ${amount.toLocaleString()}`, startX + 160, currentY);
  
      // adjust y-axis if item name has multiple lines
      currentY += 10 + (splitItemName.length - 1) * 6;
      totalAmount += amount;
    });
  
    // Total Amount
    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`RWF ${totalAmount.toLocaleString()} Total:`, 160, currentY, { align: "right" });
  
    // Account Information
    currentY += 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ACCOUNT:", startX, currentY);
  
    doc.setFont("helvetica", "normal");
    doc.text(`Bank Account Name: ${BANK_ACCOUNT_NAME}`, startX, currentY + 10);
    doc.text(`Bank of Kigali: ${BANK_ACCOUNT_RWF} (RWF)`, startX, currentY + 20);
    doc.text(`Bank of Kigali: ${BANK_ACCOUNT_USD} (USD)`, startX, currentY + 30);
  
    // Save the PDF
    doc.save(`quote-${note.delivery_number}.pdf`);
  };
  

  const handleViewItems = (note: any) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Delivery Notes</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Delivery Number</th>
                <th className="border px-4 py-2">Recipient</th>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">View</th>
                <th className="border px-4 py-2">Download PDF</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(deliveryNotes) && deliveryNotes.length > 0 ? (
                deliveryNotes.map((note) => (
                  <tr key={note.id} className="border">
                    <td className="border px-4 py-2">{note.delivery_number}</td>
                    <td className="border px-4 py-2">{note.recipient}</td>
                    <td className="border px-4 py-2">{note.delivery_date}</td>
                    <td className="border px-4 py-2">
                      <button
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        onClick={() => handleViewItems(note)}
                      >
                        View Items
                      </button>
                    </td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => downloadPDF(note)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No delivery notes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Modal */}
        {isModalOpen && selectedNote && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-1/2">
              <h2 className="text-xl font-bold mb-4">
                Items in Delivery Note {selectedNote.delivery_number}
              </h2>
              <ul>
                {selectedNote.items.map((item: any, index: number) => (
                  <li key={item.id} className="py-2">
                    <strong>{item.item_name}</strong> - Quantity: {item.quantity}
                  </li>
                ))}
              </ul>
              <button
                onClick={closeModal}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
