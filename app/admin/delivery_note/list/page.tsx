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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any | null>(null);
  const [editedNote, setEditedNote] = useState<any>(null);

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
    //doc.text("Rate", startX + 120, currentY);
    //doc.text("Amount", startX + 160, currentY);

    // Items
    currentY += 10;
    doc.setFont("helvetica", "normal");

    let totalAmount = 0;

    note.items.forEach((item: any) => {
      const itemName = item.item_name || "";
      const quantity = item.quantity || 0;
      //const rate = item.rate || 0;
      //const amount = quantity * rate;

      const splitItemName = doc.splitTextToSize(itemName, 80); // wrap long item names

      doc.text(splitItemName, startX, currentY);
      doc.text(String(quantity), startX + 90, currentY);
      //doc.text(`RWF ${rate.toLocaleString()}`, startX + 120, currentY);
      //doc.text(`RWF ${amount.toLocaleString()}`, startX + 160, currentY);

      // adjust y-axis if item name has multiple lines
      currentY += 10 + (splitItemName.length - 1) * 6;
     //totalAmount += amount;
    });

    // Total Amount
    currentY += 10;
    doc.setFont("helvetica", "bold");
    //doc.text(`RWF ${totalAmount.toLocaleString()} Total:`, 160, currentY, { align: "right" });

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

  const openConfirmDialog = (note: any) => {
    setNoteToDelete(note);
    setIsConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
    setNoteToDelete(null);
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    try {
      const response = await fetch(`${API_URL}/delivery-notes/${noteToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        setDeliveryNotes(deliveryNotes.filter((note) => note.id !== noteToDelete.id));
        closeConfirmDialog();
      } else {
        throw new Error("Failed to delete the delivery note.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      closeConfirmDialog();
    }
  };

  const openEditForm = (note: any) => {
    setEditedNote({ ...note }); // Set the selected note to edit
    setIsEditFormOpen(true);
  };

  const closeEditForm = () => {
    setIsEditFormOpen(false);
    setEditedNote(null);
  };

  const handleEditSubmit = async () => {
    if (!editedNote) return;
    try {
      const response = await fetch(`${API_URL}/delivery-notes/${editedNote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(editedNote),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setDeliveryNotes(
          deliveryNotes.map((note) =>
            note.id === updatedNote.id ? updatedNote : note
          )
        );
        closeEditForm();
      } else {
        throw new Error("Failed to update the delivery note.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedNote) {
      const { name, value } = e.target;
      setEditedNote({ ...editedNote, [name]: value });
    }
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
                <th className="border px-4 py-2">Delete</th>
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
                        className="text-blue-500"
                        onClick={() => handleViewItems(note)}
                      >
                        View
                      </button>
                    </td>
                    <td className="border px-4 py-2">
                      <button
                        className="text-green-500"
                        onClick={() => downloadPDF(note)}
                      >
                        Download
                      </button>
                    </td>
                    
                    <td className="border px-4 py-2">
                      <button
                        className="text-red-500"
                        onClick={() => openConfirmDialog(note)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-2">
                    No delivery notes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Edit Form */}
      {isEditFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md">
            <h2 className="text-xl font-bold mb-4">Edit Delivery Note</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block">Recipient</label>
                <input
                  type="text"
                  name="recipient"
                  value={editedNote?.recipient || ""}
                  onChange={handleInputChange}
                  className="border px-4 py-2 w-full"
                />
              </div>
              <div className="mb-4">
                <label className="block">Delivery Date</label>
                <input
                  type="date"
                  name="delivery_date"
                  value={editedNote?.delivery_date || ""}
                  onChange={handleInputChange}
                  className="border px-4 py-2 w-full"
                />
              </div>
              <div className="mb-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="ml-4 bg-gray-500 text-white py-2 px-4 rounded"
                  onClick={closeEditForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this delivery note?</p>
            <div className="mt-4">
              <button
                className="bg-red-500 text-white py-2 px-4 rounded"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
              <button
                className="ml-4 bg-gray-500 text-white py-2 px-4 rounded"
                onClick={closeConfirmDialog}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md">
            <h2 className="text-xl font-bold mb-4">Items in Delivery Note</h2>
            <ul>
              {selectedNote.items.map((item: any) => (
                <li key={item.id}>{item.item_name} - {item.quantity} x {item.rate}</li>
              ))}
            </ul>
            <button
              className="mt-4 bg-gray-500 text-white py-2 px-4 rounded"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 
