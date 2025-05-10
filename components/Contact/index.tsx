"use client";
import React, { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function Contact() {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // For now, using clientName as client_id (replace with actual user ID logic later)
    const clientId = clientName || "guest";

    try {
      const response = await fetch(`${API_URL}/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          email: clientEmail,
          description: description,
          address: address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Inquiry submitted successfully!");
        setClientName("");
        setClientEmail("");
        setDescription("");
        setAddress("");
      } else {
        setError(data.message || "An error occurred.");
      }
    } catch (err: any) {
      setError("Failed to submit inquiry. " + err.message);
    }
  };

  return (
    <section
      id="Contact Us"
      className="overflow-hidden py-16 md:py-10 lg:py-8 flex justify-center items-center"
    >
      <div className="container flex justify-center">
        <div className="w-full max-w-[1200px] ">
          <div className="shadow-lg rounded-sm bg-white px-8 py-11">
            <h2 className="mb-3 text-2xl font-bold text-black sm:text-3xl">
              Need Help? Open a Ticket
            </h2>
            <p className="mb-4 text-base text-gray-600">
              Our support team will get back to you ASAP via email.
            </p>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-600 mb-4">{success}</p>}

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 font-medium">Your Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Your Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border rounded"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 font-medium">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your issue (max 20 characters)"
                    maxLength={20}
                    className="w-full px-4 py-2 border rounded resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 font-medium">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Your address"
                    className="w-full px-4 py-2 border rounded resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
