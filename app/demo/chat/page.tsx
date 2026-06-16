"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const SUGGESTIONS = [
  "I have 700 kcal and 60g protein left — what from Coop?",
  "Give me a sweet high-protein option.",
  "What's the cheapest Migros meal under 500 kcal?",
  "Can I fit something quick after the gym?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Hey. Tell me your remaining macros and what you feel like eating. I'll find you something real from Coop or Migros.\n\nExample: \"I have 600 kcal and 50g protein left, I want something quick from Coop.\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const loadingMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      loading: true,
    };
    setMessages((m) => [...m, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply: string =
        data.reply ??
        "AI is not configured yet. Add an ANTHROPIC_API_KEY or OPENAI_API_KEY to your environment to enable the chatbot.";
      setMessages((m) =>
        m.map((msg) =>
          msg.loading ? { ...msg, content: reply, loading: false } : msg
        )
      );
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.loading
            ? {
                ...msg,
                content:
                  "Could not reach the AI. Check that the API route is configured.",
                loading: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 pt-12 pb-4 flex-shrink-0 safe-top"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Image src="/road2abs-icon.png" alt="Road2Abs" width={28} height={28} className="rounded-lg" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Road2Abs AI</p>
          <p className="text-xs text-[var(--text-secondary)]">Only uses verified products</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent-lime)] text-black font-medium"
                  : ""
              }`}
              style={
                msg.role === "assistant"
                  ? { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }
                  : undefined
              }
            >
              {msg.loading ? (
                <span className="flex gap-1.5 items-center py-0.5">
                  <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                  <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                  <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                </span>
              ) : (
                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-full border text-[var(--text-secondary)] active:opacity-70 whitespace-nowrap"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-4 py-3 flex items-end gap-2 flex-shrink-0 pb-safe"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="What fits today?"
          rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            maxHeight: 120,
          }}
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            input.trim() && !loading
              ? "bg-[var(--accent-lime)] text-black active:scale-90"
              : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
          }`}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
