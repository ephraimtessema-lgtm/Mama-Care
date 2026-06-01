import React, { useState, useRef, useEffect, useCallback } from "react";
import { streamChatCompletion, toGroqMessages } from "@/api/chat";
import {
  listAiChatSessions,
  createAiChatSession,
  loadAiChatMessages,
  saveAiChatMessage,
  deleteAiChatSession,
  updateAiChatSession,
  titleFromFirstMessage,
} from "@/api/aiChatHistory";
import { getOrCreateFlowerName } from "@/api/userProfile";
import { useAuth } from "@/lib/AuthContext";
import AiChatSidebar, { AiChatMenuToggle } from "@/components/ai/AiChatSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Send, Phone, AlertTriangle, Loader2, Bot, User } from "lucide-react";

const EMERGENCY_KEYWORDS = [
  "heavy bleeding", "bleed", "severe pain", "chest pain", "can't breathe", "vision loss",
  "swelling face", "seizure", "unconscious", "fainted", "baby not moving", "no movement",
  "water broke early", "preterm", "miscarriage",
];

function detectEmergency(text) {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => lower.includes(k));
}

const SUGGESTIONS = [
  "Is it normal to feel dizzy in the first trimester? 🤰",
  "What foods should I avoid during pregnancy?",
  "How much weight gain is normal?",
  "What warning signs should I never ignore? 🚨",
  "Is it safe to exercise while pregnant? 💪",
];

function buildWelcome(flowerName) {
  return {
    role: "assistant",
    content: `Hello, beautiful! 🌸 I'm Mama-Care, your private pregnancy companion.\n\nYou're chatting as **${flowerName}** — your identity stays safe here 💗\n\nAsk me anything about pregnancy, birth, or caring for your baby. I use trusted guidance from WHO and Ethiopian health sources when I can.\n\nHow can I support you today? ✨`,
    timestamp: new Date().toISOString(),
    isWelcome: true,
  };
}

