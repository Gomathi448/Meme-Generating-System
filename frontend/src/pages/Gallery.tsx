import React, { useEffect, useState } from "react";
import { MemeCard } from "../components/MemeCard";
import type { MemeData } from "../components/MemeCard";

import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../context/AuthContext";
import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";

export const Gallery: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [memes, setMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("latest"); // latest, trending, top_humor
  const [selectedTone, setSelectedTone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMemes = async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    const limit = 6;
    
    let url = `${API_BASE_URL}/memes?limit=${limit}&offset=${currentOffset}&sort=${sortBy}`;
    if (selectedTone) url += `&tone=${selectedTone}`;
    if (selectedTag) url += `&tag=${selectedTag}`;
    if (searchQuery) url += `&tag=${searchQuery}`; // simple search checks tags
    if (user) url += `&current_user_id=${user.id}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (reset) {
        setMemes(data);
      } else {
        setMemes((prev) => [...prev, ...data]);
      }
      
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setOffset(currentOffset + limit);
    } catch {
      showToast("Error loading gallery memes. Check API server.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMemes(true);
  }, [sortBy, selectedTone, selectedTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchMemes(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMemes(true);
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTag(tag);
    setSearchQuery(""); // sync search text
    showToast(`Filtering by tag: #${tag}`, "info");
  };

  const handleDeleteMeme = async (id: number) => {
    if (!confirm("Are you sure you want to delete this meme?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/memes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setMemes((prev) => prev.filter((m) => m.id !== id));
        showToast("Meme deleted successfully", "success");
      }
    } catch {
      showToast("Could not delete meme.", "error");
    }
  };

  const clearFilters = () => {
    setSelectedTag("");
    setSelectedTone("");
    setSearchQuery("");
    setSortBy("latest");
  };

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold uppercase dark:text-zinc-50 tracking-tight">
            Trending Gallery
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase">
            Browse through AI-generated humor on the platform
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex border-2 border-black max-w-xs w-full bg-white dark:bg-brand-lightDark">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-xs font-bold w-full bg-transparent text-zinc-950 dark:text-zinc-50 focus:outline-none"
            />
            <button type="submit" className="px-3 border-l-2 border-black bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 border-2 border-black bg-white dark:bg-brand-lightDark hover:bg-zinc-100 text-zinc-950 dark:text-white"
            aria-label="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters panels */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-black p-4 bg-zinc-100 dark:bg-brand-lightDark">
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border-2 border-black p-1.5 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="latest">Latest Generations</option>
            <option value="trending">Highest Virality</option>
            <option value="top_humor">Top Humor Scores</option>
          </select>

          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="border-2 border-black p-1.5 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">All Tones</option>
            <option value="sarcastic">Sarcastic</option>
            <option value="wholesome">Wholesome</option>
            <option value="dark">Dark</option>
            <option value="corporate">Corporate</option>
          </select>

          {(selectedTag || searchQuery || selectedTone) && (
            <button
              onClick={clearFilters}
              className="text-xs font-extrabold uppercase text-brand-pink hover:underline border-2 border-brand-pink px-2.5 py-1 bg-white dark:bg-zinc-900"
            >
              Clear Filters
            </button>
          )}
        </div>

        {selectedTag && (
          <span className="text-xs font-black bg-brand-purple text-white px-2.5 py-1.5 border-2 border-black">
            ACTIVE FILTER: #{selectedTag.toUpperCase()}
          </span>
        )}
      </div>

      {/* Grid container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border-4 border-black p-4 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="skeleton w-8 h-8 rounded-none" />
                  <div className="skeleton w-16 h-3 rounded" />
                </div>
                <div className="skeleton w-10 h-4 rounded" />
              </div>
              <div className="skeleton aspect-square rounded-none border-2 border-zinc-200 dark:border-zinc-800" />
              <div className="skeleton w-2/3 h-5 rounded" />
            </div>
          ))}
        </div>
      ) : memes.length === 0 ? (
        <div className="border-4 border-black p-12 bg-white dark:bg-brand-lightDark text-center flex flex-col items-center justify-center gap-4 shadow-brutal">
          <SlidersHorizontal className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="text-2xl font-black uppercase dark:text-zinc-50">Empty gallery feed</h3>
          <p className="text-sm text-zinc-500 font-bold max-w-sm">
            We couldn't find any published memes matching your parameters. Create a custom meme now!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {memes.map((m) => (
              <MemeCard
                key={m.id}
                meme={m}
                onDelete={handleDeleteMeme}
                onTagClick={handleTagFilter}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => fetchMemes(false)}
              className="px-8 py-3 border-2 border-black bg-brand-purple text-white font-extrabold uppercase shadow-brutal hover:bg-violet-700 active:translate-x-0.5 active:translate-y-0.5 transition-all text-xs"
            >
              Load More Memes
            </button>
          )}
        </div>
      )}
    </div>
  );
};
