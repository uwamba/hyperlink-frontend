"use client";

import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

const QUICK_ISSUES = [
  { label: "No internet / Connection down", icon: "🔌" },
  { label: "Slow internet speed", icon: "🐢" },
  { label: "Billing & Payment issue", icon: "💳" },
  { label: "New connection / Installation", icon: "🏠" },
  { label: "Router / Equipment problem", icon: "📡" },
  { label: "Service outage in my area", icon: "⚠️" },
  { label: "Other", icon: "💬" },
];

interface Message {
  role: "user" | "bot" | "agent";
  text: string;
}

interface Session {
  session_id: string;
  is_verified_client: boolean;
}

type Step = "closed" | "identity" | "chat";

export default function Chatbot() {
  const [step, setStep] = useState<Step>("closed");

  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("chatbot_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentRequested, setAgentRequested] = useState(false);
  const [agentJoined, setAgentJoined] = useState(false);
  const [showIssues, setShowIssues] = useState(true);

  // Identity form
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Poll for new messages every 3s (catches agent replies)
  useEffect(() => {
    if (!session) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API}/chatbot/history/${session.session_id}`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          const mapped: Message[] = data.messages.map((m: any) => ({
            role: m.sender as "user" | "bot" | "agent",
            text: m.message,
          }));
          setMessages(mapped);

          // Detect if agent has joined
          const hasAgent = data.messages.some((m: any) => m.sender === "agent");
          if (hasAgent) {
            setAgentJoined(true);
            setAgentRequested(true);
          }

          // Hide quick issues if there are already messages beyond welcome
          if (data.messages.length > 1) {
            setShowIssues(false);
          }
        }
      } catch {
        console.error("Failed to poll messages");
      }
    };

    poll(); // immediate first call
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [session]);

  // ── Start session ─────────────────────────────────────────────────
  const handleStartSession = async () => {
    if (!form.name || !form.email || !form.phone) {
      setFormError("All fields are required.");
      return;
    }
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch(`${API}/chatbot/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || "Failed to start session.");
        return;
      }

      const newSession: Session = {
        session_id: data.session_id,
        is_verified_client: data.is_verified_client,
      };

      setSession(newSession);
      localStorage.setItem("chatbot_session", JSON.stringify(newSession));
      setShowIssues(true);
      setStep("chat");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Select quick issue ────────────────────────────────────────────
  const handleSelectIssue = async (issue: string) => {
    if (!session) return;
    setShowIssues(false);
    setLoading(true);

    try {
      await fetch(`${API}/chatbot/select-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ session_id: session.session_id, issue }),
      });
      // polling picks up new messages automatically
    } catch {
      console.error("Failed to select issue");
    } finally {
      setLoading(false);
    }
  };

  // ── Send free-text message ────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !session) return;

    setInput("");
    setLoading(true);
    setShowIssues(false);

    try {
      await fetch(`${API}/chatbot/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ session_id: session.session_id, message: text }),
      });
      // polling picks up new messages automatically
    } catch {
      console.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // ── Request agent ─────────────────────────────────────────────────
  const handleRequestAgent = async () => {
    if (!session || agentRequested) return;
    setLoading(true);

    try {
      await fetch(`${API}/chatbot/request-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ session_id: session.session_id }),
      });
      setAgentRequested(true);
    } catch {
      console.error("Failed to request agent");
    } finally {
      setLoading(false);
    }
  };

  // ── End session (clear localStorage) ─────────────────────────────
  const handleEndSession = () => {
    localStorage.removeItem("chatbot_session");
    setSession(null);
    setMessages([]);
    setAgentRequested(false);
    setAgentJoined(false);
    setShowIssues(true);
    setForm({ name: "", email: "", phone: "" });
    setStep("identity");
  };

  // ── Open / close bubble ───────────────────────────────────────────
  const handleOpen = () => {
    if (step === "closed") {
      // If session exists go straight to chat, else show identity form
      setStep(session ? "chat" : "identity");
    } else {
      setStep("closed");
    }
  };

  return (
    <>
      {/* ── Chat Window ─────────────────────────────────────────── */}
      {step !== "closed" && (
        <div className="fixed bottom-20 right-5 z-50 w-[340px] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col bg-white dark:bg-gray-900">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a2e]">
            <div className="w-8 h-8 rounded-full bg-[#3b3b6e] flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <p className="text-white text-sm font-medium leading-tight">
                Hyperlink Support
              </p>
              <p className="text-[#7c8db5] text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                {agentJoined ? "Agent online" : "Online"}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* End session button — only show in chat step */}
              {step === "chat" && (
                <button
                  onClick={handleEndSession}
                  title="End session and start over"
                  className="text-[10px] text-gray-400 hover:text-red-400 transition-colors border border-gray-600 hover:border-red-400 rounded px-1.5 py-0.5"
                >
                  End
                </button>
              )}
              <button
                onClick={() => setStep("closed")}
                className="text-gray-400 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── IDENTITY FORM ──────────────────────────────────────── */}
          {step === "identity" && (
            <div className="p-4 flex flex-col gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Please introduce yourself to get started 👋
              </p>

              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleStartSession()}
                className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[#1a1a2e]"
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleStartSession()}
                className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[#1a1a2e]"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleStartSession()}
                className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[#1a1a2e]"
              />

              {formError && (
                <p className="text-red-500 text-xs">{formError}</p>
              )}

              <button
                onClick={handleStartSession}
                disabled={formLoading}
                className="bg-[#1a1a2e] text-white text-sm rounded-lg py-2 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {formLoading ? "Starting..." : "Start Chat →"}
              </button>
            </div>
          )}

          {/* ── CHAT ───────────────────────────────────────────────── */}
          {step === "chat" && (
            <>
              {/* Verified client badge */}
              {session?.is_verified_client && (
                <div className="px-4 py-1.5 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-400">
                    ✅ Verified Hyperlink client
                  </p>
                </div>
              )}

              {/* Agent joined banner */}
              {agentJoined && (
                <div className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    🧑‍💼 A support agent has joined the chat
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="flex flex-col gap-2 p-3 h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed rounded-xl whitespace-pre-line ${m.role === "user"
                        ? "self-end bg-[#1a1a2e] text-[#e8eaf6] rounded-tr-sm"
                        : m.role === "agent"
                          ? "self-start bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 rounded-tl-sm"
                          : "self-start bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-sm"
                      }`}
                  >
                    {m.role === "agent" && (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-300 block mb-1">
                        🧑‍💼 Support Agent
                      </span>
                    )}
                    {m.role === "bot" && (
                      <span className="text-xs font-bold text-gray-400 block mb-1">
                        🤖 Hyperlink Bot
                      </span>
                    )}
                    {m.text}
                  </div>
                ))}

                {/* Loading dots */}
                {loading && (
                  <div className="self-start bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-xl rounded-tl-sm flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}

                {/* Quick issue buttons — only show at start */}
                {showIssues && !loading && messages.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Select your issue:
                    </p>
                    {QUICK_ISSUES.map((issue) => (
                      <button
                        key={issue.label}
                        onClick={() => handleSelectIssue(issue.label)}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-[#1a1a2e] hover:text-white hover:border-[#1a1a2e] transition-colors"
                      >
                        {issue.icon} {issue.label}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Talk to Agent button */}
              {!agentRequested && !agentJoined && (
                <div className="px-3 pt-2">
                  <button
                    onClick={handleRequestAgent}
                    className="w-full text-xs py-1.5 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  >
                    👤 Talk to a human agent
                  </button>
                </div>
              )}

              {agentRequested && !agentJoined && (
                <div className="px-3 pt-2">
                  <p className="text-xs text-center text-orange-500 py-1.5 animate-pulse">
                    ⏳ Waiting for an agent to join...
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={agentJoined ? "Reply to agent..." : "Type a message…"}
                  className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-[#1a1a2e]"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="w-8 h-8 rounded-lg bg-[#1a1a2e] text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {/* ── Floating Bubble ──────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Label tooltip — only when closed */}
        {step === "closed" && (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg animate-bounce">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
              Chat with us!
            </span>
          </div>
        )}

        <button
          onClick={handleOpen}
          className="relative w-[64px] h-[64px] rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 text-2xl"
          aria-label="Open chat"
        >
          {step !== "closed" ? "✕" : "💬"}

          {/* Ping ring — only when closed */}
          {step === "closed" && (
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
          )}
        </button>
      </div>
    </>
  );
}