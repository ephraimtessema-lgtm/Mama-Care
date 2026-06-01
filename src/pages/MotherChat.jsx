import React, { useState, useEffect, useRef } from "react";
import { MotherChat as MotherChatEntity } from "@/api/entities";
import { getCurrentUser, redirectToLogin } from "@/api/auth";
import { getOrCreateFlowerName } from "@/api/userProfile";
import { listRecentPrivatePartners } from "@/api/motherPrivateChat";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle, Lock } from "lucide-react";
import { isAdmin } from "@/lib/roles";
import { deleteMotherChatMessage, adminSetUserBans } from "@/api/moderation";
import HoverDeleteButton from "@/components/HoverDeleteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROOMS = [
  { id: "general", label: "🌸 General", desc: "All moms welcome" },
  { id: "first_trimester", label: "🌱 First Trimester", desc: "Weeks 1–12" },
  { id: "second_trimester", label: "🌺 Second Trimester", desc: "Weeks 13–26" },
  { id: "third_trimester", label: "🌼 Third Trimester", desc: "Weeks 27–40" },
  { id: "postpartum", label: "🤱 Postpartum", desc: "After birth" },
];

function SenderLabel({ msg, currentUserId, onPrivateChat, admin, onBanUser }) {
  const canDm = msg.sender_id && msg.sender_id !== currentUserId;

  if (canDm) {
    return (
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <button
          type="button"
          onClick={() => onPrivateChat(msg.sender_id, msg.sender_name)}
          className="text-xs font-semibold opacity-90 underline-offset-2 hover:underline text-left dark:text-rose-200"
          title="Open private chat"
        >
          🌸 {msg.sender_name}
        </button>
        {admin && (
          <button
            type="button"
            className="text-[10px] px-2 py-0.5 rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={() => onBanUser(msg.sender_id)}
          >
            Ban
          </button>
        )}
      </div>
    );
  }

  return <p className="text-xs font-semibold opacity-80 mb-0.5">🌸 {msg.sender_name}</p>;
}

export default function MotherChat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [flowerName, setFlowerName] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [privatePartners, setPrivatePartners] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const openPrivateChat = (partnerId, name) => {
    navigate(`/mother-chat/dm/${partnerId}`, { state: { flowerName: name } });
  };

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        setUser(u);
        if (u?.id) {
          const flower = u.flower_name || (await getOrCreateFlowerName(u.id));
          setFlowerName(flower);
          listRecentPrivatePartners(u.id)
            .then(setPrivatePartners)
            .catch(() => setPrivatePartners([]));
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadMessages();
    const unsub = MotherChatEntity.subscribe((event) => {
      if (event.data?.room === activeRoom) {
        if (event.type === "create") {
          setMessages((prev) => [...prev, event.data]);
        }
      }
    });
    return unsub;
  }, [user, activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    const msgs = await MotherChatEntity.filter({ room: activeRoom }, "created_date", 50);
    setMessages(msgs);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const name = flowerName || user.flower_name || "Anonymous Flower";
    await MotherChatEntity.create({
      sender_id: user.id,
      sender_name: name,
      sender_email: user.email,
      room: activeRoom,
      content: input.trim(),
    });
    setInput("");
    setSending(false);
  }

  if (loadingUser) {
    return (
      <div className="flex flex-1 items-center justify-center bg-rose-50 dark:bg-gray-950 min-h-[50vh]">
        <div className="text-4xl animate-pulse">🌸</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Session expired. Please sign in again.</p>
          <Button
            onClick={() => redirectToLogin("/mother-chat")}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-8 py-3"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const currentRoom = ROOMS.find((r) => r.id === activeRoom);
  const admin = isAdmin(user);

  async function handleDeleteMessage(msg) {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteMotherChatMessage(msg.id, user.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (err) {
      alert(err?.message || "Could not delete message. Run migration 009 in Supabase.");
    }
  }

  async function handleBanUser(targetUserId) {
    if (!targetUserId || !window.confirm("Ban this user from Mother Chat?")) return;
    try {
      await adminSetUserBans(targetUserId, { motherChat: true });
      alert("User banned from Mother Chat.");
    } catch (err) {
      alert(err?.message || "Could not ban user.");
    }
  }

  if (user?.banned_from_mother_chat) {
    return (
      <div className="min-h-screen bg-rose-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white dark:bg-gray-900 rounded-2xl border border-rose-100 dark:border-gray-800 p-8">
          <p className="text-4xl mb-3">💬</p>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Mother Chat access paused</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You cannot send messages in Mother Chat right now. Contact support if you think this is a mistake.
          </p>
          <Link to="/">
            <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white">Back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-rose-50 dark:bg-gray-950 flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full dark:text-gray-200">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 shrink-0" /> Mother Chat
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentRoom?.label} — {currentRoom?.desc}
            </p>
            {flowerName && (
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">🌸 Chatting as {flowerName}</p>
            )}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Tap another mom&apos;s flower name for a private chat
            </p>
          </div>
        </div>

        {privatePartners.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Private chats
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {privatePartners.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openPrivateChat(p.id, p.flowerName)}
                  className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                >
                  🌸 {p.flowerName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setActiveRoom(room.id)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                activeRoom === room.id
                  ? "bg-rose-500 text-white"
                  : "bg-rose-100 dark:bg-gray-800 text-rose-600 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-gray-700"
              }`}
            >
              {room.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const mine = msg.sender_id === user.id || msg.sender_email === user.email;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  mine
                    ? "bg-rose-500 text-white"
                    : "bg-white dark:bg-gray-800 border border-rose-100 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                }`}
              >
                {mine && msg.sender_id && (
                  <div className="absolute -top-2 -right-2">
                    <HoverDeleteButton
                      title="Delete message"
                      className="bg-white/90 dark:bg-gray-900/90 shadow-sm"
                      onClick={() => handleDeleteMessage(msg)}
                    />
                  </div>
                )}
                <SenderLabel
                  msg={msg}
                  currentUserId={user.id}
                  onPrivateChat={openPrivateChat}
                  admin={admin}
                  onBanUser={handleBanUser}
                />
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="sticky bottom-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4"
      >
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share with other moms…"
            className="rounded-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-rose-500 hover:bg-rose-600 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
