'use client';

import { useState } from 'react';

export default function SettingsPage() {
  // Prefill form data directly from environment variables
  const initialSettings = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME || '',
    NEXT_PUBLIC_COMPANY_TIN: process.env.NEXT_PUBLIC_COMPANY_TIN || '',
    NEXT_PUBLIC_BANK_ACCOUNT_NAME: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || '',
    NEXT_PUBLIC_BANK_ACCOUNT_RWF: process.env.NEXT_PUBLIC_BANK_ACCOUNT_RWF || '',
    NEXT_PUBLIC_BANK_ACCOUNT_USD: process.env.NEXT_PUBLIC_BANK_ACCOUNT_USD || '',
  };
  

  const [formData, setFormData] = useState(initialSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Send POST request to API route to update .env.local settings
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert('Settings saved! Please restart the server.');
    } else {
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="block text-gray-700">{key}</label>
            <input
              type="text"
              name={key}
              value={String(value)}  // Ensure the value is a string
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        ))}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
