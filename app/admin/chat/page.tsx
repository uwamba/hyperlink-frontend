"use client";

import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AgentQuickReplies from "@/components/AgentQuickReplies";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Session {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "waiting_agent" | "with_agent" | "closed";
  issue_category: string | null;
  is_verified_client: boolean;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

interface Message {
  id: string;
  session_id: string;
  sender: "user" | "bot" | "agent";
  message: string;
  created_at: string;
}

// ── Parse attachment tag from message text ────────────────────────────────────
function parseMessage(text: string): { type: "text" | "image" | "pdf"; url?: string; name?: string } {
  const match = text.match(/^\[(IMAGE|PDF):\s*(.+?)\s*\|\s*(https?:\/\/.+?)\]$/i);
  if (match) {
    return {
      type: match[1].toUpperCase() === "IMAGE" ? "image" : "pdf",
      name: match[2].trim(),
      url: match[3].trim(),
    };
  }
  return { type: "text" };
}

const STATUS_COLORS: Record<string, string> = {
  waiting_agent: "bg-orange-100 text-orange-700 border-orange-200",
  with_agent:    "bg-blue-100 text-blue-700 border-blue-200",
  active:        "bg-green-100 text-green-700 border-green-200",
  closed:        "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  waiting_agent: "⏳ Waiting Agent",
  with_agent:    "👤 With Agent",
  active:        "🟢 Active",
  closed:        "⛔ Closed",
};

// ── Attachment display ────────────────────────────────────────────────────────
function MessageAttachment({ msg }: { msg: Message }) {
  const parsed = parseMessage(msg.message);

  const dlBtn = parsed.url ? (
    <a
      href={parsed.url}
      download={parsed.name}
      className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-md no-underline bg-white/20 hover:bg-white/30 transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      ⬇ Download
    </a>
  ) : null;

  if (parsed.type === "image" && parsed.url) {
    return (
      <div>
        <a href={parsed.url} target="_blank" rel="noopener noreferrer">
          <img
            src={parsed.url}
            alt={parsed.name || "attachment"}
            className="max-w-[240px] max-h-[200px] rounded-lg border border-white/20 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
        <div className="text-xs mt-1 opacity-60">📎 {parsed.name}</div>
        {dlBtn}
      </div>
    );
  }

  if (parsed.type === "pdf" && parsed.url) {
    return (
      <div>
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 no-underline hover:bg-white/20 transition-colors"
        >
          <span className="text-xl">📄</span>
          <div>
            <div className="text-xs font-semibold">{parsed.name}</div>
            <div className="text-xs opacity-60">PDF • Click to open</div>
          </div>
        </a>
        {dlBtn}
      </div>
    );
  }

  return <span>{msg.message}</span>;
}

export default function ChatDashboard() {
  const [sessions, setSessions]               = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [agentInput, setAgentInput]           = useState("");
  const [sending, setSending]                 = useState(false);
  const [uploading, setUploading]             = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [filter, setFilter]                   = useState<string>("all");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [attachPreview, setAttachPreview]     = useState<{ file: File; previewUrl: string } | null>(null);
  const [cleaning, setCleaning]               = useState(false);
  const [cleanupResult, setCleanupResult]     = useState<{ deleted: number; kept: number; protected: number } | null>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem("authToken") || "";

  // ── Cleanup old attachments ───────────────────────────────────────────────
  const handleCleanup = async () => {
    if (!confirm("Delete all chat attachments older than 30 days?")) return;
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch(`${API}/chatbot/cleanup-attachments`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setCleanupResult({ deleted: data.deleted, kept: data.kept, protected: data.protected ?? 0 });
      // Auto-hide result after 6 seconds
      setTimeout(() => setCleanupResult(null), 6000);
    } catch {
      alert("Cleanup failed. Please try again.");
    } finally {
      setCleaning(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API}/chatbot/sessions`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch { console.error("Failed to fetch sessions"); }
    finally { setLoadingSessions(false); }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`${API}/chatbot/history/${sessionId}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch { console.error("Failed to fetch messages"); }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    fetchMessages(selectedSession.id);
    const interval = setInterval(() => fetchMessages(selectedSession.id), 3000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Send text ─────────────────────────────────────────────────────────────
  const sendAgentMessage = async (textOverride?: string) => {
    const text = (textOverride ?? agentInput).trim();
    if (!text || !selectedSession || sending) return;
    setSending(true);
    try {
      await fetch(`${API}/chatbot/agent-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ session_id: selectedSession.id, message: text }),
      });
      setAgentInput("");
      fetchMessages(selectedSession.id);
      fetchSessions();
    } catch { alert("Failed to send message."); }
    finally { setSending(false); }
  };

  // ── File picker ───────────────────────────────────────────────────────────
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

  // ── Send attachment ───────────────────────────────────────────────────────
  const handleSendAttachment = async () => {
    if (!attachPreview || !selectedSession) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("session_id", selectedSession.id);
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
      fetchMessages(selectedSession.id);
      fetchSessions();
    } catch { alert("Upload failed. Please try again."); }
    finally { setUploading(false); }
  };

  const handleQuickSent = (_message: string) => {
    if (selectedSession) { fetchMessages(selectedSession.id); fetchSessions(); }
  };

  const closeSession = async () => {
    if (!selectedSession || !confirm("Close this chat session?")) return;
    await fetch(`${API}/chatbot/sessions/${selectedSession.id}/close`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
    });
    fetchSessions();
    fetchMessages(selectedSession.id);
    setSelectedSession((prev) => prev ? { ...prev, status: "closed" } : null);
  };

  const filtered     = sessions.filter((s) => filter === "all" ? true : s.status === filter);
  const waitingCount = sessions.filter((s) => s.status === "waiting_agent").length;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] bg-gray-50 overflow-hidden -m-6">

        {/* ── LEFT: Session List ─────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold text-gray-900">💬 Chat Sessions</h1>
              {waitingCount > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {waitingCount} waiting
                </span>
              )}
            </div>
            <div className="flex gap-1 mt-3 flex-wrap">
              {["all","waiting_agent","with_agent","active","closed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                    filter === f
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {f === "all" ? "All" : f === "waiting_agent" ? "Waiting" : f === "with_agent" ? "With Agent" : f === "active" ? "Active" : "Closed"}
                </button>
              ))}
            </div>

            {/* Cleanup attachments */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cleaning ? (
                  <>
                    <span className="animate-spin">⏳</span> Cleaning up...
                  </>
                ) : (
                  <>🗑️ Clean up old attachments (30+ days)</>
                )}
              </button>

              {/* Result banner */}
              {cleanupResult && (
                <div className="mt-2 text-xs rounded-lg px-3 py-2 bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
                  <span>✅</span>
                  <span>
                    <strong>{cleanupResult.deleted}</strong> deleted,{" "}
                    <strong>{cleanupResult.kept}</strong> kept
                    {cleanupResult.protected > 0 && (
                      <> · <strong>{cleanupResult.protected}</strong> quick reply attachment{cleanupResult.protected !== 1 ? "s" : ""} protected</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingSessions ? (
              <div className="p-4 text-sm text-gray-400 text-center">Loading sessions...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-gray-400">No sessions found.</p>
              </div>
            ) : (
              filtered.map((session) => (
                <button
                  key={session.id}
                  onClick={() => { setSelectedSession(session); setShowQuickReplies(false); setAttachPreview(null); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedSession?.id === session.id ? "bg-blue-50 border-l-4 border-l-gray-800" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {session.is_verified_client ? "✅ " : "👤 "}{session.name}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ml-1 ${STATUS_COLORS[session.status]}`}>
                      {session.status === "waiting_agent" ? "Waiting" : session.status === "with_agent" ? "Agent" : session.status === "active" ? "Active" : "Closed"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{session.email}</p>
                  {session.issue_category && <p className="text-xs text-gray-400 truncate mt-0.5">📌 {session.issue_category}</p>}
                  {session.last_message && <p className="text-xs text-gray-400 truncate mt-0.5 italic">"{session.last_message}"</p>}
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(session.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat Window ─────────────────────────────────── */}
        {selectedSession ? (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Chat header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {selectedSession.is_verified_client ? "✅" : "👤"}
                  {selectedSession.name}
                  <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[selectedSession.status]}`}>
                    {STATUS_LABELS[selectedSession.status]}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedSession.email} · {selectedSession.phone}
                  {selectedSession.issue_category && <span className="ml-2">📌 {selectedSession.issue_category}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedSession.status !== "closed" && (
                  <button
                    onClick={() => setShowQuickReplies((v) => !v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                      showQuickReplies ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    ⚡ Quick Replies
                  </button>
                )}
                {selectedSession.status !== "closed" && (
                  <button
                    onClick={closeSession}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    ⛔ Close Session
                  </button>
                )}
              </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex overflow-hidden">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm mt-10">No messages yet.</div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[70%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                        m.sender === "user"
                          ? "self-end bg-gray-800 text-white rounded-tr-sm"
                          : m.sender === "agent"
                          ? "self-end bg-blue-600 text-white rounded-tr-sm"
                          : "self-start bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                      }`}
                    >
                      <span className="text-xs opacity-60 block mb-1">
                        {m.sender === "user" ? "👤 User" : m.sender === "agent" ? "🧑‍💼 You (Agent)" : "🤖 Bot"}
                        {" · "}
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <MessageAttachment msg={m} />
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick Replies panel */}
              {showQuickReplies && selectedSession.status !== "closed" && (
                <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-3">
                  <AgentQuickReplies
                    sessionId={selectedSession.id}
                    onSent={handleQuickSent}
                  />
                </div>
              )}
            </div>

            {/* Attachment preview bar */}
            {attachPreview && (
              <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
                {attachPreview.previewUrl ? (
                  <img src={attachPreview.previewUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">📄</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{attachPreview.file.name}</div>
                  <div className="text-xs text-gray-500">{(attachPreview.file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button
                  onClick={handleSendAttachment}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 font-medium flex-shrink-0"
                >
                  {uploading ? "Uploading..." : "Send file"}
                </button>
                <button
                  onClick={() => setAttachPreview(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg flex-shrink-0"
                >✕</button>
              </div>
            )}

            {/* Agent input */}
            {selectedSession.status !== "closed" ? (
              <div className="px-6 py-4 bg-white border-t border-gray-200">
                <div className="flex gap-2 items-center">
                  {/* Attach button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Attach image or PDF"
                    className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 text-lg flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    📎
                  </button>
                  <input
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAgentMessage()}
                    placeholder="Type your reply as agent..."
                    className="flex-1 text-sm bg-gray-100 text-gray-800 rounded-xl px-4 py-2.5 outline-none border border-transparent focus:border-gray-800"
                  />
                  <button
                    onClick={() => sendAgentMessage()}
                    disabled={sending}
                    className="px-5 py-2.5 bg-gray-800 text-white text-sm rounded-xl hover:opacity-90 disabled:opacity-50 font-medium flex-shrink-0"
                  >
                    {sending ? "Sending..." : "Send ➤"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Press Enter to send · 📎 attach images or PDFs ·{" "}
                  <button
                    onClick={() => setShowQuickReplies((v) => !v)}
                    className="text-gray-500 underline hover:text-gray-800"
                  >
                    ⚡ quick replies
                  </button>
                </p>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">⛔ This session is closed. No further messages can be sent.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 font-medium text-lg">Select a session to view the chat</p>
              <p className="text-gray-400 text-sm mt-1">
                {waitingCount > 0
                  ? `${waitingCount} session(s) waiting for an agent — check the orange badges`
                  : "No sessions waiting right now"}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}