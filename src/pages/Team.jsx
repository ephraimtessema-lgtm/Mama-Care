import { useState, useEffect } from "react";
import { Team as TeamEntity } from "@/api/entities";
import { getCurrentUser } from "@/api/auth";

const ROLES = ["owner", "admin", "member", "viewer"];
const roleColors = {
  owner: "bg-amber-500/20 text-amber-300",
  admin: "bg-violet-500/20 text-violet-300",
  member: "bg-blue-500/20 text-blue-300",
  viewer: "bg-zinc-500/20 text-zinc-400",
};

export default function Team() {
  const [team, setTeam] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      const teams = await TeamEntity.list();
      setTeam(teams[0] || null);
    } finally {
      setLoading(false);
    }
  }

  async function createTeam() {
    const currentUser = await getCurrentUser();
    const newTeam = await TeamEntity.create({
      user_id: currentUser.id,
      name: "My Team",
      members: [],
      plan: "team",
      seats_used: 1,
      seats_limit: 10,
    });
    setTeam(newTeam);
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !team) return;
    const newMember = {
      email: inviteEmail,
      role: inviteRole,
      joined_at: new Date().toISOString(),
    };
    const updatedMembers = [...(team.members || []), newMember];
    const updated = await TeamEntity.update(team.id, { members: updatedMembers, seats_used: updatedMembers.length + 1 });
    setTeam(updated);
    setInviteEmail("");
    setShowInvite(false);
  }

  async function removeMember(email) {
    if (!team) return;
    const updatedMembers = team.members.filter(m => m.email !== email);
    const updated = await TeamEntity.update(team.id, { members: updatedMembers, seats_used: updatedMembers.length + 1 });
    setTeam(updated);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <aside className="w-64 bg-[#0d0d14] border-r border-white/5 flex flex-col fixed h-full">
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
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { icon: "grid", label: "Dashboard", href: "/dashboard" },
            { icon: "folder", label: "Projects", href: "/dashboard" },
            { icon: "clock", label: "History", href: "/history" },
            { icon: "users", label: "Team", href: "/team", active: true },
            { icon: "credit-card", label: "Billing", href: "/billing" },
            { icon: "settings", label: "Settings", href: "/settings" },
          ].map(item => (
            <a key={item.label} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${item.active ? "bg-violet-600/20 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}>
              <NavIcon name={item.icon} />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Team</h1>
              <p className="text-zinc-500 text-sm mt-1">Collaborate with your teammates on projects.</p>
            </div>
            {team && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Invite Member
              </button>
            )}
          </div>

          {!team ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-zinc-400 font-medium mb-1">No team yet</p>
              <p className="text-zinc-600 text-sm mb-6">Create a team workspace to collaborate with others.</p>
              <button onClick={createTeam} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors">
                Create Team
              </button>
            </div>
          ) : (
            <>
              {/* Team header */}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg font-bold">
                    {team.name?.[0] || "T"}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold">{team.name}</h2>
                    <p className="text-sm text-zinc-500">{(team.seats_used || 1)} of {team.seats_limit} seats used</p>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full capitalize">
                    {team.plan} Plan
                  </span>
                </div>
                {/* Seats bar */}
                <div className="mt-4">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((team.seats_used || 1) / team.seats_limit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="font-semibold text-sm">Members</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {/* Owner row */}
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      Y
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">You</p>
                      <p className="text-xs text-zinc-600">Account owner</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${roleColors["owner"]}`}>owner</span>
                  </div>

                  {(team.members || []).map(member => (
                    <div key={member.email} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02]">
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {member.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-300">{member.email}</p>
                        <p className="text-xs text-zinc-600">Invited {new Date(member.joined_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${roleColors[member.role] || roleColors.member}`}>{member.role}</span>
                      <button onClick={() => removeMember(member.email)} className="text-zinc-700 hover:text-red-400 transition-colors ml-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {team.members?.length === 0 && (
                    <div className="px-6 py-8 text-center">
                      <p className="text-zinc-600 text-sm">No team members yet. Invite someone to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Invite modal */}
          {showInvite && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold">Invite Team Member</h3>
                  <button onClick={() => setShowInvite(false)} className="text-zinc-600 hover:text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5">Email address</label>
                    <input
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1.5">Role</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["admin", "member", "viewer"].map(r => (
                        <button
                          key={r}
                          onClick={() => setInviteRole(r)}
                          className={`py-2 text-xs rounded-lg capitalize font-medium transition-colors ${inviteRole === r ? "bg-violet-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/8"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={inviteMember}
                    disabled={!inviteEmail.trim()}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl text-sm font-medium transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavIcon({ name }) {
  const icons = {
    grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    folder: "M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    "credit-card": "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  };
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icons[name]} />
    </svg>
  );
}