"use client"; // Only for App Router

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

   

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/password/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: email }),
        credentials: 'include'  // ✅ This tells the browser to send cookies
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text(); // Catch unexpected HTML/text
        throw new Error(`Unexpected response: ${text}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setMessage("✅ A reset link has been sent to your email.");
      setEmail(""); // Clear the email input after success
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-96 p-6 bg-white shadow-md rounded"
      >
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>

        {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-2 border border-gray-300 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
