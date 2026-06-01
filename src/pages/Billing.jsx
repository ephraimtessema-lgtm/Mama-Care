import { useState, useEffect } from "react";
import { Subscription } from "@/api/entities";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    period: "forever",
    description: "Try DevForge AI for free",
    tokens: 50000,
    projects: 3,
    features: [
      "50K tokens / month",
      "3 active projects",
      "Basic AI coding agent",
      "File export",
      "Community support",
    ],
    cta: "Current Plan",
    color: "zinc",
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    period: "month",
    description: "For individual developers",
    tokens: 2000000,
    projects: 50,
    features: [
      "2M tokens / month",
      "50 active projects",
      "Advanced AI models (GPT-4, Claude)",
      "Full file system access",
      "Git integration (coming soon)",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    color: "violet",
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    price: 99,
    period: "month",
    description: "For small dev teams",
    tokens: 10000000,
    projects: 200,
    features: [
      "10M tokens / month",
      "Unlimited projects",
      "All Pro features",
      "Up to 10 team members",
      "Shared workspaces",
      "Usage analytics",
      "Dedicated support",
    ],
    cta: "Upgrade to Team",
    color: "blue",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: null,
    description: "Custom for large orgs",
    tokens: null,
    projects: null,
    features: [
      "Custom token limits",
      "Unlimited team members",
      "Custom AI model fine-tuning",
      "SSO / SAML",
      "SLA guarantee",
      "On-prem deployment option",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    color: "amber",
  },
];

const planColors = {
  zinc: { border: "border-white/10", bg: "bg-white/[0.02]", badge: "", button: "bg-white/10 text-zinc-300 hover:bg-white/15", glow: "" },
  violet: { border: "border-violet-500/40", bg: "bg-violet-950/20", badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30", button: "bg-violet-600 text-white hover:bg-violet-500", glow: "shadow-[0_0_40px_-8px_rgb(139,92,246,0.3)]" },
  blue: { border: "border-blue-500/30", bg: "bg-blue-950/10", badge: "", button: "bg-blue-600 text-white hover:bg-blue-500", glow: "" },
  amber: { border: "border-amber-500/30", bg: "bg-amber-950/10", badge: "", button: "bg-amber-600 text-white hover:bg-amber-500", glow: "" },
};

export default function Billing() {
  const [subscription, setSubscription] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const subs = await Subscription.list();
      setSubscription(subs[0] || { plan: "free", tokens_used_this_month: 0, tokens_limit: 50000, status: "active" });
    } finally {
      setLoading(false);
    }
  }

  const usagePercent = subscription
    ? Math.min(100, Math.round((subscription.tokens_used_this_month / subscription.tokens_limit) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
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
            { icon: "users", label: "Team", href: "/team" },
            { icon: "credit-card", label: "Billing", href: "/billing", active: true },
            { icon: "settings", label: "Settings", href: "/settings" },
          ].map(item => (
            <a key={item.label} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${item.active ? "bg-violet-600/20 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}>
              <NavIcon name={item.icon} />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Billing & Plans</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your subscription and usage.</p>
          </div>

          {/* Current Usage */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-zinc-500">Current Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-xl font-bold capitalize">{subscription?.plan || "Free"}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${subscription?.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {subscription?.status || "Active"}
                  </span>
                </div>
              </div>
              {subscription?.billing_period_end && (
                <div className="text-right">
                  <p className="text-xs text-zinc-600">Renews on</p>
                  <p className="text-sm text-zinc-300">{new Date(subscription.billing_period_end).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                  <span>Token usage this month</span>
                  <span>{usagePercent}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-violet-500"}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  {(subscription?.tokens_used_this_month || 0).toLocaleString()} / {(subscription?.tokens_limit || 50000).toLocaleString()} tokens
                </p>
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                  <span>Projects</span>
                  <span>{subscription?.projects_used || 0} / {subscription?.projects_limit || 3}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(100, ((subscription?.projects_used || 0) / (subscription?.projects_limit || 3)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold">Choose a Plan</h2>
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {["monthly", "yearly"].map(p => (
                <button
                  key={p}
                  onClick={() => setBillingPeriod(p)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${billingPeriod === p ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {p}
                  {p === "yearly" && <span className="ml-1 text-emerald-400">−20%</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-4 gap-4">
            {PLANS.map(plan => {
              const colors = planColors[plan.color];
              const isCurrent = subscription?.plan === plan.id;
              const displayPrice = plan.price === null ? null : billingPeriod === "yearly" ? Math.round(plan.price * 0.8) : plan.price;

              return (
                <div key={plan.id} className={`relative rounded-2xl border p-5 flex flex-col ${colors.border} ${colors.bg} ${colors.glow}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs bg-violet-600 text-white px-3 py-1 rounded-full font-medium">Most Popular</span>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-bold text-sm">{plan.name}</h3>
                    <p className="text-xs text-zinc-600 mt-0.5">{plan.description}</p>
                  </div>
                  <div className="mb-5">
                    {displayPrice === null ? (
                      <p className="text-2xl font-bold">Custom</p>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold">${displayPrice}</span>
                        {plan.period && <span className="text-xs text-zinc-600 mb-1">/{plan.period}</span>}
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                        <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent}
                    className={`w-full py-2.5 text-xs font-medium rounded-xl transition-colors ${isCurrent ? "bg-white/5 text-zinc-600 cursor-default" : colors.button}`}
                  >
                    {isCurrent ? "Current Plan" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Invoice section */}
          <div className="mt-8 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
            <h3 className="font-semibold text-sm mb-4">Billing History</h3>
            <div className="text-center py-8">
              <p className="text-zinc-600 text-sm">No invoices yet. Upgrade to a paid plan to see your billing history.</p>
            </div>
          </div>
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
