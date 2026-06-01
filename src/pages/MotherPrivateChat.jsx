import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getOrCreateFlowerName } from '@/api/userProfile';
import {
  getPartnerProfile,
  loadPrivateMessages,
  sendPrivateMessage,
  subscribePrivateMessages,
} from '@/api/motherPrivateChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Lock, Send } from 'lucide-react';

export default function MotherPrivateChat() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [flowerName, setFlowerName] = useState('');
  const [partnerName, setPartnerName] = useState(location.state?.flowerName || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.id || !partnerId) return;
    if (partnerId === user.id) {
      navigate('/mother-chat', { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [flower, profile, msgs] = await Promise.all([
          user.flower_name || getOrCreateFlowerName(user.id),
          getPartnerProfile(partnerId),
          loadPrivateMessages(user.id, partnerId),
        ]);
        if (cancelled) return;
        setFlowerName(flower);
        setPartnerName(profile?.flower_name || location.state?.flowerName || 'Flower Mom');
        setMessages(msgs);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Could not load private chat. Run migration 007 in Supabase.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const unsub = subscribePrivateMessages(user.id, partnerId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user?.id, partnerId, navigate, location.state?.flowerName, user?.flower_name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending || !user?.id) return;
    setSending(true);
    setError('');
    try {
      const msg = await sendPrivateMessage({
        senderId: user.id,
        recipientId: partnerId,
        senderFlowerName: flowerName || user.flower_name || 'Flower Mom',
        content: input.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch (err) {
      setError(err?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-rose-50 dark:bg-gray-950 flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/mother-chat">
            <Button variant="ghost" size="icon" className="rounded-full dark:text-gray-200">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 truncate">
              <Lock className="w-4 h-4 shrink-0" />
              Private chat with 🌸 {partnerName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only you and this mom can see these messages
            </p>
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">
              You: {flowerName || user.flower_name}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-center text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 py-2 px-4">
          {error}
        </p>
      )}

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 overflow-y-auto space-y-3">
        {loading && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">Loading private chat…</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">
            Say hello to 🌸 {partnerName} — your messages stay private between you two.
          </p>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  mine
                    ? 'bg-rose-500 text-white'
                    : 'bg-white dark:bg-gray-800 border border-rose-100 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                }`}
              >
                {!mine && (
                  <p className="text-xs font-semibold opacity-80 mb-0.5">
                    🌸 {msg.sender_flower_name || partnerName}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="sticky bottom-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4"
      >
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message 🌸 ${partnerName}…`}
            className="rounded-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            disabled={sending || loading}
          />
          <Button
            type="submit"
            disabled={sending || loading || !input.trim()}
            className="rounded-full bg-rose-500 hover:bg-rose-600 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
