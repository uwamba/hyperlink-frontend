"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Item {
  id: number;
  name: string;
  serial_number: string;
  description: string;
  quantity: number;
  price: number;
  brand: string;
  created_at: string;
}

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    serial_number: "",
    description: "",
    quantity: 0,
    price: 0,
    brand: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setAuthToken(token);
    if (token) fetchItems(token);
    else {
      setError("Authentication required. Please log in.");
      setLoading(false);
    }
  }, []);

  const fetchItems = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/items/inStock`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (res.ok && Array.isArray(json.data)) {
        setItems(json.data);
      } else {
        console.error(json.data);
        throw new Error(json.message || "Failed to load items");
      }
    } catch (err) {
      setError("Failed to fetch items. "+err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteItem = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteItem = async () => {
    if (!itemToDelete || !authToken) return;
    try {
      const res = await fetch(`${API_URL}/items/${itemToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete item");
      setItems((prev) => prev.filter((item) => item.id !== itemToDelete));
    } catch (err) {
      setError("Failed to delete item.");
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      serial_number: item.serial_number,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      brand: item.brand,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === "quantity" || name === "price" ? Number(value) : value;
    setEditForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const updateItem = async () => {
    if (!editingItem || !authToken) return;
    try {
      const res = await fetch(`${API_URL}/items/${editingItem.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to update item");

      setItems((prev) =>
        prev.map((itm) => (itm.id === editingItem.id ? json.data : itm))
      );

      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      setError("Failed to update item.");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Item List</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border border-gray-300 rounded-lg shadow-md">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Serial Number</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Quantity</th>
                <th className="border px-4 py-2">Price</th>
                <th className="border px-4 py-2">Brand</th>
                <th className="border px-4 py-2">Created At</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-100">
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2">{item.serial_number}</td>
                    <td className="border px-4 py-2">{item.description}</td>
                    <td className="border px-4 py-2">{item.quantity}</td>
                    <td className="border px-4 py-2">{item.price.toLocaleString()} RWF</td>
                    <td className="border px-4 py-2">{item.brand}</td>
                    <td className="border px-4 py-2">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        onClick={() => confirmDeleteItem(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p>Are you sure you want to delete this item?</p>
            <div className="flex justify-end mt-6 gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={deleteItem}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Item</h3>
            <div className="flex flex-col gap-4">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                className="border px-3 py-2 rounded"
                placeholder="Name"
              />
              <input
                name="serial_number"
                value={editForm.serial_number}
                onChange={handleEditChange}
                className="border px-3 py-2 rounded"
                placeholder="Serial Number"
              />
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                className="border px-3 py-2 rounded"
                placeholder="Description"
              />
              <input
                name="quantity"
                type="number"
                value={editForm.quantity}
                onChange={handleEditChange}
                className="border px-3 py-2 rounded"
                placeholder="Quantity"
              />
              <input
                name="price"
                type="number"
                value={editForm.price}
                onChange={handleEditChange}
                className="border px-3 py-2 rounded"
                placeholder="Price"
              />
              <input
                name="brand"
                value={editForm.brand}
                onChange={handleEditChange}
                className="border px-3 py-2 rounded"
                placeholder="Brand"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
