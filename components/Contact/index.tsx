"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const CATEGORIES = [
  { value: "technical", label: "🔧 Technical Issue" },
  { value: "billing",   label: "💳 Billing" },
  { value: "general",   label: "💬 General Inquiry" },
  { value: "feature",   label: "✨ Feature Request" },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    email: "", issue: "", category: "", description: "", address: "", status: "pending",
  });
  const [error, setError]                         = useState<string | null>(null);
  const [success, setSuccess]                     = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otp, setOtp]                             = useState("");
  const [isVerifying, setIsVerifying]             = useState(false);
  const [submitting, setSubmitting]               = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/client/supports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.status === 202) {
        setRequiresVerification(true);
        setSuccess("OTP sent to your email. Please verify to complete your request.");
      } else if (res.ok) {
        setSuccess("Support ticket created successfully! We'll be in touch soon.");
        setFormData({ email: "", issue: "", category: "", description: "", address: "", status: "pending" });
      } else {
        throw new Error(data.message || "Failed to create ticket.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Email verified! Your support ticket has been created.");
        setFormData({ email: "", issue: "", category: "", description: "", address: "", status: "pending" });
        setOtp("");
        setRequiresVerification(false);
      } else {
        throw new Error(data.message || "Verification failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification error.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (requiresVerification) {
    return (
      <section id="Contact Us" className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-6 max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Check Your Email</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              We sent a 6-digit OTP to <strong className="text-gray-700 dark:text-gray-300">{formData.email}</strong>
            </p>

            {error   && <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-sm">{success}</div>}

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center text-2xl font-bold tracking-[0.5em] py-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="000000"
                maxLength={6}
                required
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Verify OTP →"}
              </button>
              <button
                type="button"
                onClick={() => setRequiresVerification(false)}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ← Back to form
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="Contact Us" className="py-24 bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 dark:bg-blue-950/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-40" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 dark:text-blue-400 mb-4">
              <span className="w-8 h-px bg-blue-600 dark:bg-blue-400" />
              Support
              <span className="w-8 h-px bg-blue-600 dark:bg-blue-400" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Need Help? Open a Ticket
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Our support team will get back to you as soon as possible via email.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left info panel */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {[
                { icon: "⚡", title: "Fast Response", desc: "We typically respond within 2-4 hours during business hours." },
                { icon: "🔒", title: "Secure & Private", desc: "Your information is protected and never shared with third parties." },
                { icon: "🌍", title: "24/7 Coverage", desc: "Critical issues are handled around the clock by our on-call team." },
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex gap-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}

              {/* Contact info */}
              <div className="bg-blue-600 rounded-2xl p-6 text-white mt-2">
                <h4 className="font-bold mb-4">Direct Contact</h4>
                <div className="flex flex-col gap-3 text-sm">
                  <a href="tel:+250780000000" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                    <span>📞</span> +250 780 000 000
                  </a>
                  <a href="mailto:support@hyperlinknetwork.com" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                    <span>📧</span> support@hyperlinknetwork.com
                  </a>
                  <div className="flex items-center gap-2 text-blue-200">
                    <span>📍</span> Kigali, Rwanda
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
              {error   && <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm">{error}</div>}
              {success && <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl text-green-600 dark:text-green-400 text-sm">✅ {success}</div>}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Email *</label>
                    <input
                      type="email" name="email" value={formData.email} onChange={handleChange} required
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Category *</label>
                    <select
                      name="category" value={formData.category} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Issue Title *</label>
                  <input
                    type="text" name="issue" value={formData.issue} onChange={handleChange} required
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Description *</label>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange} required rows={4}
                    placeholder="Please provide as much detail as possible..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Address</label>
                  <input
                    type="text" name="address" value={formData.address} onChange={handleChange}
                    placeholder="Your location (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {submitting ? "Submitting..." : "Submit Support Ticket →"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}