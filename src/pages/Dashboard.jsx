import { useState, useEffect } from "react";
import { Project } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";

const planColors = {
  free: "text-zinc-400",
  pro: "text-violet-400",
  team: "text-blue-400",
  enterprise: "text-amber-400",
};

const planBadge = {
  free: "bg-zinc-800 text-zinc-300",
  pro: "bg-violet-900/50 text-violet-300 border border-violet-700/50",
  team: "bg-blue-900/50 text-blue-300 border border-blue-700/50",
  enterprise: "bg-amber-900/50 text-amber-300 border border-amber-700/50",
};

const statusDot = {
  active: "bg-emerald-400",
  building: "bg-violet-400 animate-pulse",
  archived: "bg-zinc-600",
};

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectList, subList, userList] = await Promise.all([
        Project.list(),
        Subscription.list(),
        User.me().catch(() => null),
      ]);
      setProjects(projectList);
      setSubscription(subList[0] || { plan: "free", tokens_used_this_month: 0, tokens_limit: 50000, projects_used: projectList.length, projects_limit: 3 });
      setUser(userList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    const newProject = await Project.create({
      user_id: user?.id,
      name: "Untitled Project",
      description: "A new project",
      status: "active",
    });
    navigate(`/workspace?project=${newProject.id}`);
  }

  const filtered = projects.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const usagePercent = subscription
    ? Math.min(100, Math.round((subscription.tokens_used_this_month / subscription.tokens_limit) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d14] border-r border-white/5 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">DevForge <span className="text-violet-400">AI</span></span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem icon="grid" label="Dashboard" active href="/dashboard" />
          <NavItem icon="folder" label="Projects" href="/dashboard" />
          <NavItem icon="clock" label="History" href="/history" />
          <NavItem icon="users" label="Team" href="/team" />
          <NavItem icon="credit-card" label="Billing" href="/billing" />
          <NavItem icon="settings" label="Settings" href="/settings" />
        </nav>

        {/* Plan badge */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className={`text-xs font-medium px-3 py-2 rounded-lg ${planBadge[subscription?.plan || "free"]} mb-3`}>
            {(subscription?.plan || "free").toUpperCase()} PLAN
          </div>
          {/* Usage bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Token usage</span>
              <span>{usagePercent}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-violet-500"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600">
              {(subscription?.tokens_used_this_month || 0).toLocaleString()} / {(subscription?.tokens_limit || 50000).toLocaleString()} tokens
            </p>
          </div>
        </div>

        {/* User */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/8 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
              {user?.full_name?.[0] || user?.email?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name || user?.email || "User"}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Build, iterate, and deploy with AI.</p>
          </div>
          <button
            onClick={createProject}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Projects" value={projects.length} icon="folder" color="violet" />
          <StatCard label="Active Builds" value={projects.filter(p => p.status === "building").length} icon="zap" color="emerald" />
          <StatCard label="Tokens Used" value={(subscription?.tokens_used_this_month || 0).toLocaleString()} icon="cpu" color="blue" />
          <StatCard label="Files Generated" value={projects.reduce((a, p) => a + (p.file_count || 0), 0)} icon="file" color="amber" />
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "building", "archived"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors capitalize ${filterStatus === s ? "bg-violet-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/8"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium mb-1">No projects yet</p>
            <p className="text-zinc-600 text-sm mb-5">Create your first project and let AI build it for you.</p>
            <button onClick={createProject} className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-xl font-medium transition-colors">
              Start Building
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} onOpen={() => navigate(`/workspace?project=${project.id}`)} />
            ))}
            {/* New project card */}
            <button
              onClick={createProject}
              className="h-48 rounded-2xl border-2 border-dashed border-white/8 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-violet-500/50 hover:text-violet-400 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-violet-500/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium">New Project</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, href }) {
  const icons = {
    grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    folder: "M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    "credit-card": "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  };
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icons[icon]} />
      </svg>
      {label}
    </a>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    violet: "from-violet-600/20 to-violet-600/5 border-violet-500/20",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/20",
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/20",
    amber: "from-amber-600/20 to-amber-600/5 border-amber-500/20",
  };
  const iconColors = {
    violet: "text-violet-400", emerald: "text-emerald-400", blue: "text-blue-400", amber: "text-amber-400",
  };
  const icons = {
    folder: "M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
    zap: "M13 10V3L4 14h7v7l9-11h-7z",
    cpu: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
    file: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colors[color]} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        <svg className={`w-4 h-4 ${iconColors[color]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icons[icon]} />
        </svg>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ProjectCard({ project, onOpen }) {
  const statusDot = {
    active: "bg-emerald-400",
    building: "bg-violet-400 animate-pulse",
    archived: "bg-zinc-600",
  };
  const statusLabel = {
    active: "Active",
    building: "Building",
    archived: "Archived",
  };
  const stacks = project.tech_stack || [];

  return (
    <div
      onClick={onOpen}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/8 hover:border-violet-500/30 hover:bg-white/5 p-5 cursor-pointer transition-all duration-200"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/0 to-indigo-600/0 group-hover:from-violet-600/5 group-hover:to-indigo-600/5 transition-all duration-300" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${statusDot[project.status] || "bg-zinc-600"}`} />
            <span className="text-xs text-zinc-500">{statusLabel[project.status] || "Unknown"}</span>
          </div>
        </div>

        <h3 className="font-semibold text-sm mb-1 truncate">{project.name}</h3>
        <p className="text-xs text-zinc-600 mb-4 line-clamp-2">{project.description || "No description"}</p>

        {stacks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {stacks.slice(0, 3).map(s => (
              <span key={s} className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded-md">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>{project.file_count || 0} files</span>
          <span>{project.last_activity ? new Date(project.last_activity).toLocaleDateString() : "—"}</span>
        </div>
      </div>
    </div>
  );
}
