import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Article } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";
import { ArrowLeft, Search, Clock, Plus } from "lucide-react";

const CATEGORY_CONFIG = {
  nutrition: { label: "Nutrition 🥗", color: "bg-orange-100 text-orange-700" },
  exercise: { label: "Exercise 🏃‍♀️", color: "bg-green-100 text-green-700" },
  mental_health: { label: "Mental Health 💚", color: "bg-purple-100 text-purple-700" },
  symptoms: { label: "Symptoms 💊", color: "bg-blue-100 text-blue-700" },
  labor: { label: "Labor & Delivery 👶", color: "bg-pink-100 text-pink-700" },
  postpartum: { label: "Postpartum 🤱", color: "bg-rose-100 text-rose-700" },
  newborn_care: { label: "Newborn Care 🍼", color: "bg-yellow-100 text-yellow-700" },
  emergency_signs: { label: "🚨 Emergency Signs", color: "bg-red-100 text-red-700" },
};

const TRIMESTER_LABELS = { first: "1st Trimester", second: "2nd Trimester", third: "3rd Trimester", all: "All Stages" };

export default function Articles() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && CATEGORY_CONFIG[cat]) setFilterCat(cat);
  }, [searchParams]);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: () => Article.filter({ is_published: true }, "-created_date", 50),
  });

  const filtered = articles.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase()) || a.summary?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || a.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">📚 Pregnancy Library</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Trusted articles from medical experts</p>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..." className="pl-9 rounded-full text-sm dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button size="sm" onClick={() => setFilterCat("all")}
              className={`rounded-full text-xs flex-shrink-0 ${filterCat === "all" ? "bg-rose-500 hover:bg-rose-600 text-white" : "border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-gray-700"}`}>
              All Topics
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <Button key={k} size="sm" onClick={() => setFilterCat(k)}
                className={`rounded-full text-xs flex-shrink-0 ${filterCat === k ? "bg-rose-500 hover:bg-rose-600 text-white" : "border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-gray-700"}`}>
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="text-5xl mb-3">📖</div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              {articles.length === 0 ? "The library is empty" : "No articles found"}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mx-auto">
              {articles.length === 0
                ? "Articles are added by Mama-Care admins. Run the seed SQL in Supabase or add articles from the admin dashboard."
                : "Try a different search or category"}
            </p>
            {admin && articles.length === 0 && (
              <Link to="/admin" className="inline-block mt-6">
                <Button className="rounded-full bg-rose-500 hover:bg-rose-600 gap-2">
                  <Plus className="w-4 h-4" />
                  Add articles (Admin)
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(article => (
            <div key={article.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md dark:hover:shadow-rose-900/10 transition-shadow cursor-pointer overflow-hidden"
              onClick={() => setSelected(article)}>
              {article.image_url && (
                <img src={article.image_url} alt={article.title} className="w-full h-36 object-cover" />
              )}
              {!article.image_url && (
                <div className="w-full h-36 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950 dark:to-gray-900 flex items-center justify-center text-4xl">📋</div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {article.category && (
                    <Badge className={`text-xs rounded-full ${CATEGORY_CONFIG[article.category]?.color || "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_CONFIG[article.category]?.label || article.category}
                    </Badge>
                  )}
                  <Badge className="text-xs rounded-full bg-blue-50 text-blue-500">{TRIMESTER_LABELS[article.trimester] || "All Stages"}</Badge>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">{article.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{article.summary}</p>
                {article.read_time_minutes && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                    <Clock className="w-3 h-3" /> {article.read_time_minutes} min read
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
          {selected && (
            <>
              {selected.image_url && <img src={selected.image_url} alt={selected.title} className="w-full h-48 object-cover rounded-xl mb-4" />}
              <DialogHeader>
                <div className="flex gap-2 flex-wrap mb-2">
                  <Badge className={`text-xs rounded-full ${CATEGORY_CONFIG[selected.category]?.color}`}>{CATEGORY_CONFIG[selected.category]?.label}</Badge>
                  <Badge className="text-xs rounded-full bg-blue-50 text-blue-500">{TRIMESTER_LABELS[selected.trimester]}</Badge>
                  {selected.read_time_minutes && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.read_time_minutes} min</span>
                  )}
                </div>
                <DialogTitle className="text-xl leading-snug">{selected.title}</DialogTitle>
              </DialogHeader>
              {selected.summary && <p className="text-gray-500 text-sm italic border-l-4 border-rose-300 pl-3">{selected.summary}</p>}
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selected.content}</div>
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-200 mt-4">
                ⚠️ This article is for informational purposes only. Always consult your doctor for medical advice.
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}