"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";


const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function Contact() {
  const [formData, setFormData] = useState({
    email: "",
    issue: "",
    category: "",
    description: "",
    address: "",
    status: "pending"
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/client/supports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 202) {
        setRequiresVerification(true);
        setSuccess("OTP sent to your email. Please verify to complete your request.");
      } else if (response.ok) {
        setSuccess("Support ticket created successfully!");
        resetForm();
      } else {
        throw new Error(data.message || "Failed to create ticket.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Email verified successfully! Your support ticket has been created.");
        resetForm();
        setRequiresVerification(false);
      } else {
        throw new Error(data.message || "Verification failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification error occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      issue: "",
      category: "",
      description: "",
      address: "",
      status: "pending"
    });
    setOtp("");
  };

  if (requiresVerification) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <p className="mb-4">We've sent a 6-digit OTP to {formData.email}. Please check your inbox.</p>

          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setRequiresVerification(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to form
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            {success && <p className="text-green-500 mb-4">{success}</p>}

            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
            >


              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Issue
                </label>
                <input
                  type="text"
                  name="issue"
                  value={formData.issue}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  placeholder="Brief issue description"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="general">General Inquiry</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  placeholder="Detailed description"
                  rows={5}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  placeholder="Address"
                />
              </div>

              

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Ticket
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
