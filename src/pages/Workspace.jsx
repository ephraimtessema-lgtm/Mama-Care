import { useState, useEffect, useRef } from "react";
import { Project } from "@/api/entities";
import { ChatMessage } from "@/api/entities";
import { ProjectFile } from "@/api/entities";

// ─── Constants ────────────────────────────────────────────────────────────────
const LANG_MAP = {
  js: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
  py: "python", go: "go", rs: "rust", css: "css", html: "html",
  json: "json", md: "markdown", sh: "bash", yaml: "yaml", yml: "yaml",
};
const FILE_ICONS = {
  js: "🟨", jsx: "⚛️", ts: "🔷", tsx: "⚛️", py: "🐍", go: "🐹",
  rs: "🦀", css: "🎨", html: "🌐", json: "📋", md: "📝",
  sh: "💻", yaml: "⚙️", yml: "⚙️", default: "📄",
};
const AI_RESPONSES = [
  { text: "Here's the implementation:", code: true },
  { text: "I'll refactor this for better performance:", code: true },
  { text: "Fixed the issue — here's the corrected version:", code: true },
  { text: "Generated with best practices:", code: true },
];
const SAMPLE_CODE = {
  tsx: `import React, { useState, useEffect } from 'react';

interface DashboardProps {
  userId: string;
  theme?: 'light' | 'dark';
}

export default function Dashboard({ userId, theme = 'dark' }: DashboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(userId).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <Skeleton />;

  return (
    <div className={cn('dashboard', theme)}>
      <Header title="Dashboard" />
      <main className="grid grid-cols-3 gap-6 p-8">
        {data.map(item => (
          <Card key={item.id} {...item} />
        ))}
      </main>
    </div>
  );
}`,
  py: `from typing import Optional, List
import asyncio
import httpx

class DataProcessor:
    """High-performance async data processor."""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {api_key}"}
    
    async def fetch_batch(
        self, 
        ids: List[str],
        concurrency: int = 10
    ) -> List[dict]:
        async with httpx.AsyncClient() as client:
            semaphore = asyncio.Semaphore(concurrency)
            tasks = [self._fetch_one(client, semaphore, id) for id in ids]
            return await asyncio.gather(*tasks)
    
    async def _fetch_one(self, client, sem, id: str) -> dict:
        async with sem:
            resp = await client.get(
                f"{self.base_url}/items/{id}",
                headers=self.headers
            )
            resp.raise_for_status()
            return resp.json()`,
  js: `const express = require('express');
const { rateLimit } = require('express-rate-limit');

const app = express();
const limiter = rateLimit({ windowMs: 60_000, max: 100 });

app.use(express.json());
app.use('/api', limiter);

app.post('/api/process', async (req, res) => {
  try {
    const { data, options = {} } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Missing data field' });
    }

    const result = await processData(data, options);
    res.json({ success: true, result, timestamp: Date.now() });
  } catch (error) {
    console.error('[process]', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('🚀 Server ready on :3000'));`,
};

const TERMINAL_LINES = [
  { type: "info", text: "DevForge AI workspace initialized" },
  { type: "success", text: "✓ Project files loaded" },
  { type: "info", text: "$ npm run dev" },
  { type: "success", text: "  VITE v5.0.0  ready in 312ms" },
  { type: "success", text: "  ➜  Local:   http://localhost:5173/" },
  { type: "muted", text: "  ➜  Network: use --host to expose" },
];

