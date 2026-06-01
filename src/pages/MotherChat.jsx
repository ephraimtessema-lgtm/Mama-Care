import React, { useState, useEffect, useRef } from "react";
import { MotherChat as MotherChatEntity } from "@/api/entities";
import { getCurrentUser, redirectToLogin } from "@/api/auth";
import { getOrCreateFlowerName } from "@/api/userProfile";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROOMS = [
  { id: "general", label: "🌸 General", desc: "All moms welcome" },
  { id: "first_trimester", label: "🌱 First Trimester", desc: "Weeks 1–12" },
  { id: "second_trimester", label: "🌺 Second Trimester", desc: "Weeks 13–26" },
  { id: "third_trimester", label: "🌼 Third Trimester", desc: "Weeks 27–40" },
  { id: "postpartum", label: "🤱 Postpartum", desc: "After birth" },
];

export default function MotherChat() {
  const [user, setUser] = useState(null);
  const [flowerName, setFlowerName] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        setUser(u);
        if (u?.id) {
          const flower = u.flower_name || (await getOrCreateFlowerName(u.id));
          setFlowerName(flower);
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
      <div className="flex flex-1 items-center justify-center bg-rose-50 min-h-[50vh]">
        <div className="text-4xl animate-pulse">🌸</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-500 mb-4">Session expired. Please sign in again.</p>
          <Button
            onClick={() => redirectToLogin('/mother-chat')}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-8 py-3"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const currentRoom = ROOMS.find((r) => r.id === activeRoom);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-b from-rose-50 to-white flex flex-col">
      <div className="bg-white border-b sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-rose-700 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Mother Chat
            </h1>
            <p className="text-xs text-gray-500">{currentRoom?.label} — {currentRoom?.desc}</p>
            {flowerName && (
              <p className="text-xs text-rose-500 mt-0.5">🌸 Chatting as {flowerName}</p>
            )}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.id)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                activeRoom === room.id
                  ? "bg-rose-500 text-white"
                  : "bg-rose-100 text-rose-600 hover:bg-rose-200"
              }`}
            >
              {room.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_email === user.email ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.sender_email === user.email
                  ? "bg-rose-500 text-white"
                  : "bg-white border border-rose-100 text-gray-800"
              }`}
            >
              <p className="text-xs font-semibold opacity-80 mb-0.5">
                🌸 {msg.sender_name}
              </p>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="sticky bottom-0 bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share with other moms…"
            className="rounded-full"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()} className="rounded-full bg-rose-500 hover:bg-rose-600">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
