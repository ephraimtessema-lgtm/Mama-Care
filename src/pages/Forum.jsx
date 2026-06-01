import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ForumPost } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";
import { getOrCreateFlowerName } from "@/api/userProfile";
import {
  listMyForumLikedPostIds,
  toggleForumLike,
  deleteForumPost,
  deleteForumReply,
} from "@/api/forum";
import { adminSetUserBans } from "@/api/moderation";
import HoverDeleteButton from "@/components/HoverDeleteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Plus, Search, Pin, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

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

function AdminBanButton({ userId, label, onDone }) {
  const [busy, setBusy] = useState(false);

  if (!userId) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      className="h-7 text-xs rounded-full border-red-200 text-red-600 hover:bg-red-50 gap-1"
      onClick={async (e) => {
        e.stopPropagation();
        if (!window.confirm(`Ban this user from ${label}?`)) return;
        setBusy(true);
        try {
          await adminSetUserBans(userId, {
            forum: label === "forum" ? true : undefined,
            motherChat: label === "mother chat" ? true : undefined,
          });
          onDone?.();
        } catch (err) {
          alert(err?.message || "Could not ban user. Run migration 009 in Supabase.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Ban className="w-3 h-3" />
      Ban from {label}
    </Button>
  );
}

export default function Forum() {
  const { user } = useAuth();
  const admin = isAdmin(user);
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

  const { data: likedPostIds = new Set() } = useQuery({
    queryKey: ["forum_likes", user?.id],
    queryFn: () => listMyForumLikedPostIds(user.id),
    enabled: !!user?.id,
  });

  const createPost = useMutation({
    mutationFn: (data) => ForumPost.create({
      ...data,
      user_id: user?.id,
      flower_name: myFlower,
      likes: 0,
      replies: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum_posts"] });
      setShowNewPost(false);
      setNewPost({ title: "", content: "", category: "general" });
    },
    onError: (err) => {
      alert(err?.message || "Could not create post.");
    },
  });

  const likeToggle = useMutation({
    mutationFn: (post) => toggleForumLike(post.id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum_posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum_likes", user?.id] });
    },
    onError: (err) => {
      alert(err?.message || "Could not update like. Run migration 009 in Supabase.");
    },
  });

  const addReply = useMutation({
    mutationFn: async (post) => {
      const newReply = {
        id: crypto.randomUUID(),
        user_id: user.id,
        flower_name: myFlower,
        content: replyText,
        timestamp: new Date().toISOString(),
      };
      await ForumPost.update(post.id, { replies: [...(post.replies || []), newReply] });
      return { postId: post.id, newReply };
    },
    onSuccess: ({ postId, newReply }) => {
      queryClient.invalidateQueries({ queryKey: ["forum_posts"] });
      setReplyText("");
      setSelectedPost((prev) =>
        prev?.id === postId ? { ...prev, replies: [...(prev.replies || []), newReply] } : prev,
      );
    },
  });

  const removePost = useMutation({
    mutationFn: (post) => deleteForumPost(post.id, user.id, admin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum_posts"] });
      setSelectedPost(null);
    },
    onError: (err) => alert(err?.message || "Could not delete post."),
  });

  const removeReply = useMutation({
    mutationFn: ({ postId, replyId }) => deleteForumReply(postId, replyId, user.id, admin),
    onSuccess: (_, { postId, replyId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum_posts"] });
      setSelectedPost((prev) =>
        prev?.id === postId
          ? { ...prev, replies: (prev.replies || []).filter((r) => r.id !== replyId) }
          : prev,
      );
    },
    onError: (err) => alert(err?.message || "Could not delete reply."),
  });

  const filtered = posts.filter((p) => {
    const matchSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  if (user?.banned_from_forum) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white rounded-2xl border border-rose-100 p-8 shadow-sm">
          <p className="text-4xl mb-3">🌸</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Forum access paused</h1>
          <p className="text-sm text-gray-600 mb-4">
            Your account cannot post or reply in the Flower Forum right now. Contact support if you think this is a mistake.
          </p>
          <Link to="/">
            <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white">Back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." className="pl-9 rounded-full border-rose-200 h-9 text-sm" />
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

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {isLoading && <div className="text-center py-12 text-rose-300 text-4xl">🌸</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🌷</div>
            <p className="text-gray-500">No posts yet. Be the first to share!</p>
            <Button onClick={() => setShowNewPost(true)} className="mt-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full">Start a Discussion</Button>
          </div>
        )}
        {filtered.map((post) => {
          const liked = likedPostIds.has(post.id);
          const ownPost = post.user_id === user?.id;
          return (
            <div
              key={post.id}
              className="group relative bg-white rounded-2xl border border-rose-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              {ownPost && (
                <div className="absolute top-3 right-3">
                  <HoverDeleteButton
                    title="Delete post"
                    onClick={() => {
                      if (window.confirm("Delete this post?")) removePost.mutate(post);
                    }}
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-3 mb-3 pr-8">
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
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 transition-colors",
                      liked ? "text-rose-500" : "hover:text-rose-500",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      likeToggle.mutate(post);
                    }}
                  >
                    <Heart className={cn("w-3 h-3", liked && "fill-current")} /> {post.likes || 0}
                  </button>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.replies?.length || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Share with the Community 🌸</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-500 bg-rose-50 rounded-lg px-3 py-2">Posting as: <span className="font-semibold text-rose-500">{myFlower}</span></div>
            <Input value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} placeholder="Post title..." className="rounded-xl" />
            <Textarea value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))} placeholder="Share your question, experience, or story..." className="rounded-xl min-h-28" />
            <Select value={newPost.category} onValueChange={(v) => setNewPost((p) => ({ ...p, category: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => createPost.mutate(newPost)} disabled={!newPost.title || !newPost.content} className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
              Post Anonymously 🌸
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <Badge className={`text-xs rounded-full w-fit ${CATEGORY_COLORS[selectedPost.category]}`}>{CATEGORY_LABELS[selectedPost.category]}</Badge>
                <DialogTitle className="text-lg mt-2 pr-8">{selectedPost.title}</DialogTitle>
                <p className="text-xs text-rose-400 flex items-center gap-1">🌸 {selectedPost.flower_name}</p>
                {admin && selectedPost.user_id && (
                  <AdminBanButton userId={selectedPost.user_id} label="forum" />
                )}
              </DialogHeader>
              <div className="group relative">
                <p className="text-gray-700 text-sm leading-relaxed pr-8">{selectedPost.content}</p>
                {selectedPost.user_id === user?.id && (
                  <div className="absolute top-0 right-0">
                    <HoverDeleteButton
                      title="Delete post"
                      onClick={() => {
                        if (window.confirm("Delete this post?")) removePost.mutate(selectedPost);
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="border-t border-rose-100 pt-3 mt-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Replies ({selectedPost.replies?.length || 0})</h4>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {(selectedPost.replies || []).map((r) => {
                    const canDeleteReply = r.id && (r.user_id === user?.id || admin);
                    const replyKey = r.id || `${r.timestamp}-${r.flower_name}`;
                    return (
                      <div key={replyKey} className="group relative bg-rose-50 rounded-xl p-3 pr-10">
                        <p className="text-xs font-semibold text-rose-400 mb-1">🌸 {r.flower_name}</p>
                        <p className="text-sm text-gray-700">{r.content}</p>
                        {canDeleteReply && (
                          <div className="absolute top-2 right-2">
                            <HoverDeleteButton
                              title="Delete reply"
                              onClick={() => {
                                if (window.confirm("Delete this reply?")) {
                                  removeReply.mutate({ postId: selectedPost.id, replyId: r.id });
                                }
                              }}
                            />
                          </div>
                        )}
                        {admin && r.user_id && r.user_id !== user?.id && (
                          <div className="mt-2">
                            <AdminBanButton userId={r.user_id} label="forum" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="rounded-full text-sm" />
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
