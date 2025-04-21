"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

interface Supplier {
  id: number;
  name: string;
  email: string;
  address: string;
}

export default function CreatePlan() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    provider_price: "",
    duration: "",
    description: "",
    supplier_id: "",
    provider_name: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch suppliers from API
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Update filtered suppliers when search term or suppliers list changes
  useEffect(() => {
    const filtered = suppliers.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_URL}/suppliers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok) {
        setSuppliers(json.data);
        setFilteredSuppliers(json.data);
      } else {
        setError(json.message || "Failed to load suppliers");
      }
    } catch (err) {
      setError("Failed to fetch suppliers.");
    }
  };

  // Handle form data changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("authToken");

    try {
      const res = await fetch(`${API_URL}/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok) {
        setMessage("Plan created successfully.");
        setFormData({
          name: "",
          price: "",
          provider_price: "",
          duration: "",
          description: "",
          supplier_id: "",
          provider_name: "",
        });
      } else {
        setError(json.message || "Failed to create plan.");
      }
    } catch (err) {
      setError("Error while submitting plan.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Create New Plan</h1>

        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            placeholder="Plan Name"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="price"
            value={formData.price}
            placeholder="Price"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="provider_price"
            value={formData.provider_price}
            placeholder="Provider Price"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="number"
            name="duration"
            value={formData.duration}
            placeholder="Duration (days)"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="text"
            name="provider_name"
            value={formData.provider_name}
            placeholder="Provider Name"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />

          <textarea
            name="description"
            value={formData.description}
            placeholder="Description"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          {/* Search Supplier inside select dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
              onFocus={() => setIsDropdownOpen(true)}
            />

            <div className={`absolute left-0 right-0 mt-1 bg-white border rounded ${isDropdownOpen ? "block" : "hidden"}`}>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    onClick={() => {
                      setFormData({ ...formData, supplier_id: supplier.id.toString() });
                      setSearchTerm(supplier.name);
                      setIsDropdownOpen(false);
                    }}
                    className="p-2 cursor-pointer hover:bg-gray-200"
                  >
                    {supplier.name} - {supplier.email}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No suppliers found</div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
