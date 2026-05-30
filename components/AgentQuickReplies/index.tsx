"use client";

import { useState, useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;
const CACHE_KEY = "hyperlink_chat_cache";

// ─── Load cached Q&A from localStorage ───────────────────────────────────────
function getCachedEntries(): { question: string; answer: string }[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const cache: Record<string, { answer: string; expires: number }> = JSON.parse(raw);
    return Object.entries(cache)
      .filter(([, v]) => Date.now() < v.expires)
      .map(([question, v]) => ({ question, answer: v.answer }));
  } catch {
    return [];
  }
}

interface QuickReply {
  id: string;
  label: string;
  category: string;
  text: string;
  attachment_path?: string; // stored path relative to storage/app/public
  attachment_url?: string;  // full public URL
  attachment_name?: string;
  attachment_type?: "image" | "pdf";
}

interface Props {
  sessionId: string;
  agentId?: string;
  onSent: (message: string) => void;
}

const CATEGORIES = ["General", "Technical", "Billing", "Sales", "Other"];

const emptyForm = { label: "", category: "General", text: "" };
// Attachment for the form is tracked separately in state (not in emptyForm)

export default function AgentQuickReplies({ sessionId, agentId, onSent }: Props) {
  const [tab, setTab] = useState<"replies" | "cached" | "ai" | "manage">("replies");
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  // AI tab
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Manage tab
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [manageSearch, setManageSearch] = useState("");
  // Attachment for the manage form
  const formFileRef = useRef<HTMLInputElement>(null);
  const [formAttach, setFormAttach] = useState<{
    file: File; previewUrl: string; name: string; type: "image" | "pdf";
  } | null>(null);
  const [savedAttach, setSavedAttach] = useState<{
    url: string; name: string; type: "image" | "pdf";
  } | null>(null); // holds existing attachment when editing

  const getToken = () => localStorage.getItem("authToken") || "";

  // ── Attachment state ────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachPreview, setAttachPreview] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Load quick replies ──────────────────────────────────────────────
  const loadReplies = async () => {
    try {
      const res = await fetch(`${API}/chatbot/quick-replies`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setQuickReplies(data.quick_replies || []);
    } catch {}
  };

  useEffect(() => { loadReplies(); }, []);

  // ── Send message (optionally with a saved quick reply attachment) ────
  const sendMessage = async (text: string, reply?: QuickReply) => {
    setSending(text);
    try {
      // Send the text
      if (text.trim()) {
        const res = await fetch(`${API}/chatbot/agent-reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ session_id: sessionId, message: text, agent_id: agentId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(`Failed to send: ${err.message || res.statusText}`);
          return;
        }
      }

      // If this quick reply has a saved attachment, send it as a second message
      if (reply?.attachment_url && reply?.attachment_name && reply?.attachment_type) {
        const tag = `[${reply.attachment_type.toUpperCase()}: ${reply.attachment_name} | ${reply.attachment_url}]`;
        await fetch(`${API}/chatbot/agent-reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ session_id: sessionId, message: tag, agent_id: agentId }),
        });
      }

      onSent(text);
      setAiResult("");
      setAiPrompt("");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSending(null);
    }
  };

  // ── AI suggest ──────────────────────────────────────────────────────
  // ── File picker ─────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Only images (JPG, PNG, GIF, WebP) and PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5MB."); return; }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setAttachPreview({ file, previewUrl });
    e.target.value = "";
  };

  // ── Send attachment ──────────────────────────────────────────────────
  const handleSendAttachment = async () => {
    if (!attachPreview) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("sender", "agent");
      formData.append("file", attachPreview.file);

      const res = await fetch(`${API}/chatbot/upload-attachment`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Upload failed: ${err.message || res.statusText}`);
        return;
      }

      setAttachPreview(null);
      onSent(attachPreview.file.name);
    } catch {
      alert("Network error. Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Generate AI reply ───────────────────────────────────────────────
  const generateAiReply = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult("");
    try {
      const res = await fetch(`${API}/chatbot/agent-ai-suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ session_id: sessionId, context: aiPrompt }),
      });
      if (!res.ok) { setAiResult("AI suggestion failed. Try again."); return; }
      const data = await res.json();
      setAiResult(data.suggestion || "No suggestion generated.");
    } catch {
      setAiResult("Network error. Could not get AI suggestion.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Create / Update ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.label.trim() || !form.text.trim()) {
      setFormError("Label and reply text are required.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      // If a new attachment file was picked, upload it first
      let attachData: { url: string; name: string; type: string } | null = null;

      if (formAttach) {
        const fd = new FormData();
        fd.append("file", formAttach.file);

        const uploadRes = await fetch(`${API}/chatbot/upload-quick-reply-attachment`, {
          method: "POST",
          headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
          body: fd,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          setFormError(err.message || "Failed to upload attachment. Please try again.");
          return;
        }

        const uploadData = await uploadRes.json();
        attachData = { url: uploadData.url, name: uploadData.name, type: uploadData.type };
      } else if (savedAttach) {
        // Keep existing attachment
        attachData = savedAttach;
      }

      const url = editingId
        ? `${API}/chatbot/quick-replies/${editingId}`
        : `${API}/chatbot/quick-replies`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          attachment_url: attachData?.url || null,
          attachment_name: attachData?.name || null,
          attachment_type: attachData?.type || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.message || "Failed to save.");
        return;
      }

      await loadReplies();
      setForm(emptyForm);
      setEditingId(null);
      setFormAttach(null);
      setSavedAttach(null);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/chatbot/quick-replies/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });
      setDeleteConfirm(null);
      await loadReplies();
    } catch {
      alert("Failed to delete.");
    }
  };

  const startEdit = (r: QuickReply) => {
    setEditingId(r.id);
    setForm({ label: r.label, category: r.category, text: r.text });
    setFormAttach(null);
    setSavedAttach(r.attachment_url ? {
      url: r.attachment_url,
      name: r.attachment_name || "attachment",
      type: r.attachment_type || "image",
    } : null);
    setFormError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormAttach(null);
    setSavedAttach(null);
    setFormError("");
  };

  // ── Filtered lists ─────────────────────────────────────────────────
  const filteredReplies = quickReplies.filter(
    (r) =>
      !search ||
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.text.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredManage = quickReplies.filter(
    (r) =>
      !manageSearch ||
      r.label.toLowerCase().includes(manageSearch.toLowerCase()) ||
      r.category.toLowerCase().includes(manageSearch.toLowerCase())
  );

  const cachedEntries = getCachedEntries().filter(
    (e) =>
      !search ||
      e.question.toLowerCase().includes(search.toLowerCase()) ||
      e.answer.toLowerCase().includes(search.toLowerCase())
  );

  // ── Group replies by category ──────────────────────────────────────
  const grouped = filteredReplies.reduce<Record<string, QuickReply[]>>((acc, r) => {
    const cat = r.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px 4px", fontSize: 11, fontWeight: 600,
    border: "none", cursor: "pointer",
    borderBottom: active ? "2px solid #1e3a5f" : "2px solid transparent",
    background: "none", color: active ? "#1e3a5f" : "#94a3b8",
    transition: "all 0.15s", whiteSpace: "nowrap",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 13, outline: "none",
    boxSizing: "border-box", background: "#f8fafc",
  };

  const btnPrimary = (disabled?: boolean): React.CSSProperties => ({
    background: disabled ? "#e2e8f0" : "#0f172a",
    color: disabled ? "#94a3b8" : "#fff",
    border: "none", borderRadius: 8, padding: "8px 14px",
    fontSize: 12, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <div style={{
      border: "1.5px solid #e2e8f0", borderRadius: 14,
      background: "#fff", overflow: "hidden",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", height: "100%",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
        padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span>⚡ Quick Replies</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>
            {quickReplies.length} saved
          </span>
          {/* Attach file button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Send attachment to user"
            style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6, color: "#fff", padding: "4px 10px",
              fontSize: 12, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            📎 Attach
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Attachment preview bar */}
      {attachPreview && (
        <div style={{
          padding: "10px 12px", background: "#eff6ff",
          borderBottom: "1px solid #bfdbfe",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          {attachPreview.previewUrl ? (
            <img src={attachPreview.previewUrl} alt="preview"
              style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 6, background: "#dbeafe",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>📄</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e3a5f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {attachPreview.file.name}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {(attachPreview.file.size / 1024).toFixed(0)} KB
            </div>
          </div>
          <button
            onClick={handleSendAttachment}
            disabled={uploading}
            style={{
              background: uploading ? "#e2e8f0" : "#0f172a",
              color: uploading ? "#94a3b8" : "#fff",
              border: "none", borderRadius: 7, padding: "6px 12px",
              fontSize: 12, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", flexShrink: 0,
            }}
          >
            {uploading ? "Sending..." : "Send"}
          </button>
          <button
            onClick={() => setAttachPreview(null)}
            style={{
              background: "none", border: "none", fontSize: 16,
              color: "#94a3b8", cursor: "pointer", padding: 4, flexShrink: 0,
            }}
          >✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <button style={tabStyle(tab === "replies")} onClick={() => setTab("replies")}>Replies</button>
        <button style={tabStyle(tab === "cached")}  onClick={() => setTab("cached")}>Cache</button>
        <button style={tabStyle(tab === "ai")}      onClick={() => setTab("ai")}>AI</button>
        <button style={tabStyle(tab === "manage")}  onClick={() => setTab("manage")}>⚙ Manage</button>
      </div>

      {/* ── REPLIES TAB ── */}
      {tab === "replies" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Search */}
          <input
            style={inputStyle}
            placeholder="🔍 Search replies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredReplies.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
              {quickReplies.length === 0
                ? "No quick replies yet. Add some in the Manage tab."
                : "No replies match your search."}
            </div>
          ) : (
            Object.entries(grouped).map(([category, replies]) => (
              <div key={category}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  padding: "4px 0 6px",
                }}>
                  {category}
                </div>
                {replies.map((r) => (
                  <div key={r.id} style={{
                    border: "1px solid #e2e8f0", borderRadius: 10,
                    padding: "10px 12px", marginBottom: 6,
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                        {r.label}
                        {r.attachment_url && (
                          <span style={{
                            fontSize: 10, padding: "1px 6px", borderRadius: 10,
                            background: "#eff6ff", color: "#1e3a5f",
                            border: "1px solid #bfdbfe",
                          }}>
                            📎 {r.attachment_type === "image" ? "Image" : "PDF"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                        {r.text.length > 100 ? r.text.slice(0, 100) + "..." : r.text}
                      </div>
                      {r.attachment_url && r.attachment_type === "image" && (
                        <img src={r.attachment_url} alt={r.attachment_name}
                          style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4, marginTop: 6, border: "1px solid #e2e8f0" }} />
                      )}
                      {r.attachment_url && r.attachment_type === "pdf" && (
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>📄 {r.attachment_name}</div>
                      )}
                    </div>
                    <button
                      onClick={() => sendMessage(r.text, r)}
                      disabled={sending === r.text}
                      style={btnPrimary(sending === r.text)}
                    >
                      {sending === r.text ? "..." : "Send"}
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CACHE TAB ── */}
      {tab === "cached" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            style={inputStyle}
            placeholder="🔍 Search cached answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {cachedEntries.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
              No cached answers yet. They appear here after users ask questions.
            </div>
          ) : (
            cachedEntries.map((e, i) => (
              <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", marginBottom: 3 }}>
                  Q: {e.question}
                </div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4, marginBottom: 8 }}>
                  {e.answer.slice(0, 120)}{e.answer.length > 120 ? "..." : ""}
                </div>
                <button
                  onClick={() => sendMessage(e.answer)}
                  disabled={sending === e.answer}
                  style={btnPrimary(sending === e.answer)}
                >
                  {sending === e.answer ? "Sending..." : "Send this answer"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── AI TAB ── */}
      {tab === "ai" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Describe the situation and AI will draft a reply for you.
          </div>
          <textarea
            placeholder="e.g. Customer has slow internet on all devices, lives in Kigali, already restarted router..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }}
          />
          <button
            onClick={generateAiReply}
            disabled={aiLoading || !aiPrompt.trim()}
            style={{
              ...btnPrimary(aiLoading || !aiPrompt.trim()),
              background: aiLoading || !aiPrompt.trim()
                ? "#e2e8f0"
                : "linear-gradient(135deg, #3b82f6, #1e3a5f)",
              padding: "10px",
            }}
          >
            {aiLoading ? "Generating..." : "✨ Generate Reply"}
          </button>

          {aiResult && (
            <div style={{
              border: "1.5px solid #bfdbfe", borderRadius: 10,
              padding: 12, background: "#eff6ff",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a5f", marginBottom: 6 }}>
                AI SUGGESTED REPLY
              </div>
              <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5, marginBottom: 10 }}>
                {aiResult}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => sendMessage(aiResult)}
                  disabled={sending === aiResult}
                  style={{ ...btnPrimary(sending === aiResult), flex: 1, padding: "8px" }}
                >
                  {sending === aiResult ? "Sending..." : "Send →"}
                </button>
                <button
                  onClick={() => { setAiResult(""); setAiPrompt(""); }}
                  style={{
                    padding: "8px 14px", borderRadius: 8, background: "none",
                    border: "1.5px solid #e2e8f0", fontSize: 12, color: "#64748b", cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE TAB ── */}
      {tab === "manage" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Form — add or edit */}
          <div style={{
            border: `1.5px solid ${editingId ? "#bfdbfe" : "#e2e8f0"}`,
            borderRadius: 12, padding: 12,
            background: editingId ? "#eff6ff" : "#f8fafc",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: editingId ? "#1e3a5f" : "#374151", marginBottom: 8 }}>
              {editingId ? "✏️ Editing reply" : "➕ Add new reply"}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Label</label>
                <input
                  style={{ ...inputStyle, marginTop: 3 }}
                  placeholder="e.g. Restart router"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div style={{ width: 110 }}>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, marginTop: 3 }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Reply text</label>
            <textarea
              rows={3}
              placeholder="Type the full reply text the agent will send to the user..."
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              style={{ ...inputStyle, marginTop: 3, resize: "none", fontFamily: "inherit" }}
            />

            {/* Attachment field */}
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                Attachment <span style={{ fontWeight: 400 }}>(optional — image or PDF)</span>
              </label>

              {/* Show existing saved attachment */}
              {savedAttach && !formAttach && (
                <div style={{
                  marginTop: 6, padding: "8px 10px", borderRadius: 8,
                  background: "#f1f5f9", border: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {savedAttach.type === "image" ? (
                    <img src={savedAttach.url} alt={savedAttach.name}
                      style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                  ) : (
                    <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {savedAttach.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>Existing attachment</div>
                  </div>
                  <button
                    onClick={() => setSavedAttach(null)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 2 }}
                    title="Remove attachment"
                  >✕</button>
                </div>
              )}

              {/* Show new file preview */}
              {formAttach && (
                <div style={{
                  marginTop: 6, padding: "8px 10px", borderRadius: 8,
                  background: "#eff6ff", border: "1px solid #bfdbfe",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {formAttach.type === "image" ? (
                    <img src={formAttach.previewUrl} alt={formAttach.name}
                      style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                  ) : (
                    <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1e3a5f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {formAttach.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      {(formAttach.file.size / 1024).toFixed(0)} KB — will upload on save
                    </div>
                  </div>
                  <button
                    onClick={() => setFormAttach(null)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 2 }}
                    title="Remove"
                  >✕</button>
                </div>
              )}

              {/* Pick file button */}
              {!formAttach && (
                <button
                  onClick={() => formFileRef.current?.click()}
                  style={{
                    marginTop: 6, width: "100%", padding: "7px",
                    border: "1.5px dashed #cbd5e1", borderRadius: 8,
                    background: "none", fontSize: 12, color: "#64748b",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                  }}
                >
                  📎 Click to attach image or PDF
                </button>
              )}
              <input
                ref={formFileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
                  const type = file.type.startsWith("image/") ? "image" : "pdf";
                  const previewUrl = type === "image" ? URL.createObjectURL(file) : "";
                  setFormAttach({ file, previewUrl, name: file.name, type });
                  setSavedAttach(null);
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
            </div>

            {formError && (
              <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{formError}</div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...btnPrimary(saving), flex: 1 }}
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Add reply"}
              </button>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: "8px 14px", borderRadius: 8, background: "none",
                    border: "1.5px solid #e2e8f0", fontSize: 12, color: "#64748b", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Search manage list */}
          <input
            style={inputStyle}
            placeholder="🔍 Search saved replies..."
            value={manageSearch}
            onChange={(e) => setManageSearch(e.target.value)}
          />

          {/* Saved replies list */}
          {filteredManage.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
              {quickReplies.length === 0 ? "No replies yet." : "No results."}
            </div>
          ) : (
            filteredManage.map((r) => (
              <div key={r.id} style={{
                border: `1.5px solid ${editingId === r.id ? "#bfdbfe" : "#e2e8f0"}`,
                borderRadius: 10, padding: "10px 12px",
                background: editingId === r.id ? "#eff6ff" : "#fff",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{r.label}</span>
                      <span style={{
                        fontSize: 10, padding: "1px 6px", borderRadius: 10,
                        background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
                      }}>
                        {r.category}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                      {r.text.length > 80 ? r.text.slice(0, 80) + "..." : r.text}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {deleteConfirm === r.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{
                            background: "#ef4444", color: "#fff", border: "none",
                            borderRadius: 6, padding: "5px 8px", fontSize: 11,
                            fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            background: "none", border: "1px solid #e2e8f0",
                            borderRadius: 6, padding: "5px 8px", fontSize: 11,
                            color: "#64748b", cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(r)}
                          style={{
                            background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0",
                            borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(r.id)}
                          style={{
                            background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca",
                            borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}