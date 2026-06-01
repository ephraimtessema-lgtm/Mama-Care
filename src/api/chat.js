const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Mama-Care 💕 — a warm, expert pregnancy companion for Ethiopian mothers.

## Your personality
- Speak like a caring sister or midwife: kind, hopeful, never judgmental.
- Use emojis naturally (🌸 💗 🤰 ✨ 👶 🍼 💪) — about 2–5 per reply, not every word.
- Keep answers clear, short paragraphs, and easy to read on a phone.

## Trusted sources (base guidance on these — cite when helpful)
- World Health Organization (WHO) — maternal & newborn health
- Ethiopian Ministry of Health — national maternal care guidelines
- UNICEF Ethiopia — pregnancy & child health
- American College of Obstetricians and Gynecologists (ACOG) — general standards
- Mayo Clinic & NHS pregnancy pages — for common symptom explanations

When you give medical information, briefly mention the type of source, e.g. "According to WHO guidance…" or "Ethiopian health guidelines recommend…". Do not invent studies or statistics.

## Safety rules
- Never diagnose. Say what might be normal vs when to see a doctor.
- If symptoms sound dangerous (heavy bleeding, severe pain, chest pain, trouble breathing, vision changes, seizures, baby not moving, etc.), start with: 🚨 EMERGENCY ALERT 🚨
- Urge calling emergency services (911) or going to the nearest hospital when appropriate.
- Remind users this chat does not replace a doctor or midwife.

## Cultural context
- Be sensitive to Ethiopian family life, faith, food, and access to care.
- Suggest affordable, practical steps when possible.`;

/** Client-only welcome — not sent to the model as history */
export function isWelcomeOnly(messages) {
  return messages.length === 1 && messages[0]?.role === 'assistant' && messages[0]?.isWelcome;
}

/** Convert app chat rows to Groq message format (multi-turn). */
export function toGroqMessages(appMessages) {
  const groqMessages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const msg of appMessages) {
    if (msg.isWelcome) continue;
    if (msg.role !== 'user' && msg.role !== 'assistant') continue;
    if (!msg.content?.trim()) continue;
    groqMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  return groqMessages;
}

function parseSseLines(buffer, onDelta, fullTextRef) {
  const lines = buffer.split('\n');
  const remainder = lines.pop() ?? '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.replace(/^data:\s*/, '');
    if (data === '[DONE]') continue;
    try {
      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullTextRef.current += delta;
        onDelta?.(fullTextRef.current);
      }
    } catch {
      // ignore malformed SSE chunks
    }
  }

  return remainder;
}

export async function streamChatCompletion({ messages, onDelta }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'AI chat is not configured. Add VITE_GROQ_API_KEY to .env.local (get a key at https://console.groq.com).',
    );
  }

  const model = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model,
      temperature: 0.75,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    }),
  });

  if (!res.ok) {
    let message = `Groq request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.error?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error('Streaming is not supported in this browser.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const fullTextRef = { current: '' };
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseLines(buffer, onDelta, fullTextRef);
  }

  buffer += decoder.decode();
  parseSseLines(`${buffer}\n`, onDelta, fullTextRef);

  if (!fullTextRef.current.trim()) {
    throw new Error('Groq returned an empty response. Please try again.');
  }

  return fullTextRef.current;
}

export async function invokeLLM({ prompt, messages: providedMessages }) {
  const messages =
    providedMessages ||
    toGroqMessages([{ role: 'user', content: prompt }]);
  return streamChatCompletion({ messages });
}
