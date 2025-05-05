"use client";

import { useState, useEffect } from "react";
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function RegisterPettyCashRequest() {
    const [formData, setFormData] = useState({
        amount: "",
        reason: "",
        requested_for: "",
    });

    const [authToken, setAuthToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Get auth token from localStorage
        const token = localStorage.getItem("authToken");
        if (!token) {
            setError("Authentication required. Please log in.");
        }
        setAuthToken(token);

        // Get user data from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData)); // Parse user data from localStorage
            console.log("User data:", JSON.parse(userData));
        } else {
            setError("User data not found.");
        }
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

        if (!user) {
            setError("User data is missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            // Send the user_id along with the request body
            const response = await fetch(`${API_URL}/petty-cash-floats/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    ...formData,
                    user_id: user.id,  // Include the user_id from localStorage
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Petty cash request failed");
            }

            setSuccess("Petty cash request created successfully!");
            setFormData({
                amount: "",
                reason: "",
                requested_for: "",
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
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md relative">
                    <div className="absolute right-6 top-6">
                        <Link
                            href="/admin/float/list"
                            className="inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                            &larr; Go To List
                        </Link>
                    </div>
                    <h2 className="mb-4 text-left text-2xl font-bold">Request Petty Cash</h2>

                    {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
                    {success && <p className="mb-4 text-sm text-green-500">{success}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="number"
                            name="amount"
                            placeholder="Amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <textarea
                            name="reason"
                            placeholder="Reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="date"
                            name="requested_for"
                            placeholder="Requested for"
                            value={formData.requested_for}
                            onChange={handleChange}
                            className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {loading ? "Submitting..." : "Submit Request"}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