// ─── Syntax Highlighter ───────────────────────────────────────────────────────
function highlight(code, lang) {
  const escape = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let s = escape(code);
  // keywords
  const kws = /\b(import|export|default|from|const|let|var|function|return|if|else|for|while|class|extends|interface|type|async|await|try|catch|throw|new|typeof|instanceof|void|null|undefined|true|false|def|self|pass|with|as|in|not|and|or|elif|yield|lambda|raise|del|global|nonlocal|assert|finally|is)\b/g;
  s = s.replace(kws, '<span style="color:#c792ea">$1</span>');
  // strings
  s = s.replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, '<span style="color:#c3e88d">$1</span>');
  // comments
  s = s.replace(/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#546e7a;font-style:italic">$1</span>');
  // numbers
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');
  // types/classes
  s = s.replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span style="color:#82aaff">$1</span>');
  // functions
  s = s.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span style="color:#82aaff">$1</span>');
  // tags (html/jsx)
  s = s.replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span style="color:#f07178">$1</span>');
  // decorators
  s = s.replace(/(@[a-zA-Z_][a-zA-Z0-9_]*)/g, '<span style="color:#89ddff">$1</span>');
  return s;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Workspace() {
  const projectId = new URLSearchParams(window.location.search).get("project");

  // State
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [aiInput, setAiInput] = useState("");
  const [sending, setSending] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalLines, setTerminalLines] = useState(TERMINAL_LINES);
  const [terminalInput, setTerminalInput] = useState("");
  const [commandPalette, setCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [aiPanelWidth, setAiPanelWidth] = useState(340);
  const [terminalHeight, setTerminalHeight] = useState(180);
  const [fileTreeExpanded, setFileTreeExpanded] = useState({ src: true });
  const [diffMode, setDiffMode] = useState(false);
  const [diffContent, setDiffContent] = useState(null);
  const [inlineSuggestion, setInlineSuggestion] = useState(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [sidebarTab, setSidebarTab] = useState("explorer");
  const [searchQuery, setSearchQuery] = useState("");
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingAI, setIsResizingAI] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [projectList, setProjectList] = useState([]);
  const [projectExpanded, setProjectExpanded] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [lineNumbers, setLineNumbers] = useState([]);

  const editorRef = useRef(null);
  const aiEndRef = useRef(null);
  const cmdRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
    Project.list().then(setProjectList).catch(() => {});
  }, [projectId]);

  async function loadData() {
    try {
      const defaultFiles = [
        { id: "f1", file_name: "Dashboard.tsx", file_path: "/src/components/Dashboard.tsx", language: "tsx", content: SAMPLE_CODE.tsx, size_bytes: 520 },
        { id: "f2", file_name: "api.py", file_path: "/src/api.py", language: "py", content: SAMPLE_CODE.py, size_bytes: 480 },
        { id: "f3", file_name: "server.js", file_path: "/src/server.js", language: "js", content: SAMPLE_CODE.js, size_bytes: 410 },
        { id: "f4", file_name: "index.html", file_path: "/public/index.html", language: "html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>DevForge App</title>\n</head>\n<body>\n  <div id=\"root\"></div>\n</body>\n</html>", size_bytes: 120 },
        { id: "f5", file_name: "package.json", file_path: "/package.json", language: "json", content: '{\n  "name": "devforge-app",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "typescript": "^5.0.0"\n  }\n}', size_bytes: 220 },
      ];

      if (projectId) {
        const [proj, dbFiles, msgs] = await Promise.all([
          Project.get(projectId).catch(() => null),
          ProjectFile.filter({ project_id: projectId }).catch(() => []),
          ChatMessage.filter({ project_id: projectId }).catch(() => []),
        ]);
        setProject(proj);
        const allFiles = dbFiles.length > 0 ? dbFiles : defaultFiles;
        setFiles(allFiles);
        setMessages(msgs);
        if (allFiles.length > 0) openFile(allFiles[0]);
      } else {
        setFiles(defaultFiles);
        openFile(defaultFiles[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openFile(file) {
    setOpenTabs(prev => {
      const exists = prev.find(t => t.id === file.id);
      if (!exists) return [...prev, file];
      return prev;
    });
    setActiveTab(file);
    setEditorContent(file.content || "");
    updateLineNumbers(file.content || "");
    setDiffMode(false);
    setInlineSuggestion(null);
  }

  function updateLineNumbers(content) {
    const lines = content.split("\n");
    setLineNumbers(lines.map((_, i) => i + 1));
  }

  function closeTab(file, e) {
    e?.stopPropagation();
    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== file.id);
      if (activeTab?.id === file.id) {
        setActiveTab(next[next.length - 1] || null);
        setEditorContent(next[next.length - 1]?.content || "");
        updateLineNumbers(next[next.length - 1]?.content || "");
      }
      return next;
    });
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "k") { e.preventDefault(); setCommandPalette(true); setCommandQuery(""); }
      if (e.key === "Escape") { setCommandPalette(false); setDiffMode(false); setInlineSuggestion(null); }
      if (mod && e.key === "`") { e.preventDefault(); setTerminalOpen(p => !p); }
      if (mod && e.key === "w") { e.preventDefault(); if (activeTab) closeTab(activeTab); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  useEffect(() => {
    if (commandPalette && cmdRef.current) cmdRef.current.focus();
  }, [commandPalette]);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ── Resize handlers ────────────────────────────────────────────────────────
  function startResizeSidebar(e) {
    e.preventDefault();
    setIsResizingSidebar(true);
    const startX = e.clientX;
    const startW = sidebarWidth;
    const move = ev => setSidebarWidth(Math.max(160, Math.min(400, startW + ev.clientX - startX)));
    const up = () => { setIsResizingSidebar(false); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function startResizeAI(e) {
    e.preventDefault();
    setIsResizingAI(true);
    const startX = e.clientX;
    const startW = aiPanelWidth;
    const move = ev => setAiPanelWidth(Math.max(260, Math.min(600, startW - (ev.clientX - startX))));
    const up = () => { setIsResizingAI(false); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function startResizeTerminal(e) {
    e.preventDefault();
    setIsResizingTerminal(true);
    const startY = e.clientY;
    const startH = terminalHeight;
    const move = ev => setTerminalHeight(Math.max(80, Math.min(400, startH - (ev.clientY - startY))));
    const up = () => { setIsResizingTerminal(false); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  // ── AI send ────────────────────────────────────────────────────────────────
  async function sendAI() {
    if (!aiInput.trim() || sending) return;
    const userMsg = { id: Date.now().toString(), role: "user", content: aiInput, created_date: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setAiInput("");
    setSending(true);

    if (projectId) {
      ChatMessage.create({ project_id: projectId, role: "user", content: aiInput, message_type: "text" }).catch(() => {});
    }

    setTimeout(() => {
      const resp = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      const lang = activeTab?.language || "tsx";
      const codeSnippet = generateSmartCode(aiInput, lang);
      const fullContent = resp.text + "\n\n```" + lang + "\n" + codeSnippet + "\n```";

      const aiMsg = { id: (Date.now() + 1).toString(), role: "assistant", content: fullContent, created_date: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
      setSending(false);

      // Show diff preview
      if (activeTab) {
        setDiffContent(codeSnippet);
        setDiffMode(true);
      }

      // Inline suggestion
      setInlineSuggestion("// AI: " + codeSnippet.split("\n")[0]);

      if (projectId) {
        ChatMessage.create({ project_id: projectId, role: "assistant", content: fullContent, message_type: "code" }).catch(() => {});
      }
    }, 1600);
  }

  function applyDiff() {
    if (!diffContent || !activeTab) return;
    const updated = { ...activeTab, content: diffContent };
    setActiveTab(updated);
    setEditorContent(diffContent);
    updateLineNumbers(diffContent);
    setFiles(prev => prev.map(f => f.id === activeTab.id ? updated : f));
    setOpenTabs(prev => prev.map(t => t.id === activeTab.id ? updated : t));
    setDiffMode(false);
    setDiffContent(null);
    setInlineSuggestion(null);
    addTerminalLine({ type: "success", text: `✓ Applied AI edit to ${activeTab.file_name}` });
  }

  function rejectDiff() {
    setDiffMode(false);
    setDiffContent(null);
    setInlineSuggestion(null);
    addTerminalLine({ type: "muted", text: "✗ Diff rejected" });
  }

  function addTerminalLine(line) {
    setTerminalLines(prev => [...prev, line]);
  }

  function runTerminalCommand(cmd) {
    addTerminalLine({ type: "info", text: "$ " + cmd });
    setTerminalInput("");
    setTimeout(() => {
      if (cmd.startsWith("npm") || cmd.startsWith("yarn")) {
        addTerminalLine({ type: "success", text: "✓ Done in 1.2s" });
      } else if (cmd === "clear") {
        setTerminalLines([]);
      } else if (cmd === "ls") {
        addTerminalLine({ type: "muted", text: "src/  public/  package.json  tsconfig.json  README.md" });
      } else {
        addTerminalLine({ type: "muted", text: `zsh: command not found: ${cmd.split(" ")[0]}` });
      }
    }, 300);
  }

  function generateSmartCode(prompt, lang) {
    const p = prompt.toLowerCase();
    if (p.includes("button") || p.includes("component")) {
      return `export function Button({ label, onClick, variant = 'primary' }) {\n  return (\n    <button\n      onClick={onClick}\n      className={\`btn btn-\${variant}\`}\n    >\n      {label}\n    </button>\n  );\n}`;
    }
    if (p.includes("fetch") || p.includes("api") || p.includes("request")) {
      return `async function fetchData(endpoint: string, options = {}) {\n  const response = await fetch(\`/api/\${endpoint}\`, {\n    headers: { 'Content-Type': 'application/json', ...options.headers },\n    ...options,\n  });\n  if (!response.ok) throw new Error(response.statusText);\n  return response.json();\n}`;
    }
    if (p.includes("hook") || p.includes("state")) {
      return `function useData<T>(url: string) {\n  const [data, setData] = useState<T | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<Error | null>(null);\n\n  useEffect(() => {\n    fetch(url)\n      .then(r => r.json())\n      .then(setData)\n      .catch(setError)\n      .finally(() => setLoading(false));\n  }, [url]);\n\n  return { data, loading, error };\n}`;
    }
    return `// Generated by DevForge AI\nexport function generated() {\n  const result = process(input);\n  return transform(result);\n}`;
  }

  // ── Command palette items ──────────────────────────────────────────────────
  const commands = [
    { label: "Go to Dashboard", icon: "🏠", action: () => { window.location.href = "/dashboard"; }, shortcut: "" },
    { label: "New Project", icon: "✨", action: () => { window.location.href = "/dashboard"; }, shortcut: "" },
    { label: "Toggle Terminal", icon: "💻", action: () => setTerminalOpen(p => !p), shortcut: "⌘`" },
    { label: "Open Billing", icon: "💳", action: () => { window.location.href = "/billing"; }, shortcut: "" },
    { label: "Open Team", icon: "👥", action: () => { window.location.href = "/team"; }, shortcut: "" },
    { label: "Close Tab", icon: "✕", action: () => { if (activeTab) closeTab(activeTab); }, shortcut: "⌘W" },
    ...files.map(f => ({ label: f.file_name, icon: FILE_ICONS[f.language] || FILE_ICONS.default, action: () => openFile(f), shortcut: "" })),
  ].filter(c => commandQuery === "" || c.label.toLowerCase().includes(commandQuery.toLowerCase()));

  // ── File tree builder ──────────────────────────────────────────────────────
  function buildTree(files) {
    const tree = {};
    files.forEach(f => {
      const parts = (f.file_path || `/${f.file_name}`).split("/").filter(Boolean);
      let node = tree;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) node[part] = { _file: f };
        else { node[part] = node[part] || {}; node = node[part]; }
      });
    });
    return tree;
  }

  const fileTree = buildTree(files);
  const filteredFiles = searchQuery ? files.filter(f => f.file_name.toLowerCase().includes(searchQuery.toLowerCase())) : null;

  const ext = activeTab?.language || activeTab?.file_name?.split(".").pop() || "tsx";
  const highlighted = editorContent ? highlight(editorContent, ext) : "";

  return (
    <div className="h-screen flex flex-col bg-[#0c0c10] text-white overflow-hidden select-none" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>

      {/* ── Command Palette ── */}
      {commandPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCommandPalette(false)} />
          <div className="relative w-full max-w-xl mx-4 bg-[#141418] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={cmdRef}
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                placeholder="Type a command or file name..."
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder-zinc-600"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              />
              <kbd className="text-xs bg-white/5 text-zinc-600 px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-1.5">
              {commands.slice(0, 12).map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => { cmd.action(); setCommandPalette(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left group"
                >
                  <span className="text-base w-5 flex-shrink-0">{cmd.icon}</span>
                  <span className="flex-1 text-sm text-zinc-300" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>{cmd.label}</span>
                  {cmd.shortcut && <kbd className="text-xs text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{cmd.shortcut}</kbd>}
                </button>
              ))}
              {commands.length === 0 && (
                <p className="text-center text-sm text-zinc-600 py-6">No results for "{commandQuery}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Toolbar ── */}
      <div className="h-10 bg-[#0f0f14] border-b border-white/5 flex items-center px-3 gap-1 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-3">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        </div>

        {/* Menu items */}
        {["File", "Edit", "View", "Run", "Terminal", "Help"].map(m => (
          <button key={m} className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>
            {m}
          </button>
        ))}

        <div className="flex-1" />

        {/* Project selector */}
        <div className="relative">
          <button
            onClick={() => setProjectExpanded(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/8 border border-white/8 rounded-lg text-zinc-400 transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {project?.name || "Demo Project"}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="w-px h-4 bg-white/8 mx-1" />

        {/* Action buttons */}
        <ToolbarBtn icon="M5 3l14 9-14 9V3z" label="Run" color="emerald" onClick={() => { setTerminalOpen(true); addTerminalLine({ type: "info", text: "$ npm run dev" }); setTimeout(() => addTerminalLine({ type: "success", text: "  ➜  Local: http://localhost:5173/" }), 500); }} />
        <ToolbarBtn icon="M13 10V3L4 14h7v7l9-11h-7z" label="Deploy" color="violet" onClick={() => addTerminalLine({ type: "success", text: "✓ Deploying to production..." })} />
        <ToolbarBtn icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" label="Settings" onClick={() => {}} />

        <div className="w-px h-4 bg-white/8 mx-1" />

        {/* Command palette button */}
        <button
          onClick={() => { setCommandPalette(true); setCommandQuery(""); }}
          className="flex items-center gap-2 px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-400 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>⌘K</span>
        </button>

        {/* Avatar */}
        <div className="ml-2 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
          E
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Activity Bar ── */}
        <div className="w-11 bg-[#0f0f14] border-r border-white/5 flex flex-col items-center py-2 gap-1 flex-shrink-0">
          {[
            { id: "explorer", icon: "M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" },
            { id: "search", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
            { id: "git", icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" },
            { id: "extensions", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSidebarTab(item.id)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${sidebarTab === item.id ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"}`}
            >
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={item.icon} />
              </svg>
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => window.location.href = "/dashboard"} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-all">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>

        {/* ── Left Sidebar ── */}
        <div className="bg-[#0f0f14] border-r border-white/5 flex flex-col flex-shrink-0 overflow-hidden" style={{ width: sidebarWidth }}>
          {sidebarTab === "explorer" && (
            <>
              <div className="px-3 pt-3 pb-2 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase" style={{ fontFamily: "system-ui, sans-serif" }}>Explorer</span>
                  <div className="flex gap-1">
                    {[
                      "M12 4v16m8-8H4",
                      "M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
                    ].map((d, i) => (
                      <button key={i} className="w-5 h-5 flex items-center justify-center text-zinc-700 hover:text-zinc-400 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto text-xs">
                <FileTreeNode
                  name={project?.name || "devforge-app"}
                  tree={fileTree}
                  depth={0}
                  expanded={fileTreeExpanded}
                  setExpanded={setFileTreeExpanded}
                  onOpen={openFile}
                  activeFile={activeTab}
                />
              </div>
            </>
          )}

          {sidebarTab === "search" && (
            <div className="p-3 flex-1 overflow-y-auto">
              <p className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-2" style={{ fontFamily: "system-ui, sans-serif" }}>Search</p>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-violet-500/50 placeholder-zinc-700 mb-2"
              />
              {filteredFiles && filteredFiles.map(f => (
                <button
                  key={f.id}
                  onClick={() => openFile(f)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
                >
                  <span>{FILE_ICONS[f.language] || "📄"}</span>
                  <span className="truncate">{f.file_name}</span>
                </button>
              ))}
            </div>
          )}

          {sidebarTab === "git" && (
            <div className="p-3">
              <p className="text-[10px] font-semibold tracking-widest text-zinc-600 uppercase mb-3" style={{ fontFamily: "system-ui, sans-serif" }}>Source Control</p>
              <div className="space-y-1">
                {files.map(f => (
                  <div key={f.id} className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-500">
                    <span className="text-amber-400 w-3">M</span>
                    <span className="truncate">{f.file_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Resize handle: sidebar ── */}
        <div
          onMouseDown={startResizeSidebar}
          className={`w-1 cursor-col-resize hover:bg-violet-500/40 transition-colors flex-shrink-0 ${isResizingSidebar ? "bg-violet-500/60" : "bg-transparent"}`}
        />

        {/* ── Editor + Terminal ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="h-9 bg-[#0f0f14] border-b border-white/5 flex items-end overflow-x-auto flex-shrink-0 scrollbar-none">
            {openTabs.map(tab => {
              const isActive = activeTab?.id === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab); setEditorContent(tab.content || ""); updateLineNumbers(tab.content || ""); setDiffMode(false); }}
                  className={`group flex items-center gap-2 px-4 h-full text-xs border-r border-white/5 transition-all flex-shrink-0 ${isActive ? "bg-[#0c0c10] text-zinc-200 border-t border-t-violet-500" : "bg-[#0f0f14] text-zinc-600 hover:text-zinc-400 hover:bg-[#0c0c10]/50"}`}
                >
                  <span className="flex-shrink-0">{FILE_ICONS[tab.language] || "📄"}</span>
                  <span>{tab.file_name}</span>
                  <span
                    onClick={e => closeTab(tab, e)}
                    className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center hover:bg-white/10 transition-opacity ${isActive ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-60"}`}
                  >
                    ×
                  </span>
                </button>
              );
            })}
            {openTabs.length === 0 && (
              <div className="px-4 h-full flex items-center text-xs text-zinc-700">No files open</div>
            )}
          </div>

          {/* ── Editor Area ── */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* Diff banner */}
            {diffMode && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-950/30 border-b border-amber-500/20 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-300 font-medium" style={{ fontFamily: "system-ui, sans-serif" }}>AI suggested changes</span>
                <div className="flex-1" />
                <button onClick={applyDiff} className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-md text-white font-medium transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>Accept</button>
                <button onClick={rejectDiff} className="px-3 py-1 text-xs bg-white/5 hover:bg-white/8 rounded-md text-zinc-400 transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>Reject</button>
              </div>
            )}

            {activeTab ? (
              <div className="flex-1 overflow-auto flex" ref={editorRef}>
                {/* Line numbers */}
                <div className="flex-shrink-0 bg-[#0c0c10] select-none pt-3 pb-3 pr-3 pl-4 text-right"
                  style={{ minWidth: `${String(lineNumbers.length).length * 8 + 24}px` }}>
                  {lineNumbers.map(n => (
                    <div key={n} className="text-zinc-700 leading-6 text-xs hover:text-zinc-500 cursor-pointer">{n}</div>
                  ))}
                </div>

                {/* Code */}
                <div className="flex-1 relative overflow-auto">
                  {diffMode ? (
                    <div className="flex h-full">
                      {/* Before */}
                      <div className="flex-1 overflow-auto border-r border-white/5">
                        <div className="px-2 py-1 text-xs text-zinc-600 border-b border-white/5 bg-red-950/10" style={{ fontFamily: "system-ui, sans-serif" }}>Before</div>
                        <pre className="p-4 text-xs leading-6 text-zinc-500"
                          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}
                          dangerouslySetInnerHTML={{ __html: highlight(activeTab.content || "", ext) }}
                        />
                      </div>
                      {/* After */}
                      <div className="flex-1 overflow-auto">
                        <div className="px-2 py-1 text-xs text-zinc-600 border-b border-white/5 bg-emerald-950/10" style={{ fontFamily: "system-ui, sans-serif" }}>After (AI)</div>
                        <pre className="p-4 text-xs leading-6 text-emerald-300/80"
                          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}
                          dangerouslySetInnerHTML={{ __html: highlight(diffContent || "", ext) }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Inline suggestion overlay */}
                      {inlineSuggestion && (
                        <div
                          className="absolute top-3 left-4 text-zinc-600 text-xs pointer-events-none z-10 italic"
                          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", lineHeight: "24px", marginTop: "24px" }}
                        >
                          {inlineSuggestion}
                        </div>
                      )}
                      <pre
                        className="p-4 text-xs leading-6 cursor-text"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", tabSize: 2 }}
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                        onClick={e => {
                          // Simulate cursor tracking
                          const rect = e.currentTarget.getBoundingClientRect();
                          const lineH = 24;
                          const line = Math.floor((e.clientY - rect.top) / lineH) + 1;
                          setCursorPos({ line, col: 1 });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-500 font-medium mb-1" style={{ fontFamily: "system-ui, sans-serif" }}>No file open</p>
                  <p className="text-zinc-700 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>Select a file from the explorer or press <kbd className="text-xs bg-white/5 px-1.5 py-0.5 rounded">⌘K</kbd></p>
                </div>
              </div>
            )}
          </div>

          {/* ── Terminal resize handle ── */}
          {terminalOpen && (
            <div
              onMouseDown={startResizeTerminal}
              className={`h-1 cursor-row-resize hover:bg-violet-500/40 transition-colors flex-shrink-0 ${isResizingTerminal ? "bg-violet-500/60" : "bg-transparent border-t border-white/5"}`}
            />
          )}

          {/* ── Terminal ── */}
          {terminalOpen && (
            <div className="bg-[#080810] border-t border-white/5 flex flex-col flex-shrink-0" style={{ height: terminalHeight }}>
              <div className="flex items-center px-3 py-1.5 border-b border-white/5 flex-shrink-0">
                <div className="flex gap-1 mr-3">
                  {["TERMINAL", "OUTPUT", "PROBLEMS"].map(t => (
                    <button key={t} className={`text-[10px] px-2.5 py-1 rounded font-medium transition-colors ${t === "TERMINAL" ? "text-zinc-300 bg-white/8" : "text-zinc-600 hover:text-zinc-400"}`} style={{ fontFamily: "system-ui, sans-serif" }}>{t}</button>
                  ))}
                </div>
                <div className="flex-1" />
                <button onClick={() => setTerminalOpen(false)} className="text-zinc-700 hover:text-zinc-400 p-1 rounded transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 text-xs space-y-0.5">
                {terminalLines.map((line, i) => (
                  <div key={i} className={`leading-5 ${line.type === "success" ? "text-emerald-400" : line.type === "info" ? "text-zinc-300" : "text-zinc-600"}`}>
                    {line.text}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 pb-2 flex-shrink-0">
                <span className="text-emerald-400 text-xs">➜</span>
                <span className="text-violet-400 text-xs">~/project</span>
                <input
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && terminalInput.trim()) runTerminalCommand(terminalInput.trim()); }}
                  placeholder="run a command..."
                  className="flex-1 bg-transparent text-xs focus:outline-none placeholder-zinc-800 text-zinc-300"
                />
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="h-6 bg-violet-900/30 border-t border-violet-500/20 flex items-center px-3 gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] text-violet-300/70">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
              </svg>
              main
            </div>
            <div className="text-[10px] text-zinc-600">Ln {cursorPos.line}, Col {cursorPos.col}</div>
            <div className="text-[10px] text-zinc-600">{ext.toUpperCase()}</div>
            <div className="flex-1" />
            <div className="text-[10px] text-zinc-600">UTF-8</div>
            <div className="text-[10px] text-zinc-600">LF</div>
            <button
              onClick={() => setTerminalOpen(p => !p)}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
              </svg>
              Terminal
            </button>
          </div>
        </div>

        {/* ── Resize handle: AI panel ── */}
        <div
          onMouseDown={startResizeAI}
          className={`w-1 cursor-col-resize hover:bg-violet-500/40 transition-colors flex-shrink-0 ${isResizingAI ? "bg-violet-500/60" : "bg-transparent"}`}
        />

        {/* ── AI Panel ── */}
        <div className="bg-[#0f0f14] border-l border-white/5 flex flex-col flex-shrink-0" style={{ width: aiPanelWidth }}>
          {/* Header */}
          <div className="h-9 border-b border-white/5 flex items-center px-4 gap-2 flex-shrink-0">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-zinc-400" style={{ fontFamily: "system-ui, sans-serif" }}>DevForge AI</span>
            <div className="flex-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-zinc-700" style={{ fontFamily: "system-ui, sans-serif" }}>GPT-4o</span>
          </div>

          {/* Context chip */}
          {activeTab && (
            <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                <span className="text-xs">{FILE_ICONS[activeTab.language] || "📄"}</span>
                <span className="text-xs text-zinc-400 truncate flex-1" style={{ fontFamily: "system-ui, sans-serif" }}>{activeTab.file_name}</span>
                <span className="text-[10px] text-zinc-700 bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded" style={{ fontFamily: "system-ui, sans-serif" }}>context</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <p className="text-xs text-zinc-500 mb-1" style={{ fontFamily: "system-ui, sans-serif" }}>AI coding assistant ready</p>
                <p className="text-xs text-zinc-700" style={{ fontFamily: "system-ui, sans-serif" }}>Ask me to build, fix, or explain code.</p>
                <div className="mt-4 space-y-1.5">
                  {["Build a REST API", "Fix this bug", "Refactor for performance", "Add TypeScript types"].map(s => (
                    <button
                      key={s}
                      onClick={() => { setAiInput(s); }}
                      className="w-full text-left text-xs text-zinc-600 hover:text-zinc-400 hover:bg-white/5 px-2.5 py-1.5 rounded-lg transition-colors"
                      style={{ fontFamily: "system-ui, sans-serif" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <AIChatMessage key={msg.id} message={msg} />
            ))}

            {sending && (
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2 flex gap-1.5 items-center">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={aiEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 flex-shrink-0">
            <div className="bg-white/5 border border-white/8 rounded-xl focus-within:border-violet-500/40 transition-all">
              <textarea
                ref={textareaRef}
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); }
                }}
                placeholder="Ask AI to build, fix, or explain..."
                rows={3}
                className="w-full bg-transparent px-3 pt-3 text-xs focus:outline-none placeholder-zinc-700 resize-none text-zinc-200"
                style={{ fontFamily: "system-ui, sans-serif" }}
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <div className="flex gap-1">
                  {["@file", "@docs", "#fix"].map(tag => (
                    <button key={tag} className="text-[10px] bg-white/5 text-zinc-600 hover:text-zinc-400 px-1.5 py-0.5 rounded transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>
                      {tag}
                    </button>
                  ))}
                </div>
                <button
                  onClick={sendAI}
                  disabled={!aiInput.trim() || sending}
                  className="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-700 flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ToolbarBtn({ icon, label, color = "zinc", onClick }) {
  const colors = {
    emerald: "hover:text-emerald-400",
    violet: "hover:text-violet-400",
    zinc: "hover:text-zinc-300",
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 ${colors[color]} hover:bg-white/5 transition-all`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
      </svg>
    </button>
  );
}

function FileTreeNode({ name, tree, depth, expanded, setExpanded, onOpen, activeFile }) {
  const isExpanded = expanded[name] !== false;
  const hasChildren = Object.keys(tree).some(k => !k.startsWith("_"));
  const fileEntry = tree._file;

  if (fileEntry) {
    const ext = fileEntry.language || fileEntry.file_name?.split(".").pop() || "default";
    const isActive = activeFile?.id === fileEntry.id;
    return (
      <button
        onClick={() => onOpen(fileEntry)}
        className={`w-full flex items-center gap-1.5 py-0.5 pr-2 text-xs transition-colors ${isActive ? "bg-violet-600/15 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="text-sm w-4 flex-shrink-0" style={{ fontSize: "13px" }}>{FILE_ICONS[ext] || FILE_ICONS.default}</span>
        <span className="truncate">{name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(p => ({ ...p, [name]: !isExpanded }))}
        className="w-full flex items-center gap-1.5 py-0.5 pr-2 text-xs text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-3.5 h-3.5 flex-shrink-0 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        <span className="truncate">{name}</span>
      </button>
      {isExpanded && (
        <div>
          {Object.entries(tree).filter(([k]) => k !== "_file").map(([k, v]) => (
            <FileTreeNode
              key={k}
              name={k}
              tree={v}
              depth={depth + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              onOpen={onOpen}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AIChatMessage({ message }) {
  const isUser = message.role === "user";
  const parts = parseMessageParts(message.content);
  const [copiedIdx, setCopiedIdx] = useState(null);

  function copyCode(code, idx) {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold ${isUser ? "bg-zinc-700 text-zinc-400" : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"}`}>
        {isUser ? "U" : "AI"}
      </div>
      <div className={`flex-1 space-y-1.5 ${isUser ? "items-end flex flex-col" : ""}`}>
        {parts.map((part, i) => (
          part.type === "code" ? (
            <div key={i} className="w-full rounded-lg overflow-hidden border border-white/8 bg-[#0c0c10]">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                <span className="text-[10px] text-zinc-600 font-mono">{part.language}</span>
                <button onClick={() => copyCode(part.code, i)} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>
                  {copiedIdx === i ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="p-3 text-[11px] leading-5 overflow-x-auto text-zinc-300"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                dangerouslySetInnerHTML={{ __html: highlight(part.code, part.language) }}
              />
            </div>
          ) : (
            <div key={i} className={`text-xs leading-relaxed rounded-xl px-3 py-2 max-w-full ${isUser ? "bg-violet-600/20 text-zinc-200 border border-violet-500/20" : "bg-white/5 text-zinc-400"}`} style={{ fontFamily: "system-ui, sans-serif" }}>
              {part.content}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function parseMessageParts(content) {
  const parts = [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: content.slice(last, m.index).trim() });
    parts.push({ type: "code", language: m[1] || "code", code: m[2] });
    last = m.index + m[0].length;
  }
  if (last < content.length) parts.push({ type: "text", content: content.slice(last).trim() });
  return parts.filter(p => p.type === "code" || p.content);
}
