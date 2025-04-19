"use client";

import { useState, useEffect } from "react";
import DashboardLayout from '@/components/layouts/DashboardLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function RegisterAsset() {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        serial_number: "",
        value: "",
        purchase_date: "",
        location: "",
        status: "",
        description: "",
    });

    const [authToken, setAuthToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        // Get auth token from localStorage
        const token = localStorage.getItem("authToken");
        if (!token) {
            setError("Authentication required. Please log in.");
        }
        setAuthToken(token);
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!authToken) {
            setError("You are not authenticated. Please log in.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/assets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`, // Add Auth Header
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Asset registration failed");
            }

            setSuccess("Asset registered successfully!");
            setFormData({
                name: "",
                category: "",
                serial_number: "",
                value: "",
                purchase_date: "",
                location: "",
                status: "",
                description: "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
                    <h2 className="mb-4 text-center text-2xl font-bold">Register Asset</h2>

                    {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
                    {success && <p className="mb-4 text-sm text-green-500">{success}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Asset Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Vehicle">Vehicle</option>
                            <option value="IT Equipment">IT Equipment</option>
                            <option value="Building">Building</option>
                            <option value="Other">Other</option>
                        </select>

                        <input
                            type="text"
                            name="serial_number"
                            placeholder="Serial Number"
                            value={formData.serial_number}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="number"
                            name="value"
                            placeholder="Value"
                            value={formData.value}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="date"
                            name="purchase_date"
                            placeholder="Purchase Date"
                            value={formData.purchase_date}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            name="location"
                            placeholder="Location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Under Maintenance</option>
                        </select>
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {loading ? "Registering..." : "Register Asset"}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
