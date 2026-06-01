import { useNavigate } from "react-router-dom";
import { useState } from "react";

const FEATURES = [
  {
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    title: "AI Coding Agent",
    desc: "Describe what you want to build. DevForge AI writes the code, structures the project, and explains every decision.",
    color: "violet",
  },
  {
    icon: "M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
    title: "Smart File System",
    desc: "Automatically organizes your generated files into a clean, navigable project structure with full version history.",
    color: "blue",
  },
  {
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Multi-Language Support",
    desc: "React, Node.js, Python, Go, Rust — DevForge AI builds in whatever stack you prefer.",
    color: "emerald",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Team Collaboration",
    desc: "Invite teammates, share projects, assign roles, and build together — all in one workspace.",
    color: "amber",
  },
];

const colorMap = {
  violet: "from-violet-600/20 to-violet-600/5 border-violet-500/20 text-violet-400",
  blue: "from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400",
  emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
  amber: "from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400",
};

export default function Home() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-800/8 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight">DevForge <span className="text-violet-400">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5">Features</a>
          <a href="#pricing" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5">Pricing</a>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-zinc-300 hover:text-white px-3 py-1.5 transition-colors">
            Sign In
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-4 py-2 rounded-full mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Now in public beta — try it free
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Your AI Agent
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
            Builds Code
          </span>
          <br />
          For You.
        </h1>

        <p className="text-zinc-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Describe what you want — an app, website, API, script, or automation. DevForge AI writes it, structures it, and delivers production-ready code.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-8px_rgb(139,92,246,0.6)]"
          >
            Start Building Free →
          </button>
          <button
            onClick={() => navigate("/workspace")}
            className="px-6 py-3.5 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl text-sm font-medium transition-colors text-zinc-300"
          >
            View Demo
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-16 text-center">
          {[
            { value: "10M+", label: "Lines generated" },
            { value: "50K+", label: "Developers" },
            { value: "99.9%", label: "Uptime" },
            { value: "4.9★", label: "User rating" },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Terminal preview */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 mb-24">
        <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0d0d14] shadow-2xl">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-zinc-600 ml-2">devforge-workspace — project-1</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs">👤</span>
              </div>
              <div className="bg-white/5 rounded-2xl px-4 py-3 text-sm text-zinc-300 border border-white/5">
                Build a SaaS dashboard with React and Tailwind. Include stats cards, a data table, and a sidebar navigation.
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div className="flex-1 space-y-3">
                <div className="bg-white/5 rounded-2xl px-4 py-3 text-sm text-zinc-300 border border-white/5">
                  On it. I'll scaffold the full dashboard structure with all components.
                </div>
                <div className="rounded-xl overflow-hidden border border-white/8 bg-[#0a0a0f]">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-xs text-zinc-500 font-mono">tsx</span>
                    <span className="text-xs text-emerald-400">✓ Generated</span>
                  </div>
                  <pre className="p-4 text-xs text-zinc-400 font-mono leading-relaxed overflow-hidden max-h-32">
{`export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <StatsGrid />
        <DataTable />
      </main>
    </div>
  );
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything you need to ship faster</h2>
          <p className="text-zinc-600">Built for developers who want to move fast without cutting corners.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`p-6 rounded-2xl border bg-gradient-to-br transition-all ${colorMap[f.color]} ${hoveredFeature === i ? "scale-[1.01]" : ""}`}
            >
              <svg className="w-6 h-6 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
              </svg>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="relative z-10 max-w-5xl mx-auto px-6 mb-24 text-center">
        <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
        <p className="text-zinc-600 mb-10">Start free, scale as you build.</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { name: "Starter", price: "Free", desc: "For individuals getting started", color: "zinc" },
            { name: "Pro", price: "$29/mo", desc: "For serious builders", color: "violet", popular: true },
            { name: "Team", price: "$99/mo", desc: "For dev teams", color: "blue" },
          ].map(plan => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl border w-52 ${plan.color === "violet" ? "border-violet-500/40 bg-violet-950/20 shadow-[0_0_40px_-8px_rgb(139,92,246,0.25)]" : "border-white/8 bg-white/[0.02]"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs bg-violet-600 text-white px-3 py-1 rounded-full">Popular</span>
                </div>
              )}
              <p className="font-bold text-sm mb-1">{plan.name}</p>
              <p className="text-2xl font-bold mb-1">{plan.price}</p>
              <p className="text-xs text-zinc-600 mb-4">{plan.desc}</p>
              <button
                onClick={() => navigate("/billing")}
                className={`w-full py-2 text-xs rounded-xl font-medium transition-colors ${plan.color === "violet" ? "bg-violet-600 hover:bg-violet-500 text-white" : "bg-white/8 text-zinc-300 hover:bg-white/12"}`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 mb-24 text-center">
        <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-indigo-950/20 p-12">
          <h2 className="text-3xl font-bold mb-3">Ready to build faster?</h2>
          <p className="text-zinc-500 mb-8">Join 50,000+ developers using DevForge AI to ship production-ready code.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02] shadow-[0_0_40px_-8px_rgb(139,92,246,0.5)]"
          >
            Start Building Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-zinc-600">DevForge AI</span>
        </div>
        <p className="text-xs text-zinc-700">© 2025 DevForge AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
