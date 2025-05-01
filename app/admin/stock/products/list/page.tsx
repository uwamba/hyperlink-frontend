"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  created_at: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    brand: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setAuthToken(token);
    fetchProducts(token);
  }, []);

  const fetchProducts = async (token: string | null) => {
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (response.ok && Array.isArray(json.data)) {
        setProducts(json.data);
      } else {
        throw new Error(json.message || "Failed to load products");
      }
    } catch (err) {
      setError("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteProduct = (id: number) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteProduct = async () => {
    if (!productToDelete || !authToken) return;
    try {
      const res = await fetch(`${API_URL}/products/${productToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      setError("Failed to delete product.");
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      brand: product.brand,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updateProduct = async () => {
    if (!editingProduct || !authToken) return;
    try {
      const res = await fetch(`${API_URL}/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to update product");

      setProducts((prev) =>
        prev.map((prod) => (prod.id === editingProduct.id ? json.data : prod))
      );

      setShowEditModal(false);
      setEditingProduct(null);
    } catch (err) {
      setError("Failed to update product.");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Product List</h2>
        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Brand</th>
                <th className="border px-4 py-2">Created At</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="border hover:bg-gray-100">
                    <td className="border px-4 py-2">{product.name}</td>
                    <td className="border px-4 py-2">{product.description}</td>
                    <td className="border px-4 py-2">{product.brand}</td>
                    <td className="border px-4 py-2">
                      {new Date(product.created_at).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => openEditModal(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => confirmDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No products found
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
            <p>Are you sure you want to delete this product?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={deleteProduct}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Product</h2>
            <div className="flex flex-col gap-4">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="border px-3 py-2 rounded"
              />
              <input
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
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
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateProduct}
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
