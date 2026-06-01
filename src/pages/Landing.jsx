import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Clock, BookOpen, Calendar, MessageCircle, Star, ChevronRight, Phone } from "lucide-react";
import EthiopiaFlag from "@/components/EthiopiaFlag";
import SiteFooter from "@/components/SiteFooter";

const STATS = [
  { value: "24/7", label: "AI Support Available" },
  { value: "100%", label: "Anonymous & Private" },
  { value: "50+", label: "Verified OB-GYNs" },
  { value: "10K+", label: "Moms Supported" },
];

const FEATURES = [
  {
    icon: <MessageCircle className="w-7 h-7 text-rose-400" />,
    title: "Anonymous AI Chat",
    desc: "Ask any pregnancy question without revealing your identity. Use your 'Flower Name' for complete privacy.",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-100 dark:border-rose-900/50",
  },
  {
    icon: <Shield className="w-7 h-7 text-purple-400" />,
    title: "Trusted Medical AI",
    desc: "Our AI uses verified medical guidelines — not random internet results — to give you safe, accurate answers.",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-100 dark:border-purple-900/50",
  },
  {
    icon: <Clock className="w-7 h-7 text-blue-400" />,
    title: "Support at 2 AM",
    desc: "Pregnancy worries don't follow office hours. Get expert guidance any time, day or night.",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900/50",
  },
  {
    icon: <Calendar className="w-7 h-7 text-green-400" />,
    title: "Book Real Doctors",
    desc: "If you need a specialist, instantly book an appointment with verified OB-GYNs near you.",
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-100 dark:border-green-900/50",
  },
  {
    icon: <BookOpen className="w-7 h-7 text-yellow-500" />,
    title: "Pregnancy Library",
    desc: "Browse hundreds of curated pregnancy articles covering every trimester and topic.",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-100 dark:border-yellow-900/50",
  },
  {
    icon: <Heart className="w-7 h-7 text-pink-400" />,
    title: "Mother-to-Mother Chat",
    desc: "Real-time chat rooms where mothers support each other — by trimester, topic, or just general conversation.",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    border: "border-pink-100 dark:border-pink-900/50",
  },
];

const TESTIMONIALS = [
  { flower: "Blue Lily", text: "I was scared to ask my doctor about certain symptoms. Mama-Care gave me honest, calm answers at midnight. It saved my sanity!", week: "32 weeks" },
  { flower: "Desert Rose", text: "The anonymous chat feature made me feel safe. I finally got the answers I needed without embarrassment.", week: "18 weeks" },
  { flower: "Golden Dahlia", text: "I booked my OB-GYN through this app in minutes. The doctor was so understanding. Highly recommend!", week: "After delivery" },
];

function appLink(path, isAuthenticated) {
  return isAuthenticated ? path : `/login?redirect=${encodeURIComponent(path)}`;
}

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-full bg-white dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100">
      {/* Hero */}
      <section className="pt-10 pb-20 px-4 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800 text-sm px-4 py-1 rounded-full inline-flex items-center gap-2">
            <EthiopiaFlag />
            Designed for Ethiopian Mothers
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-50 mb-6 leading-tight">
            Your Safe Space for<br />
            <span className="text-rose-500 dark:text-rose-400">Pregnancy Support 🌸</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
            Ask anything — anonymously. Get accurate AI health advice powered by trusted medical guidelines. Book real doctors when you need more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={appLink("/chat", isAuthenticated)}>
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-8 text-base gap-2">
                <MessageCircle className="w-5 h-5" /> Chat with AI Now
              </Button>
            </Link>
            <Link to={appLink("/doctors", isAuthenticated)}>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300 px-8 text-base gap-2 hover:bg-rose-50 dark:hover:bg-gray-800 dark:bg-gray-900/50"
              >
                <Calendar className="w-5 h-5" /> Book a Doctor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-rose-500 dark:text-rose-400">{s.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-3">Everything You Need 💝</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">A complete care ecosystem built for every stage of your journey</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`${f.bg} rounded-2xl p-6 border ${f.border} shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-rose-900/10 transition-shadow`}
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="py-6 bg-red-500 dark:bg-red-900">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-lg">Emergency Red-Flag Detection</div>
              <div className="text-red-100 dark:text-red-200 text-sm">Our AI detects danger signs automatically and alerts you with emergency contacts</div>
            </div>
          </div>
          <a href="tel:8044">
            <Button className="bg-white text-red-500 hover:bg-red-50 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-gray-900 rounded-full gap-2 font-bold">
              <Phone className="w-4 h-4" /> Call pregnancy line: 8044
            </Button>
          </a>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-12">How It Works 🌼</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: "🌸", title: "Get Your Flower Name", desc: "Create an anonymous profile with a beautiful flower alias. No real name needed." },
              { step: "2", icon: "🤖", title: "Chat with AI", desc: "Ask any pregnancy question. Our AI searches verified medical documents for accurate answers." },
              { step: "3", icon: "🏥", title: "Book if Needed", desc: "If the AI recommends it — or you prefer — book a private appointment with a real OB-GYN." },
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-3xl mx-auto mb-4">{step.icon}</div>
                <div className="text-xs font-bold text-rose-400 dark:text-rose-300 mb-1">STEP {step.step}</div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-rose-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50 mb-12">Stories from Our Flowers 🌺</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.flower} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-rose-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌸</span>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t.flower}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{t.week}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-rose-500 to-pink-600 dark:from-rose-900 dark:to-pink-950 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Your Health, Your Privacy, Your Journey 💖</h2>
        <p className="text-rose-100 dark:text-rose-200 mb-8 max-w-xl mx-auto">Join thousands of Ethiopian mothers getting safe, private, expert pregnancy support — any time, anywhere.</p>
        <Link to={appLink("/chat", isAuthenticated)}>
          <Button size="lg" className="bg-white text-rose-500 hover:bg-rose-50 dark:bg-gray-100 dark:text-rose-700 dark:hover:bg-white rounded-full px-10 font-bold gap-2">
            Start Anonymously <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
      </section>

      <SiteFooter variant="landing" />
    </div>
  );
}
