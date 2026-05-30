"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;
const CACHE_KEY = "hyperlink_chat_cache";
const SESSION_KEY = "hyperlink_chat_session";
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────
function getCachedReply(question: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, { answer: string; expires: number }> = JSON.parse(raw);
    const key = question.toLowerCase().trim();
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      delete cache[key];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.answer;
  } catch { return null; }
}

function setCachedReply(question: string, answer: string) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, { answer: string; expires: number }> = raw ? JSON.parse(raw) : {};
    cache[question.toLowerCase().trim()] = {
      answer,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// ─── SESSION HELPERS ──────────────────────────────────────────────────────────
interface PersistedSession {
  session_id: string;
  is_verified_client: boolean;
  name: string; email: string; phone: string;
  last_activity: number;
}
function saveSession(data: PersistedSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}
function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: PersistedSession = JSON.parse(raw);
    if (Date.now() - data.last_activity > SESSION_TIMEOUT_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch {} }
function touchSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.last_activity = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

// ─── MENU DATA ────────────────────────────────────────────────────────────────
const MAIN_MENU = [
  {
    id: "no_internet", icon: "📵", title: "I can't connect\nto the internet",
    color: "#EF4444", bg: "#FEF2F2", border: "#FECACA",
    subOptions: ["It was working before, now it stopped","Never connected on this device","All devices affected","Only one device not connecting","Internet keeps disconnecting"],
    responses: {
      "It was working before, now it stopped": "Try restarting your Starlink router — unplug it for 30 seconds then plug back in. Also check if the Starlink dish has a clear view of the sky (no obstructions). If it still doesn't work after 2 minutes, please try again or talk to an agent.",
      "Never connected on this device": "Make sure WiFi is turned on and you're selecting the correct network (usually named 'STARLINK' or your custom network name). Check the WiFi password — it's on the sticker under your router. If you still can't connect, our team can help remotely.",
      "All devices affected": "This usually means the router itself lost connection. Restart it by unplugging for 30 seconds. Check if the Starlink app shows any outage in your area. If the problem persists after 5 minutes, please talk to an agent.",
      "Only one device not connecting": "The issue is likely with that specific device, not your internet. Try: turning WiFi off and on, forgetting the network and reconnecting, or restarting the device. If other devices work fine, your internet is fine!",
      "Internet keeps disconnecting": "Intermittent disconnections on Starlink can be caused by dish obstructions (trees, buildings), adverse weather, or router placement. Check the Starlink app for obstruction alerts. If it happens more than 5 times a day, please report it to our technical team.",
    },
  },
  {
    id: "slow_speed", icon: "🐢", title: "My internet is\nvery slow",
    color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A",
    subOptions: ["Slow on all devices","Slow only on one device","Slow during specific hours","Videos keep buffering","Slow upload speed"],
    responses: {
      "Slow on all devices": "Run a speed test at fast.com and note the result. If below 50 Mbps, try restarting the router. Too many connected devices can also slow things down — disconnect unused devices. If speed is consistently low, our team will check your dish alignment.",
      "Slow only on one device": "The issue is with that device, not your internet. Try: clearing the browser cache, closing background apps, or moving closer to the router. You can also run a speed test on both devices to compare.",
      "Slow during specific hours": "Peak hours (6 PM–10 PM) can see slightly reduced speeds due to network demand. This is normal for satellite internet. If speeds drop below 20 Mbps consistently, please report it so we can investigate your area.",
      "Videos keep buffering": "For HD streaming you need at least 25 Mbps. Try lowering video quality to 720p temporarily. Also close other apps using internet in the background. If buffering happens at lower quality too, run a speed test at fast.com and share with us.",
      "Slow upload speed": "Starlink upload speeds are typically 5–20 Mbps. If you're doing video calls or uploading large files, try scheduling uploads for off-peak hours (before 6 AM or after 10 PM). If upload is below 2 Mbps consistently, contact our team.",
    },
  },
  {
    id: "billing", icon: "💳", title: "Billing &\nPayment issue",
    color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE",
    subOptions: ["I was charged incorrectly","I can't make a payment","I need my invoice","My service was cut off","Change payment method"],
    responses: {
      "I was charged incorrectly": "Please email billing@hyperlinknetwork.com with your account email and the incorrect charge details. Our billing team reviews disputes within 24 hours. Please have your invoice number ready.",
      "I can't make a payment": "We accept Mobile Money (MTN MoMo, Airtel Money), bank transfer, and card. If MoMo payment fails, check your balance or try again after 10 minutes. For card issues, contact your bank. Need help? Call our billing line.",
      "I need my invoice": "Log into the client portal to download your invoice. Don't have access? Email billing@hyperlinknetwork.com with your account email and we'll send it within a few hours.",
      "My service was cut off": "Service is suspended when payment is more than 5 days overdue. Make your payment via MoMo or bank transfer — service is restored within 1 hour of payment confirmation. Need an extension? Contact our billing team.",
      "Change payment method": "To update your payment method, log into the client portal under Billing Settings, or email billing@hyperlinknetwork.com with your request. Changes take effect on your next billing cycle.",
    },
  },
  {
    id: "new_connection", icon: "🏠", title: "I want a new\nconnection",
    color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0",
    subOptions: ["Home connection","Business / Office connection","Check if my area is covered","How much does it cost?","How long does installation take?"],
    responses: {
      "Home connection": "Great choice! Fill our contact form or email sales@hyperlinknetwork.com with your name, phone, and location. Our team will survey your site and confirm coverage within 1 business day. Installation is done within 1–2 days after confirmation.",
      "Business / Office connection": "We offer business packages with dedicated support and higher speed tiers. Contact sales@hyperlinknetwork.com or call us directly. We'll schedule a site visit to assess your needs and propose the best plan.",
      "Check if my area is covered": "Hyperlink Network covers most of Rwanda via Starlink satellite — coverage is available almost everywhere. Send your location (district/sector) to sales@hyperlinknetwork.com and we'll confirm availability same day.",
      "How much does it cost?": "Our plans start from affordable monthly subscriptions. Pricing depends on your chosen speed tier and whether it's home or business. Contact sales@hyperlinknetwork.com for a full price list or visit our website.",
      "How long does installation take?": "After site survey approval, installation takes 1–2 business days. The actual installation visit takes about 2–3 hours. You'll be online the same day as installation!",
    },
  },
  {
    id: "router", icon: "📡", title: "Router or\nequipment issue",
    color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE",
    subOptions: ["Router lights are red","Router won't turn on","WiFi signal is weak","I need to change WiFi password","Router is damaged / broken"],
    responses: {
      "Router lights are red": "Red lights usually mean no internet signal reaching the router. First restart it (unplug 30 seconds). If red persists, check the cable from the Starlink dish to the router. If the cable looks fine, contact our technical team — it may be a dish alignment issue.",
      "Router won't turn on": "Check the power cable is firmly connected at both ends. Try a different power socket. If the router still won't turn on after trying another socket, it may be faulty. Contact us and we'll arrange a replacement — equipment is covered under warranty.",
      "WiFi signal is weak": "Place your router in a central, elevated location — away from walls, metal objects, and microwaves. Avoid placing it on the floor or inside cabinets. If your home is large, we can recommend a WiFi extender. Restart the router and test signal again.",
      "I need to change WiFi password": "Access your router settings by opening a browser and going to 192.168.1.1 (or check the sticker on your router for the admin address). Log in with admin credentials (usually on the sticker) and go to WiFi Settings. Need help? Our team can guide you remotely.",
      "Router is damaged / broken": "If your router is physically damaged, contact us immediately. Equipment covered under our warranty is replaced at no cost within the warranty period. Out-of-warranty replacements are available at a fee. Email support@hyperlinknetwork.com with photos of the damage.",
    },
  },
  {
    id: "outage", icon: "⚠️", title: "Service outage\nin my area",
    color: "#F97316", bg: "#FFF7ED", border: "#FED7AA",
    subOptions: ["No service since this morning","Intermittent outages","Report outage for my area","When will service be restored?"],
    responses: {
      "No service since this morning": "We apologize for the disruption. Our team monitors outages 24/7. Please restart your router first. If no improvement, send your location (district/sector) to support@hyperlinknetwork.com — we'll check if there's a known outage in your area.",
      "Intermittent outages": "Intermittent outages can be caused by weather, dish obstructions, or network maintenance. Check the Starlink app for alerts. If outages happen daily, please report to support@hyperlinknetwork.com with times and duration so our team can investigate.",
      "Report outage for my area": "Thank you for reporting! Please send your exact location (district, sector, and any landmarks) to support@hyperlinknetwork.com or WhatsApp our support line. We'll log it and dispatch a team if needed.",
      "When will service be restored?": "Restoration time depends on the cause. Weather-related outages typically resolve within 1–2 hours. Hardware issues may take longer. Follow our social media pages for live status updates, or contact our support team for your specific area's status.",
    },
  },
  {
    id: "other", icon: "💬", title: "Something\nelse",
    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB",
    subOptions: [], responses: {},
  },
];

// ─── BACK BUTTON ──────────────────────────────────────────────────────────────
function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "#f1f5f9", border: "1.5px solid #e2e8f0",
      borderRadius: 10, padding: "9px 14px", fontSize: 13,
      fontWeight: 600, color: "#1e3a5f", cursor: "pointer", width: "100%",
    }}>
      ← {label}
    </button>
  );
}

