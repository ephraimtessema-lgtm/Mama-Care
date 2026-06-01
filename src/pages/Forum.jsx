import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ForumPost } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { getOrCreateFlowerName } from "@/api/userProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Plus, Search, Pin } from "lucide-react";

const FLOWER_NAMES = [
  "Blue Lily", "Desert Rose", "Golden Dahlia", "Silver Orchid", "Pink Jasmine",
  "Violet Tulip", "White Magnolia", "Crimson Poppy", "Amber Sunflower", "Jade Hibiscus"
];

const CATEGORY_LABELS = {
  first_trimester: "1st Trimester 🌱",
  second_trimester: "2nd Trimester 🌿",
  third_trimester: "3rd Trimester 🌺",
  nutrition: "Nutrition 🥗",
  mental_health: "Mental Health 💚",
  labor_delivery: "Labor & Delivery 👶",
  postpartum: "Postpartum 🤱",
  general: "General 💬",
};

const CATEGORY_COLORS = {
  first_trimester: "bg-green-100 text-green-700",
  second_trimester: "bg-teal-100 text-teal-700",
  third_trimester: "bg-rose-100 text-rose-700",
  nutrition: "bg-orange-100 text-orange-700",
  mental_health: "bg-purple-100 text-purple-700",
  labor_delivery: "bg-blue-100 text-blue-700",
  postpartum: "bg-pink-100 text-pink-700",
  general: "bg-gray-100 text-gray-700",
};

export default function Forum() {
  const { user } = useAuth();
  const [myFlower, setMyFlower] = useState(FLOWER_NAMES[0]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.id) getOrCreateFlowerName(user.id).then(setMyFlower).catch(() => {});
  }, [user?.id]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["forum_posts"],
    queryFn: () => ForumPost.list("-created_date", 50),
  });

  const createPost = useMutation({
    mutationFn: (data) => ForumPost.create({
      ...data,
      user_id: user?.id,
      flower_name: myFlower,
      likes: 0,
      replies: [],
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["forum_posts"] }); setShowNewPost(false); setNewPost({ title: "", content: "", category: "general" }); },
  });

  const likePost = useMutation({
    mutationFn: (post) => ForumPost.update(post.id, { likes: (post.likes || 0) + 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum_posts"] }),
  });

  const addReply = useMutation({
    mutationFn: (post) => {
      const newReply = { flower_name: myFlower, content: replyText, timestamp: new Date().toISOString() };
      return ForumPost.update(post.id, { replies: [...(post.replies || []), newReply] });
    },
    onSuccess: (_, post) => {
      queryClient.invalidateQueries({ queryKey: ["forum_posts"] });
      setReplyText("");
      // Refresh selectedPost
      setSelectedPost(prev => prev ? { ...prev, replies: [...(prev.replies || []), { flower_name: myFlower, content: replyText, timestamp: new Date().toISOString() }] } : prev);
    },
  });

  const filtered = posts.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) || p.content?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Header */}
      <div className="bg-white border-b border-rose-100 sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">🌸 Flower Forum</h1>
              <p className="text-xs text-gray-400">Anonymous community for moms</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-rose-100 text-rose-600 text-xs rounded-full hidden sm:inline-flex">You: {myFlower}</Badge>
            <Button onClick={() => setShowNewPost(true)} className="bg-rose-500 hover:bg-rose-600 text-white rounded-full gap-1 text-sm">
              <Plus className="w-4 h-4" /> Post
            </Button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." className="pl-9 rounded-full border-rose-200 h-9 text-sm" />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-40 rounded-full border-rose-200 h-9 text-sm">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {isLoading && <div className="text-center py-12 text-rose-300 text-4xl">🌸</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🌷</div>
            <p className="text-gray-500">No posts yet. Be the first to share!</p>
            <Button onClick={() => setShowNewPost(true)} className="mt-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full">Start a Discussion</Button>
          </div>
        )}
        {filtered.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {post.is_pinned && <Pin className="w-3 h-3 text-rose-400" />}
                  <Badge className={`text-xs rounded-full ${CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-700"}`}>
                    {CATEGORY_LABELS[post.category] || post.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900">{post.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <span>🌸</span>
                <span className="font-medium text-rose-400">{post.flower_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                  onClick={e => { e.stopPropagation(); likePost.mutate(post); }}>
                  <Heart className="w-3 h-3" /> {post.likes || 0}
                </button>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.replies?.length || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Post Modal */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Share with the Community 🌸</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-500 bg-rose-50 rounded-lg px-3 py-2">Posting as: <span className="font-semibold text-rose-500">{myFlower}</span></div>
            <Input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="Post title..." className="rounded-xl" />
            <Textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Share your question, experience, or story..." className="rounded-xl min-h-28" />
            <Select value={newPost.category} onValueChange={v => setNewPost(p => ({ ...p, category: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => createPost.mutate(newPost)} disabled={!newPost.title || !newPost.content} className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
              Post Anonymously 🌸
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <Badge className={`text-xs rounded-full w-fit ${CATEGORY_COLORS[selectedPost.category]}`}>{CATEGORY_LABELS[selectedPost.category]}</Badge>
                <DialogTitle className="text-lg mt-2">{selectedPost.title}</DialogTitle>
                <p className="text-xs text-rose-400 flex items-center gap-1">🌸 {selectedPost.flower_name}</p>
              </DialogHeader>
              <p className="text-gray-700 text-sm leading-relaxed">{selectedPost.content}</p>
              <div className="border-t border-rose-100 pt-3 mt-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Replies ({selectedPost.replies?.length || 0})</h4>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {(selectedPost.replies || []).map((r, i) => (
                    <div key={i} className="bg-rose-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-rose-400 mb-1">🌸 {r.flower_name}</p>
                      <p className="text-sm text-gray-700">{r.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." className="rounded-full text-sm" />
                  <Button size="sm" onClick={() => addReply.mutate(selectedPost)} disabled={!replyText.trim()} className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-4">Reply</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}