export default function AiChat() {
  const { user } = useAuth();
  const [flowerName, setFlowerName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [setupError, setSetupError] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const bottomRef = useRef(null);

  const refreshSessions = useCallback(async () => {
    if (!user?.id) return [];
    const list = await listAiChatSessions(user.id);
    setSessions(list);
    return list;
  }, [user?.id]);

  const loadSession = useCallback(
    async (sessionId, flower) => {
      const rows = await loadAiChatMessages(user.id, sessionId);
      if (rows.length === 0) {
        setMessages([buildWelcome(flower)]);
      } else {
        setMessages(rows);
      }
      setActiveSessionId(sessionId);
      setShowEmergency(rows.some((m) => m.is_emergency));
    },
    [user?.id],
  );

  const startNewChat = useCallback(
    async (flower) => {
      const session = await createAiChatSession(user.id);
      await refreshSessions();
      setActiveSessionId(session.id);
      setMessages([buildWelcome(flower)]);
      setShowEmergency(false);
      setSidebarOpen(false);
    },
    [user?.id, refreshSessions],
  );

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const flower = await getOrCreateFlowerName(user.id);
        if (cancelled) return;
        setFlowerName(flower);

        let list = [];
        try {
          list = await listAiChatSessions(user.id);
        } catch (e) {
          if (e.message?.includes("ai_chat_sessions")) {
            setSetupError("Run supabase/migrations/004_ai_chat_sessions.sql in Supabase to enable chat history.");
          }
          throw e;
        }

        if (cancelled) return;
        setSessions(list);

        if (list.length > 0) {
          await loadSession(list[0].id, flower);
        } else {
          await startNewChat(flower);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setFlowerName("Pink Jasmine");
          setMessages([buildWelcome("Pink Jasmine")]);
        }
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loadSession, startNewChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeSessionId]);

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText || isLoading || !user?.id || !activeSessionId) return;
    setInput("");

    const isEmergency = detectEmergency(msgText);
    const userMsg = { role: "user", content: msgText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    await saveAiChatMessage(user.id, activeSessionId, {
      role: "user",
      content: msgText,
    }).catch(console.error);

    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (activeSession?.title === "New chat") {
      const title = titleFromFirstMessage(msgText);
      await updateAiChatSession(activeSessionId, { title }).catch(console.error);
      await refreshSessions();
    }

    if (isEmergency) setShowEmergency(true);

    const conversationForApi = [...messages, userMsg];
    const groqMessages = toGroqMessages(conversationForApi);

    const assistantPlaceholder = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      is_emergency: isEmergency,
    };

    setMessages((prev) => [...prev, assistantPlaceholder]);
    setIsLoading(true);

    try {
      const fullReply = await streamChatCompletion({
        messages: groqMessages,
        onDelta: (partial) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: partial };
            }
            return next;
          });
        },
      });

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = { ...last, content: fullReply };
        }
        return next;
      });

      await saveAiChatMessage(user.id, activeSessionId, {
        role: "assistant",
        content: fullReply,
        is_emergency: isEmergency,
      }).catch(console.error);
      await refreshSessions();
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        if (next[next.length - 1]?.role === "assistant" && !next[next.length - 1]?.content) {
          next.pop();
        }
        return next;
      });
      const errMsg = err?.message || "AI request failed";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I could not respond right now. 💗 ${errMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) {
      setSidebarOpen(false);
      return;
    }
    try {
      await loadSession(sessionId, flowerName || "Pink Jasmine");
      setSidebarOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm("Delete this chat? This cannot be undone.")) return;
    try {
      await deleteAiChatSession(user.id, sessionId);
      const list = await refreshSessions();
      if (sessionId === activeSessionId) {
        if (list.length > 0) {
          await loadSession(list[0].id, flowerName);
        } else {
          await startNewChat(flowerName || "Pink Jasmine");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = () => startNewChat(flowerName || "Pink Jasmine");

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions =
    messages.length <= 1 && (messages.length === 0 || messages[0]?.isWelcome);

  if (!historyLoaded) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] bg-rose-50 items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <p className="text-sm text-gray-500 mt-3">Loading your chats…</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] bg-rose-50 overflow-hidden">
      <AiChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="bg-white border-b border-rose-100 px-3 py-3 flex items-center justify-between shadow-sm shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AiChatMenuToggle
              open={sidebarOpen}
              onClick={() => setSidebarOpen((o) => !o)}
            />
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-lg shrink-0">
              🤖
            </div>
            <div className="min-w-0">
              <div className="font-bold text-gray-900 text-sm truncate">Mama-Care AI</div>
              <div className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block shrink-0" />
                Online 24/7
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-rose-100 text-rose-600 border-rose-200 text-xs rounded-full hidden sm:inline-flex">
              🌸 {flowerName}
            </Badge>
            <Link to="/doctors">
              <Button size="sm" variant="outline" className="text-xs border-rose-300 text-rose-600 rounded-full">
                Book Doctor
              </Button>
            </Link>
          </div>
        </div>

        {setupError && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2">
            {setupError}
          </div>
        )}

        {showEmergency && (
          <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Possible emergency — seek medical help now!</span>
            </div>
            <a href="tel:8044">
              <Button size="sm" className="bg-white text-red-500 hover:bg-red-50 rounded-full gap-1 text-xs font-bold">
                <Phone className="w-3 h-3" /> Call 8044
              </Button>
            </a>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || `msg-${idx}`}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "assistant" ? "bg-rose-100" : "bg-purple-100"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-rose-500" />
                ) : (
                  <User className="w-4 h-4 text-purple-500" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? msg.is_emergency
                      ? "bg-red-50 border border-red-200 text-gray-800"
                      : "bg-white border border-rose-100 text-gray-800 shadow-sm"
                    : "bg-rose-500 text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading &&
            messages[messages.length - 1]?.role === "assistant" &&
            !messages[messages.length - 1]?.content && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-rose-500" />
                </div>
                <div className="bg-white border border-rose-100 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                  <span className="text-sm text-gray-400">Mama-Care is thinking… 💭</span>
                </div>
              </div>
            )}
          <div ref={bottomRef} />
        </div>

        {showSuggestions && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-xs bg-white border border-rose-200 text-rose-600 rounded-full px-3 py-1.5 hover:bg-rose-50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border-t border-rose-100 px-4 py-3 shrink-0">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about pregnancy, symptoms, nutrition…"
              className="rounded-full border-rose-200 focus:border-rose-400 bg-rose-50"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-full w-10 h-10 p-0 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            🔒 Chats saved to your account • Based on WHO & trusted health guidance • Not medical advice
          </p>
        </div>
      </div>
    </div>
  );
}
