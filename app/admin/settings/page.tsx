'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  DEFAULT_BANKS,
  DEFAULT_MOMO,
  LS_KEY_BANKS,
  LS_KEY_MOMO,
  getBanks,
  getMomo,
  saveBanks,
  saveMomo,
  type PaymentOption,
} from '@/data/paymentMethods';

const initialSettings = {
  NEXT_PUBLIC_API_BASE_URL:      process.env.NEXT_PUBLIC_API_BASE_URL      || '',
  NEXT_PUBLIC_COMPANY_NAME:      process.env.NEXT_PUBLIC_COMPANY_NAME      || '',
  NEXT_PUBLIC_COMPANY_TIN:       process.env.NEXT_PUBLIC_COMPANY_TIN       || '',
  NEXT_PUBLIC_BANK_ACCOUNT_NAME: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || '',
  NEXT_PUBLIC_BANK_ACCOUNT_RWF:  process.env.NEXT_PUBLIC_BANK_ACCOUNT_RWF  || '',
  NEXT_PUBLIC_BANK_ACCOUNT_USD:  process.env.NEXT_PUBLIC_BANK_ACCOUNT_USD  || '',
};

// ─── Editable list sub-component ─────────────────────────────────────────────
function EditableList({
  title,
  items,
  onChange,
  onReset,
}: {
  title: string;
  items: PaymentOption[];
  onChange: (items: PaymentOption[]) => void;
  onReset: () => void;
}) {
  const [newLabel, setNewLabel] = useState('');

  const addItem = () => {
    const label = newLabel.trim();
    if (!label) return;
    onChange([...items, { label, value: label }]);
    setNewLabel('');
  };

  const removeItem = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
        >
          Reset to defaults
        </button>
      </div>

      <ul className="divide-y divide-gray-100">
        {items.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-400">No entries yet.</li>
        )}
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-gray-700">{item.label}</span>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder="Add new entry…"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [formData, setFormData]   = useState(initialSettings);
  const [banks, setBanks]         = useState<PaymentOption[]>([]);
  const [momoList, setMomoList]   = useState<PaymentOption[]>([]);
  const [banksSaved, setBanksSaved]   = useState(false);
  const [momoSaved, setMomoSaved]     = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setBanks(getBanks());
    setMomoList(getMomo());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } else {
      alert('Failed to save settings.');
    }
  };

  const savePaymentMethods = () => {
    saveBanks(banks);
    saveMomo(momoList);
    setBanksSaved(true);
    setMomoSaved(true);
    setTimeout(() => { setBanksSaved(false); setMomoSaved(false); }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6 space-y-10">

        {/* ── App Settings ── */}
        <section>
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Application configuration</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Environment Variables</h2>
              <p className="text-xs text-gray-400 mt-0.5">Changes require a server restart to take effect.</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{key}</label>
                  <input
                    type="text"
                    name={key}
                    value={String(value)}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
              {settingsSaved && (
                <span className="text-sm text-green-600 font-medium">✓ Saved! Restart server to apply.</span>
              )}
            </div>
          </form>
        </section>

        {/* ── Payment Methods ── */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Payment Methods</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage the banks and MoMo providers shown to users during payment. Saved locally in this browser.
            </p>
          </div>

          <div className="space-y-4">
            <EditableList
              title="Banks"
              items={banks}
              onChange={setBanks}
              onReset={() => setBanks(DEFAULT_BANKS)}
            />

            <EditableList
              title="MoMo Providers"
              items={momoList}
              onChange={setMomoList}
              onReset={() => setMomoList(DEFAULT_MOMO)}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={savePaymentMethods}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Payment Methods
              </button>
              {(banksSaved || momoSaved) && (
                <span className="text-sm text-green-600 font-medium">✓ Saved — payment modal will now use these lists.</span>
              )}
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
