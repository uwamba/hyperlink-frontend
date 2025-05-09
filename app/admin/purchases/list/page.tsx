"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Purchase {
  id: number;
  invoice_number: string;
  supplier: string
  purchase_date: string;
  total_amount: string;
  note: string | null;
  created_at: string;
}


export default function PurchaseList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/purchases`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const responseData = await response.json();

      if (response.ok && Array.isArray(responseData.data)) {
        setPurchases(responseData.data);
      } else {
        throw new Error(responseData.message || "Failed to load purchases");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!purchaseToEdit) return;

    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/purchases/${purchaseToEdit.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseToEdit),
      });

      if (response.ok) {
        fetchPurchases();
        setIsEditModalOpen(false);
      } else {
        throw new Error("Failed to update purchase");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;

    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/purchases/${purchaseToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        fetchPurchases();
        setIsDeleteDialogOpen(false);
      } else {
        throw new Error("Failed to delete purchase");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Purchases List</h2>

        {error && <p className="text-red-500">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="border rounded-lg overflow-y-scroll h-[450px]">
            <table className="w-full border-collapse">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-2 border">Invoice</th>
                  <th className="px-4 py-2 border">Supplier</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Total Amount</th>
                  <th className="px-4 py-2 border">Note</th>
                  <th className="px-4 py-2 border">Created</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {purchases.length > 0 ? (
                  purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{purchase.invoice_number}</td>
                      <td className="border px-4 py-2">{purchase.supplier || '-'}</td>
                      <td className="border px-4 py-2">
                        {new Date(purchase.purchase_date).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2">{purchase.total_amount}</td>
                      <td className="border px-4 py-2">{purchase.note || '-'}</td>
                      <td className="border px-4 py-2">
                        {new Date(purchase.created_at).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => {
                            setPurchaseToEdit(purchase);
                            setIsEditModalOpen(true);
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded-md mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setPurchaseToDelete(purchase);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded-md"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No purchases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && purchaseToEdit && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-600 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h3 className="text-xl mb-4">Edit Purchase</h3>
            <div>
              <label className="block">Invoice Number</label>
              <input
                type="text"
                value={purchaseToEdit.invoice_number}
                onChange={(e) =>
                  setPurchaseToEdit({ ...purchaseToEdit, invoice_number: e.target.value })
                }
                className="border p-2 w-full mb-4"
              />
              
              <label className="block">Supplier</label>
              <input
                type="text"
                value={purchaseToEdit.supplier ? purchaseToEdit.supplier : ''}
                onChange={(e) =>
                  setPurchaseToEdit({
                    ...purchaseToEdit,supplier:e.target.value
                  })
                }
                className="border p-2 w-full mb-4"
              />
              
              <label className="block">Total Amount</label>
              <input
                type="text"
                value={purchaseToEdit.total_amount}
                onChange={(e) =>
                  setPurchaseToEdit({ ...purchaseToEdit, total_amount: e.target.value })
                }
                className="border p-2 w-full mb-4"
              />
              
              <button
                onClick={handleEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="ml-4 bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && purchaseToDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-600 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h3 className="text-xl mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this purchase?</p>
            <div className="mt-4">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="ml-4 bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