// ─── ATTACHMENT BUBBLE ────────────────────────────────────────────────────────
function AttachmentBubble({ url, name, type, isUser }: { url: string; name: string; type: string; isUser: boolean }) {
  const dlBtn = (
    <a
      href={url}
      download={name}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        marginTop: 6, fontSize: 11, fontWeight: 600,
        color: isUser ? "rgba(255,255,255,0.85)" : "#3b82f6",
        background: isUser ? "rgba(255,255,255,0.15)" : "#eff6ff",
        border: isUser ? "1px solid rgba(255,255,255,0.25)" : "1px solid #bfdbfe",
        borderRadius: 6, padding: "4px 10px", textDecoration: "none",
      }}
    >
      ⬇ Download
    </a>
  );

  if (type === "image") {
    return (
      <div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
          <img
            src={url} alt={name}
            style={{
              maxWidth: "100%", maxHeight: 200, borderRadius: 10,
              border: isUser ? "2px solid rgba(255,255,255,0.2)" : "2px solid #e2e8f0",
              display: "block", cursor: "pointer",
            }}
          />
        </a>
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>📎 {name}</div>
        {dlBtn}
      </div>
    );
  }

  return (
    <div>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{
        display: "flex", alignItems: "center", gap: 8,
        background: isUser ? "rgba(255,255,255,0.15)" : "#f1f5f9",
        borderRadius: 8, padding: "8px 12px", textDecoration: "none",
        border: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid #e2e8f0",
      }}>
        <span style={{ fontSize: 20 }}>📄</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: isUser ? "#fff" : "#374151" }}>{name}</div>
          <div style={{ fontSize: 11, color: isUser ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>PDF • Tap to open</div>
        </div>
      </a>
      {dlBtn}
    </div>
  );
}
// ─── PARSE ATTACHMENT TAG FROM MESSAGE TEXT ───────────────────────────────────
function parseMessage(text: string): { type: "text" | "image" | "pdf"; url?: string; name?: string; plain: string } {
  const match = text.match(/^\[(IMAGE|PDF):\s*(.+?)\s*\|\s*(https?:\/\/.+?)\]$/i);
  if (match) {
    const kind = match[1].toUpperCase() === "IMAGE" ? "image" : "pdf";
    return { type: kind, name: match[2].trim(), url: match[3].trim(), plain: text };
  }
  return { type: "text", plain: text };
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "bot" | "agent";
  text: string;
  type?: "text" | "image" | "pdf";
  attachment_url?: string;
  attachment_name?: string;
}
interface Session { session_id: string; is_verified_client: boolean; }
type Step = "closed" | "identity" | "menu" | "submenu" | "chat";

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Chatbot() {
  const [step, setStep]                     = useState<Step>("closed");
  const [session, setSession]               = useState<Session | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [input, setInput]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [agentRequested, setAgentRequested] = useState(false);
  const [agentJoined, setAgentJoined]       = useState(false);
  const [selectedIssue, setSelectedIssue]   = useState<(typeof MAIN_MENU)[0] | null>(null);
  const [form, setForm]                     = useState({ name: "", email: "", phone: "" });
  const [formError, setFormError]           = useState("");
  const [formLoading, setFormLoading]       = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [attachPreview, setAttachPreview]   = useState<{ file: File; previewUrl: string } | null>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, step]);

  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (!session) return;
    touchSession();
    inactivityTimer.current = setTimeout(() => {
      clearSession();
      setSession(null); setMessages([]); setStep("identity");
      setAgentRequested(false); setAgentJoined(false);
      setSelectedIssue(null); setForm({ name: "", email: "", phone: "" });
      setSessionExpired(true);
    }, SESSION_TIMEOUT_MS);
  }, [session]);

  useEffect(() => {
    if (session) resetTimer();
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [session, resetTimer]);

  useEffect(() => {
    const persisted = loadSession();
    if (persisted) {
      setSession({ session_id: persisted.session_id, is_verified_client: persisted.is_verified_client });
      setForm({ name: persisted.name, email: persisted.email, phone: persisted.phone });
    }
  }, []);

  // Poll for agent replies
  useEffect(() => {
    if (!session || !agentRequested) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API}/chatbot/history/${session.session_id}`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (!data.messages) return;
        const agentMsgs = data.messages.filter((m: { sender: string }) => m.sender === "agent");
        if (agentMsgs.length > 0) setAgentJoined(true);
        const mapped: Message[] = data.messages.map((m: {
          sender: string; message: string;
        }) => {
          const parsed = parseMessage(m.message);
          return {
            role: m.sender as "user" | "bot" | "agent",
            text: m.message,
            type: parsed.type,
            attachment_url: parsed.url,
            attachment_name: parsed.name,
          };
        });
        setMessages(mapped);
      } catch {}
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [session, agentRequested]);

  const addMessage = (role: Message["role"], text: string, extra?: Partial<Message>) => {
    setMessages((prev) => [...prev, { role, text, type: "text", ...extra }]);
    resetTimer();
  };

  // ── Identity ──────────────────────────────────────────────────────────────
  const handleStartSession = async () => {
    if (!form.name || !form.email || !form.phone) { setFormError("All fields are required."); return; }
    setFormError(""); setFormLoading(true);
    try {
      const res = await fetch(`${API}/chatbot/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || "Failed to start session."); return; }

      const newSession = { session_id: data.session_id, is_verified_client: data.is_verified_client };
      setSession(newSession);
      setSessionExpired(false);
      saveSession({ ...newSession, ...form, last_activity: Date.now() });

      if (data.resumed) {
        // Existing active session — load full history
        try {
          const histRes = await fetch(`${API}/chatbot/history/${data.session_id}`, {
            headers: { Accept: "application/json" },
          });
          const histData = await histRes.json();
          if (histData.messages?.length > 0) {
            const mapped = histData.messages.map((m: { sender: string; message: string }) => {
              const parsed = parseMessage(m.message);
              return {
                role: m.sender as "user" | "bot" | "agent",
                text: m.message,
                type: parsed.type,
                attachment_url: parsed.url,
                attachment_name: parsed.name,
              };
            });
            setMessages(mapped);
            // Check if agent was involved
            const hadAgent = histData.messages.some((m: { sender: string }) => m.sender === "agent");
            if (hadAgent) { setAgentRequested(true); setAgentJoined(true); }
          }
        } catch {}
        setStep("chat");
      } else {
        // New session — go to menu
        setStep("menu");
      }
    } catch { setFormError("Network error. Please try again."); }
    finally { setFormLoading(false); }
  };

  // ── Select issue ──────────────────────────────────────────────────────────
  const handleSelectIssue = (issue: (typeof MAIN_MENU)[0]) => {
    resetTimer();
    if (issue.id === "other") {
      addMessage("bot", "No problem! Please type your question below and I'll do my best to help you.");
      setStep("chat"); return;
    }
    setSelectedIssue(issue); setStep("submenu");
  };

  const handleSelectSubOption = async (option: string) => {
    if (!session || !selectedIssue) return;
    resetTimer(); addMessage("user", option);
    const structured = selectedIssue.responses[option as keyof typeof selectedIssue.responses];
    if (structured) {
      await fetch(`${API}/chatbot/select-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ session_id: session.session_id, issue: option }),
      });
      addMessage("bot", structured);
      addMessage("bot", "Did this solve your issue? If not, feel free to describe your problem and I'll keep helping! 👇");
      setStep("chat");
    }
  };

  // ── Send text message ─────────────────────────────────────────────────────
  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || !session) return;
    setInput(""); addMessage("user", msg); resetTimer();

    if (agentJoined) {
      try {
        await fetch(`${API}/chatbot/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ session_id: session.session_id, message: msg }),
        });
      } catch {}
      return;
    }

    setLoading(true);
    try {
      const cached = getCachedReply(msg);
      if (cached) { addMessage("bot", cached + "\n\n_(answered from cache)_"); return; }
      const res = await fetch(`${API}/chatbot/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ session_id: session.session_id, message: msg }),
      });
      const data = await res.json();
      if (data.status === "agent_handling") return;
      if (data.reply) { setCachedReply(msg, data.reply); addMessage("bot", data.reply); }
    } catch { addMessage("bot", "Network error. Please try again."); }
    finally { setLoading(false); }
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
    if (file.size > 5 * 1024 * 1024) { alert("File size must be under 5MB."); return; }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setAttachPreview({ file, previewUrl });
    e.target.value = "";
  };

  // ── Send attachment ───────────────────────────────────────────────────────
  const handleSendAttachment = async () => {
    if (!attachPreview || !session) return;
    const { file } = attachPreview;
    const isImage = file.type.startsWith("image/");
    const isPdf   = file.type === "application/pdf";

    // Show preview immediately in chat
    addMessage("user", file.name, {
      type: isImage ? "image" : "pdf",
      attachment_url: attachPreview.previewUrl || "",
      attachment_name: file.name,
    });
    setAttachPreview(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("session_id", session.session_id);
      formData.append("sender", "user");
      formData.append("file", file);

      const res = await fetch(`${API}/chatbot/upload-attachment`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!res.ok) {
        addMessage("bot", "Sorry, the file upload failed. Please try again.");
        return;
      }

      const data = await res.json();

      // Update the last message with real URL from server
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "user") {
          updated[updated.length - 1] = {
            ...last,
            attachment_url: data.url,
          };
        }
        return updated;
      });

      if (!agentJoined) {
        addMessage("bot", "Thanks for sharing the screenshot! Our team will review it. If you'd like faster help, click 'Talk to Agent' below.");
      }
    } catch {
      addMessage("bot", "Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Request agent ─────────────────────────────────────────────────────────
  const handleRequestAgent = async () => {
    if (!session) return;
    setAgentRequested(true); resetTimer();
    try {
      await fetch(`${API}/chatbot/request-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ session_id: session.session_id }),
      });
      addMessage("bot", "✋ You've been added to the agent queue. A support agent will join shortly. Please wait...");
    } catch { addMessage("bot", "Couldn't reach the agent queue. Please call us directly."); }
  };

  const handleClose = () => setStep("closed");
  const handleOpen  = () => {
    const persisted = loadSession();
    if (persisted) {
      setSession({ session_id: persisted.session_id, is_verified_client: persisted.is_verified_client });
      setForm({ name: persisted.name, email: persisted.email, phone: persisted.phone });
      setStep(messages.length > 0 ? "chat" : "menu");
    } else {
      setStep("identity");
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      {step !== "closed" && (
        <div style={{
          position: "fixed", bottom: "80px", right: "12px",
          width: "min(380px, calc(100vw - 24px))",
          maxHeight: "min(620px, calc(100vh - 100px))",
          background: "#fff", borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "'Outfit', 'Segoe UI', sans-serif", zIndex: 9999,
          animation: "slideUp 0.25s ease",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
            padding: "16px 20px", display: "flex", alignItems: "center",
            gap: "12px", flexShrink: 0,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>📡</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Hyperlink Support</div>
              <div style={{ color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                {agentJoined ? "Agent connected" : "Online • Typically replies instantly"}
              </div>
            </div>
            <button onClick={handleClose} style={{
              background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
              color: "#fff", width: 32, height: 32, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

            {/* Session expired banner */}
            {sessionExpired && step === "identity" && (
              <div style={{
                background: "#fff7ed", borderBottom: "1px solid #fed7aa",
                padding: "10px 16px", fontSize: 13, color: "#92400e",
              }}>
                ⏱ Your session expired after 10 minutes. Please start a new session.
              </div>
            )}

            {/* ── IDENTITY ── */}
            {step === "identity" && (
              <div style={{ padding: 24 }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#0f172a" }}>Welcome to Hyperlink Support</div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Please tell us who you are to get started</div>
                </div>
                {(["name","email","phone"] as const).map((field) => (
                  <div key={field} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {field === "name" ? "Full Name" : field === "email" ? "Email Address" : "Phone Number"}
                    </label>
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      placeholder={field === "name" ? "John Doe" : field === "email" ? "john@example.com" : "+250 7XX XXX XXX"}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleStartSession()}
                      style={{
                        width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
                        borderRadius: 10, fontSize: 16, outline: "none", marginTop: 4,
                        boxSizing: "border-box", WebkitAppearance: "none",
                      }}
                    />
                  </div>
                ))}
                {formError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{formError}</div>}
                <button onClick={handleStartSession} disabled={formLoading} style={{
                  width: "100%", padding: "12px",
                  background: formLoading ? "#94a3b8" : "linear-gradient(135deg, #0f172a, #1e3a5f)",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontWeight: 700, fontSize: 15, cursor: formLoading ? "not-allowed" : "pointer", marginTop: 4,
                }}>
                  {formLoading ? "Checking..." : "Start Chat →"}
                </button>
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
                  If you have an active session, it will be resumed automatically.
                </div>
              </div>
            )}

            {/* ── MAIN MENU ── */}
            {step === "menu" && (
              <div style={{ padding: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                    Hi {form.name.split(" ")[0]}! 👋 How can we help?
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Choose the issue that best describes your problem</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {MAIN_MENU.map((item) => (
                    <button key={item.id} onClick={() => handleSelectIssue(item)} style={{
                      background: item.bg, border: `1.5px solid ${item.border}`,
                      borderRadius: 14, padding: "14px 10px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 8, textAlign: "center", transition: "transform 0.15s",
                    }}>
                      <span style={{ fontSize: 26 }}>{item.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: item.color, lineHeight: 1.3, whiteSpace: "pre-line" }}>
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── SUB MENU ── */}
            {step === "submenu" && selectedIssue && (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <BackButton label="Back to menu" onClick={() => setStep("menu")} />
                <div style={{
                  background: selectedIssue.bg, border: `1.5px solid ${selectedIssue.border}`,
                  borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 24 }}>{selectedIssue.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: selectedIssue.color }}>
                      {selectedIssue.title.replace("\n", " ")}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Select what best describes your issue</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedIssue.subOptions.map((opt) => (
                    <button key={opt} onClick={() => handleSelectSubOption(opt)} style={{
                      background: "#f8fafc", border: "1.5px solid #e2e8f0",
                      borderRadius: 10, padding: "11px 14px", textAlign: "left",
                      fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <span>{opt}</span><span style={{ opacity: 0.4 }}>›</span>
                    </button>
                  ))}
                  <button onClick={() => {
                    addMessage("bot", `You selected: ${selectedIssue.title.replace("\n", " ")}. Please describe your specific issue and I'll help you right away.`);
                    setStep("chat");
                  }} style={{
                    background: "none", border: "1.5px dashed #cbd5e1",
                    borderRadius: 10, padding: "10px 14px",
                    textAlign: "left", fontSize: 13, color: "#64748b", cursor: "pointer",
                  }}>
                    💬 My issue is different, let me describe it
                  </button>
                </div>
                <BackButton label="Back to menu" onClick={() => setStep("menu")} />
              </div>
            )}

            {/* ── CHAT ── */}
            {step === "chat" && (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {!agentRequested && <BackButton label="Back to main menu" onClick={() => setStep("menu")} />}

                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    {msg.role !== "user" && (
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: msg.role === "agent"
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : "linear-gradient(135deg, #3b82f6, #06b6d4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, flexShrink: 0, marginRight: 8, alignSelf: "flex-end",
                      }}>
                        {msg.role === "agent" ? "👤" : "🤖"}
                      </div>
                    )}
                    <div style={{
                      maxWidth: "75%", padding: msg.type !== "text" ? "8px" : "10px 14px",
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg, #0f172a, #1e3a5f)"
                        : msg.role === "agent" ? "#ecfdf5" : "#f1f5f9",
                      color: msg.role === "user" ? "#fff" : "#1e293b",
                      fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
                      border: msg.role === "agent" ? "1px solid #a7f3d0" : "none",
                    }}>
                      {msg.role === "agent" && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 3 }}>Support Agent</div>
                      )}
                      {msg.type === "image" || msg.type === "pdf" ? (
                        <AttachmentBubble
                          url={msg.attachment_url || ""}
                          name={msg.attachment_name || "attachment"}
                          type={msg.type}
                          isUser={msg.role === "user"}
                        />
                      ) : msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing / uploading indicator */}
                {(loading || uploading) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                    }}>🤖</div>
                    <div style={{ background: "#f1f5f9", borderRadius: "18px 18px 18px 4px", padding: "10px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                      {uploading
                        ? <span style={{ fontSize: 12, color: "#64748b" }}>Uploading...</span>
                        : [0,1,2].map((i) => (
                          <div key={i} style={{
                            width: 6, height: 6, borderRadius: "50%", background: "#94a3b8",
                            animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s`,
                          }} />
                        ))}
                    </div>
                  </div>
                )}

                {agentJoined && (
                  <div style={{
                    textAlign: "center", fontSize: 12, color: "#059669",
                    background: "#ecfdf5", border: "1px solid #a7f3d0",
                    borderRadius: 8, padding: "6px 12px",
                  }}>
                    🧑‍💼 A support agent has joined the conversation
                  </div>
                )}

                {!agentRequested && messages.length > 0 && (
                  <button onClick={handleRequestAgent} style={{
                    background: "none", border: "1.5px solid #e2e8f0",
                    borderRadius: 10, padding: "9px 14px", fontSize: 12,
                    color: "#64748b", cursor: "pointer", textAlign: "center", marginTop: 4,
                  }}>
                    🧑‍💼 Still need help? Talk to a human agent
                  </button>
                )}

                {!agentRequested && <BackButton label="Back to main menu" onClick={() => setStep("menu")} />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── ATTACHMENT PREVIEW BAR ── */}
          {attachPreview && (
            <div style={{
              padding: "10px 12px", borderTop: "1px solid #f1f5f9",
              background: "#eff6ff", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}>
              {attachPreview.previewUrl ? (
                <img src={attachPreview.previewUrl} alt="preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📄</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e3a5f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attachPreview.file.name}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {(attachPreview.file.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <button onClick={handleSendAttachment} disabled={uploading} style={{
                background: uploading ? "#e2e8f0" : "#0f172a",
                color: uploading ? "#94a3b8" : "#fff",
                border: "none", borderRadius: 8, padding: "7px 14px",
                fontSize: 12, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", flexShrink: 0,
              }}>
                {uploading ? "..." : "Send"}
              </button>
              <button onClick={() => setAttachPreview(null)} style={{
                background: "none", border: "none", fontSize: 18,
                color: "#94a3b8", cursor: "pointer", padding: 4, flexShrink: 0,
              }}>✕</button>
            </div>
          )}

          {/* ── INPUT BAR ── */}
          {step === "chat" && (!agentRequested || agentJoined) && (
            <div style={{
              padding: "10px 12px", borderTop: "1px solid #f1f5f9",
              background: "#fff", flexShrink: 0,
            }}>
              {agentJoined && (
                <div style={{ fontSize: 11, color: "#059669", fontWeight: 600, textAlign: "center", marginBottom: 6 }}>
                  🟢 Chatting with a live agent
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Attach button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach image or PDF"
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "#f1f5f9", border: "1.5px solid #e2e8f0",
                    fontSize: 18, cursor: uploading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >📎</button>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); resetTimer(); }}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={agentJoined ? "Reply to agent..." : "Type your message..."}
                  style={{
                    flex: 1, padding: "11px 14px", border: "1.5px solid #e2e8f0",
                    borderRadius: 12, fontSize: 16, outline: "none",
                    background: "#f8fafc", WebkitAppearance: "none",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: loading || !input.trim() ? "#e2e8f0" : "linear-gradient(135deg, #0f172a, #1e3a5f)",
                    border: "none", color: loading || !input.trim() ? "#94a3b8" : "#fff",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >➤</button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          )}

          {step === "chat" && agentRequested && !agentJoined && (
            <div style={{
              padding: "12px 16px", borderTop: "1px solid #f1f5f9",
              background: "#fffbeb", textAlign: "center", fontSize: 13,
              color: "#92400e", flexShrink: 0,
            }}>
              ⏳ Waiting for an agent to join... please hold on
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <button
        onClick={step === "closed" ? handleOpen : handleClose}
        style={{
          position: "fixed", bottom: 20, right: 20, width: 56, height: 56,
          borderRadius: "50%", background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
          border: "none", color: "#fff", fontSize: 24, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(15,23,42,0.4)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
      >
        {step !== "closed" ? "✕" : "💬"}
      </button>

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>
    </>
  );
}