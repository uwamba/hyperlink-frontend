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
    fetchItems(token);
  }, []);

  const fetchItems = async (token: string | null) => {
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (response.ok && Array.isArray(json.data)) {
        setItems(json.data);
      } else {
        throw new Error(json.message || "Failed to load items");
      }
    } catch (err) {
      setError("Failed to fetch items.");
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
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete item");
      setItems((prev) => prev.filter((item) => item.id !== itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      setError("Failed to delete item.");
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
    setEditForm({ ...editForm, [name]: name === "quantity" || name === "price" ? Number(value) : value });
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
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
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
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="border hover:bg-gray-100">
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2">{item.serial_number}</td>
                    <td className="border px-4 py-2">{item.description}</td>
                    <td className="border px-4 py-2">{item.quantity}</td>
                    <td className="border px-4 py-2">
                      {item.price.toLocaleString()} RWF
                    </td>
                    <td className="border px-4 py-2">{item.brand}</td>
                    <td className="border px-4 py-2">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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
                    No items found
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
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this item?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={deleteItem}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Item</h2>
            <div className="flex flex-col gap-4">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="border px-3 py-2 rounded"
              />
              <input
                name="serial_number"
                value={editForm.serial_number}
                onChange={handleEditChange}
                placeholder="Serial Number"
                className="border px-3 py-2 rounded"
              />
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
                className="border px-3 py-2 rounded"
              />
              <input
                name="quantity"
                type="number"
                value={editForm.quantity}
                onChange={handleEditChange}
                placeholder="Quantity"
                className="border px-3 py-2 rounded"
              />
              <input
                name="price"
                type="number"
                value={editForm.price}
                onChange={handleEditChange}
                placeholder="Price"
                className="border px-3 py-2 rounded"
              />
              <input
                name="brand"
                value={editForm.brand}
                onChange={handleEditChange}
                placeholder="Brand"
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateItem}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
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
