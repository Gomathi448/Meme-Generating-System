import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Trash2, Download, Copy, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../context/AuthContext";

export interface MemeData {
  id: number;
  creator_id: number;
  creator_username: string;
  creator_avatar: string | null;
  template_id: number | null;
  title: string;
  image_url: string;
  top_text: string;
  bottom_text: string;
  tone: string;
  tags: string;
  sentiment_score: number;
  humor_score: number;
  virality_score: number;
  likes_count: number;
  comments_count: number;
  is_liked_by_me: boolean;
  created_at: string;
}

interface MemeCardProps {
  meme: MemeData;
  onDelete?: (id: number) => void;
  onTagClick?: (tag: string) => void;
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme, onDelete, onTagClick }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  
  // Optimistic UI state for likes
  const [liked, setLiked] = useState(meme.is_liked_by_me);
  const [likesCount, setLikesCount] = useState(meme.likes_count);
  const [likeLock, setLikeLock] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async () => {
    if (!token) {
      showToast("Please log in to like memes!", "warning");
      return;
    }
    if (likeLock) return;
    
    // Optimistic Update
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    setLikeLock(true);

    try {
      const res = await fetch(`${API_BASE_URL}/memes/${meme.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch {
      // Revert if error
      setLiked(liked);
      setLikesCount(likesCount);
      showToast("Could not like meme. Connection issue.", "error");
    } finally {
      setLikeLock(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/memes/${meme.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setCommentsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenComments = () => {
    setCommentsOpen(true);
    fetchComments();
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast("Please log in to leave comments!", "warning");
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/memes/${meme.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newCommentText }),
      });
      if (res.ok) {
        const comment = await res.json();
        setCommentsList((prev) => [comment, ...prev]);
        setNewCommentText("");
        showToast("Comment posted!", "success");
      }
    } catch (err) {
      showToast("Could not post comment.", "error");
    }
  };

  const handleDownload = () => {
    const fullUrl = `http://localhost:8000${meme.image_url}`;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = `${meme.title.toLowerCase().replace(/ /g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Starting PNG download...", "success");
  };

  const handleCopyLink = () => {
    const fullLink = `${window.location.origin}/meme/${meme.id}`;
    navigator.clipboard.writeText(fullLink);
    showToast("Meme URL copied to clipboard!", "success");
  };

  const toneColors: Record<string, string> = {
    sarcastic: "bg-brand-purple text-white",
    wholesome: "bg-brand-green text-black",
    dark: "bg-brand-pink text-white",
    corporate: "bg-blue-500 text-white",
  };

  const tagsArray = meme.tags ? meme.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="bg-white dark:bg-brand-lightDark border-4 border-black p-4 shadow-brutal flex flex-col gap-4 max-w-md w-full relative">
      {/* Top profile banner */}
      <div className="flex items-center justify-between">
        <Link to={`/profile/${meme.creator_username}`} className="flex items-center gap-2.5">
          <img
            src={meme.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${meme.creator_username}`}
            alt={meme.creator_username}
            className="w-9 h-9 border-2 border-black rounded-none bg-zinc-100"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm uppercase dark:text-zinc-50">{meme.creator_username}</span>
            <span className="text-[10px] font-bold text-zinc-400">
              {new Date(meme.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
        
        <span className={`text-[10px] font-black uppercase px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
          toneColors[meme.tone.toLowerCase()] || "bg-zinc-200 text-zinc-900"
        }`}>
          {meme.tone}
        </span>
      </div>

      {/* Meme image block */}
      <div className="border-4 border-black aspect-square overflow-hidden bg-zinc-900 flex items-center justify-center relative group">
        <img
          src={`http://localhost:8000${meme.image_url}`}
          alt={meme.title}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
        
        {/* Overlay statistics metrics badge */}
        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black text-white px-2 py-0.5 border-2 border-white text-[10px] font-bold">
            Humor: {meme.humor_score}%
          </div>
          <div className="bg-black text-white px-2 py-0.5 border-2 border-white text-[10px] font-bold">
            Viral: {meme.virality_score}%
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-black uppercase dark:text-zinc-50 leading-tight">
          {meme.title}
        </h3>
        
        {/* Tags explorer */}
        {tagsArray.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tagsArray.map((t) => (
              <button
                key={t}
                onClick={() => onTagClick?.(t)}
                className="text-[10px] font-extrabold uppercase border-2 border-black bg-zinc-100 hover:bg-brand-purple dark:bg-zinc-800 dark:hover:bg-brand-purple hover:text-white px-2 py-0.5 transition-colors"
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom action controls */}
      <div className="flex items-center justify-between border-t-2 border-black pt-3 mt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 font-black text-sm transition-all ${
              liked ? "text-brand-pink scale-110" : "text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"
            }`}
            aria-label="Like meme"
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-brand-pink" : ""}`} />
            <span>{likesCount}</span>
          </button>
          
          <button
            onClick={handleOpenComments}
            className="flex items-center gap-1.5 font-black text-sm text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"
            aria-label="Open comments panel"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{meme.comments_count}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareOpen(true)}
            className="p-1.5 border-2 border-black bg-white dark:bg-brand-lightDark text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Share meme"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {onDelete && user && (user.id === meme.creator_id || user.role === "ADMIN") && (
            <button
              onClick={() => onDelete(meme.id)}
              className="p-1.5 border-2 border-black bg-brand-pink text-white hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              aria-label="Delete meme"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Share panel drawer overlay */}
      <AnimatePresence>
        {shareOpen && (
          <div className="absolute inset-0 bg-white dark:bg-brand-lightDark border-2 border-black z-20 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h4 className="font-extrabold uppercase text-sm dark:text-zinc-50">One-Click Share Channels</h4>
              <button
                onClick={() => setShareOpen(false)}
                className="text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 py-6">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-3 border-2 border-black font-extrabold uppercase text-xs bg-brand-green text-black hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal transition-all"
              >
                <Download className="w-4 h-4" />
                PNG Export
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-3 border-2 border-black font-extrabold uppercase text-xs bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal transition-all"
              >
                <Copy className="w-4 h-4" />
                Copy URL
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-zinc-400 text-center">Export Simulated To</span>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => showToast("Simulated WhatsApp share triggered!", "success")}
                  className="px-3 py-1 border-2 border-black bg-emerald-500 text-white text-[10px] font-bold uppercase"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => showToast("Simulated Instagram sharing cards copied!", "success")}
                  className="px-3 py-1 border-2 border-black bg-pink-600 text-white text-[10px] font-bold uppercase"
                >
                  Instagram
                </button>
                <button
                  onClick={() => showToast("Simulated X/Twitter prompt opened!", "success")}
                  className="px-3 py-1 border-2 border-black bg-black text-white text-[10px] font-bold uppercase"
                >
                  X (Twitter)
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Drawer overlay */}
      <AnimatePresence>
        {commentsOpen && (
          <div className="absolute inset-0 bg-white dark:bg-brand-lightDark border-2 border-black z-20 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h4 className="font-extrabold uppercase text-sm dark:text-zinc-50">Comments Thread</h4>
              <button
                onClick={() => setCommentsOpen(false)}
                className="text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list feed */}
            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
              {loadingComments ? (
                <div className="h-full flex items-center justify-center">
                  <div className="skeleton w-16 h-4 rounded" />
                </div>
              ) : commentsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400 font-bold">
                  No captions or thoughts left yet. Be the first!
                </div>
              ) : (
                commentsList.map((c) => (
                  <div key={c.id} className="border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs flex gap-2">
                    <img
                      src={c.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`}
                      alt={c.username}
                      className="w-6 h-6 border-2 border-black rounded-none mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-brand-purple">{c.username}</span>
                        <span className="text-[9px] text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-200 font-medium leading-normal">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input comment field */}
            <form onSubmit={handlePostComment} className="flex gap-2 border-t-2 border-black pt-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={token ? "Add custom caption review..." : "Login to post thoughts..."}
                disabled={!token}
                className="flex-1 border-2 border-black p-2 rounded-none text-xs font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!token}
                className="px-4 py-2 border-2 border-black bg-brand-purple text-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
