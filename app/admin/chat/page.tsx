"use client";

import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

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

export default function ChatDashboard() {
  const [sessions, setSessions]               = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [agentInput, setAgentInput]           = useState("");
  const [sending, setSending]                 = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [filter, setFilter]                   = useState<string>("all");
  const bottomRef                             = useRef<HTMLDivElement>(null);

  const getToken = () => localStorage.getItem("authToken") || "";

  // ── Fetch all sessions ────────────────────────────────────────────
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API}/chatbot/sessions`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      console.error("Failed to fetch sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  // ── Fetch messages for selected session ───────────────────────────
  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`${API}/chatbot/history/${sessionId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      console.error("Failed to fetch messages");
    }
  };

  // Poll sessions every 5s
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll messages every 3s when a session is selected
  useEffect(() => {
    if (!selectedSession) return;
    fetchMessages(selectedSession.id);
    const interval = setInterval(() => fetchMessages(selectedSession.id), 3000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Agent sends a message ─────────────────────────────────────────
  const sendAgentMessage = async () => {
    const text = agentInput.trim();
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
        body: JSON.stringify({
          session_id: selectedSession.id,
          message: text,
        }),
      });
      setAgentInput("");
      fetchMessages(selectedSession.id);
      fetchSessions();
    } catch {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // ── Close session ─────────────────────────────────────────────────
  const closeSession = async () => {
    if (!selectedSession) return;
    if (!confirm("Close this chat session?")) return;

    await fetch(`${API}/chatbot/sessions/${selectedSession.id}/close`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });

    fetchSessions();
    fetchMessages(selectedSession.id);
    setSelectedSession((prev) => prev ? { ...prev, status: "closed" } : null);
  };

  // ── Filter sessions ───────────────────────────────────────────────
  const filtered = sessions.filter((s) =>
    filter === "all" ? true : s.status === filter
  );

  const waitingCount = sessions.filter((s) => s.status === "waiting_agent").length;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] bg-gray-50 overflow-hidden -m-6">

        {/* ── LEFT: Session List ─────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">

          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold text-gray-900">
                💬 Chat Sessions
              </h1>
              {waitingCount > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {waitingCount} waiting
                </span>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mt-3 flex-wrap">
              {["all", "waiting_agent", "with_agent", "active", "closed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                    filter === f
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {f === "all" ? "All" :
                   f === "waiting_agent" ? "Waiting" :
                   f === "with_agent"    ? "With Agent" :
                   f === "active"        ? "Active" : "Closed"}
                </button>
              ))}
            </div>
          </div>

          {/* Session list */}
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
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedSession?.id === session.id
                      ? "bg-blue-50 border-l-4 border-l-gray-800"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {session.is_verified_client ? "✅ " : "👤 "}
                      {session.name}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ml-1 ${STATUS_COLORS[session.status]}`}>
                      {session.status === "waiting_agent" ? "Waiting" :
                       session.status === "with_agent"    ? "Agent"   :
                       session.status === "active"        ? "Active"  : "Closed"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{session.email}</p>
                  {session.issue_category && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      📌 {session.issue_category}
                    </p>
                  )}
                  {session.last_message && (
                    <p className="text-xs text-gray-400 truncate mt-0.5 italic">
                      "{session.last_message}"
                    </p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(session.created_at).toLocaleString([], {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
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
                  {selectedSession.issue_category && (
                    <span className="ml-2">📌 {selectedSession.issue_category}</span>
                  )}
                </p>
              </div>

              {selectedSession.status !== "closed" && (
                <button
                  onClick={closeSession}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  ⛔ Close Session
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">No messages yet.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[70%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                      m.sender === "user"
                        ? "self-end bg-gray-800 text-white rounded-tr-sm"
                        : m.sender === "agent"
                        ? "self-end bg-blue-600 text-white rounded-tr-sm"
                        : "self-start bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                    }`}
                  >
                    <span className="text-xs opacity-60 block mb-1">
                      {m.sender === "user"  ? "👤 User"  :
                       m.sender === "agent" ? "🧑‍💼 You (Agent)" : "🤖 Bot"}
                      {" · "}
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                    {m.message}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Agent input */}
            {selectedSession.status !== "closed" ? (
              <div className="px-6 py-4 bg-white border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAgentMessage()}
                    placeholder="Type your reply as agent..."
                    className="flex-1 text-sm bg-gray-100 text-gray-800 rounded-xl px-4 py-2.5 outline-none border border-transparent focus:border-gray-800"
                  />
                  <button
                    onClick={sendAgentMessage}
                    disabled={sending}
                    className="px-5 py-2.5 bg-gray-800 text-white text-sm rounded-xl hover:opacity-90 disabled:opacity-50 font-medium"
                  >
                    {sending ? "Sending..." : "Send ➤"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Press Enter to send · Your reply appears as{" "}
                  <span className="text-blue-500 font-medium">Agent (blue)</span> to the user
                </p>
              </div>
            ) : (
              <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  ⛔ This session is closed. No further messages can be sent.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Empty state
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