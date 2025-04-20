"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function DeliveryNoteList() {
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null); // State for selected delivery note
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  // Load auth token from localStorage
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
    } else {
      setAuthToken(token);
    }
  }, []);

  // Fetch delivery notes when token is available
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

  // Function to generate and download the PDF
  const downloadPDF = (note: any) => {
    if (!note.items || note.items.length === 0) {
      setError("No items available for this delivery note.");
      return;
    }
  
    const doc = new jsPDF();
    
    // Set font size for the title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Delivery Note", 20, 20);
  
    // Set font size for the details section
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
  
    // Delivery note details
    doc.text(`Delivery Number: ${note.delivery_number}`, 20, 30);
    doc.text(`Recipient: ${note.recipient}`, 20, 40);
    doc.text(`Delivery Date: ${note.delivery_date}`, 20, 50);
  
    // Add some space before the items table
    doc.text("Items:", 20, 60);
  
    // Table Header
    const header = ["Item Name", "Quantity"];
    const tableColumnWidths = [100, 50];  // Adjust table columns width if necessary
    const startX = 20;  // Starting X position for the table
    let currentY = 70;  // Starting Y position for the table
  
    // Draw the table header with bold font
    doc.setFont("helvetica", "bold");
    header.forEach((column, index) => {
      doc.text(column, startX + index * tableColumnWidths[index], currentY);
    });
  
    // Draw table separator
    currentY += 10;  // Move below the header
    doc.line(startX, currentY, startX + tableColumnWidths[0] + tableColumnWidths[1], currentY);  // Table line separator
  
    // Draw table rows with item details
    doc.setFont("helvetica", "normal");
    note.items.forEach((item: any, index: number) => {
      currentY += 10;
      doc.text(item.item_name, startX, currentY);
      doc.text(String(item.quantity), startX + tableColumnWidths[0], currentY);
    });
  
    // Draw table footer line
    currentY += 10;  // Leave some space after the items
    doc.line(startX, currentY, startX + tableColumnWidths[0] + tableColumnWidths[1], currentY);
  
    // Save the PDF
    doc.save(`delivery_note_${note.delivery_number}.pdf`);
  };
  
  // Function to handle item view in modal
  const handleViewItems = (note: any) => {
    setSelectedNote(note);
    setIsModalOpen(true); // Open the modal
  };

  // Function to close the modal
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
                  <td colSpan={5} className="text-center py-4">No delivery notes found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Modal to display items */}
        {isModalOpen && selectedNote && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-1/2">
              <h2 className="text-xl font-bold mb-4">Items in Delivery Note {selectedNote.delivery_number}</h2>
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
