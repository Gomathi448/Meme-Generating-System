import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trash2, Edit, Calendar, BookOpen, Layers } from "lucide-react";

export const UserDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab state: "memes" | "drafts"
  const [activeSubTab, setActiveSubTab] = useState<"memes" | "drafts">("memes");
  const [myMemes, setMyMemes] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      // Fetch overview statistics (includes trend and quota)
      const res = await fetch(`${API_BASE_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }

      // Fetch all memes for this creator (published, drafts, scheduled)
      const creatorRes = await fetch(`${API_BASE_URL}/memes?creator_id=${user?.id}`);
      if (creatorRes.ok) {
        const memesData = await creatorRes.json();
        // Since get_meme_feed default lists only PUBLISHED, let's fetch specific list or filter locally
        // For local simulation, we fetch their generated list. To be safe, we list what is returned.
        setMyMemes(memesData);
      }
    } catch {
      showToast("Error loading creator analytics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleDeleteMeme = async (id: number) => {
    if (!confirm("Are you sure you want to delete this meme?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/memes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyMemes((prev) => prev.filter((m) => m.id !== id));
        showToast("Meme deleted successfully", "success");
        // reload stats
        fetchDashboardData();
      }
    } catch {
      showToast("Could not delete meme.", "error");
    }
  };

  const handlePublishDraft = async (id: number) => {
    try {
      // Simulate draft publishing updates status to PUBLISHED
      showToast("Publishing draft to feed...", "info");
      // For local demo, we simulate and refresh
      setTimeout(() => {
        showToast("Meme published live!", "success");
        fetchDashboardData();
      }, 800);
    } catch {
      showToast("Failed to publish.", "error");
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="skeleton w-32 h-6 rounded" />
      </div>
    );
  }

  // Quota calculation
  const quotaPercentage = Math.round((stats.quota_used / stats.quota_limit) * 100);

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-3xl font-display font-extrabold uppercase dark:text-zinc-50 tracking-tight">
          Creator Dashboard
        </h2>
        <p className="text-sm font-bold text-zinc-400 uppercase">
          Track your engagement trends, quotas, and scheduling pipelines
        </p>
      </div>

      {/* Summary grid widgets */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">Total Memes Created</span>
          <span className="text-3xl font-black dark:text-zinc-50">{stats.total_memes}</span>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">Total Likes Received</span>
          <span className="text-3xl font-black dark:text-zinc-50">{stats.total_likes}</span>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">Avg Virality Score</span>
          <span className="text-3xl font-black text-brand-purple">{stats.average_virality_score}%</span>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">Avg Humor Score</span>
          <span className="text-3xl font-black text-brand-green">{stats.average_humor_score}%</span>
        </div>
      </section>

      {/* Main analytics display & quota block */}
      <section className="flex flex-col lg:flex-row gap-6">
        {/* Engagement Trend */}
        <div className="flex-1 border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
          <h3 className="text-lg font-black uppercase dark:text-zinc-50">Engagement History (7 Days)</h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.engagement_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ fontWeight: "bold", border: "2px solid black" }} />
                <Line type="monotone" dataKey="Engagement" stroke="#7C3AED" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Memes" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quota Progress Ring */}
        <div className="w-full lg:w-80 border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col items-center justify-between text-center gap-4">
          <h3 className="text-lg font-black uppercase dark:text-zinc-50 self-start">AI Quota Status</h3>
          
          {/* SVG Progress Ring */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="currentColor"
                strokeWidth="12"
                className="text-zinc-200 dark:text-zinc-800"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * Math.min(100, quotaPercentage)) / 100}
                className={`${quotaPercentage >= 90 ? "text-brand-pink" : "text-brand-purple"}`}
                fill="transparent"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black dark:text-zinc-50">{quotaPercentage}%</span>
              <span className="text-[9px] font-black uppercase text-zinc-400">Quota Used</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <span className="text-xs font-bold text-zinc-500">
              {stats.quota_used} of {stats.quota_limit} generations consumed
            </span>
            <span className="text-[10px] font-black text-brand-green uppercase">Resets on next calendar cycle</span>
          </div>
        </div>
      </section>

      {/* Draft & Meme management panel */}
      <section className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal">
        <div className="flex border-b-2 border-black pb-3 mb-4 gap-4">
          <button
            onClick={() => setActiveSubTab("memes")}
            className={`font-black uppercase text-sm px-4 py-1.5 border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
              activeSubTab === "memes" ? "bg-brand-purple text-white" : "bg-white dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            My Published Memes
          </button>
          
          <button
            onClick={() => setActiveSubTab("drafts")}
            className={`font-black uppercase text-sm px-4 py-1.5 border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
              activeSubTab === "drafts" ? "bg-brand-purple text-white" : "bg-white dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Drafts & Scheduler
          </button>
        </div>

        {/* Content tables */}
        {activeSubTab === "memes" ? (
          myMemes.length === 0 ? (
            <div className="text-center py-12 text-sm text-zinc-400 font-bold uppercase">
              No published memes yet. Head to the editor to make one!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myMemes.map((m) => (
                <div key={m.id} className="border-2 border-black p-3 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={`http://localhost:8000${m.image_url}`} alt="meme" className="w-10 h-10 object-cover border" />
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-black uppercase truncate dark:text-zinc-50">{m.title}</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">Tone: {m.tone}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMeme(m.id)}
                    className="p-1.5 border border-black bg-brand-pink text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-bold">
              <thead>
                <tr className="border-b-2 border-black text-zinc-400 uppercase">
                  <th className="py-2">Meme Title</th>
                  <th className="py-2">Tone</th>
                  <th className="py-2">Scheduled Release</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <td className="py-3 uppercase dark:text-zinc-50">Weekend compiler debug crash</td>
                  <td className="py-3">
                    <span className="bg-brand-pink text-white px-2 py-0.5 text-[8px] uppercase font-bold border border-black">Dark</span>
                  </td>
                  <td className="py-3 flex items-center gap-1 text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-brand-purple" />
                    Aug 15, 2026 09:00 AM
                  </td>
                  <td className="py-3 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => handlePublishDraft(1)}
                      className="px-2 py-1 border border-black bg-brand-green text-black uppercase text-[10px]"
                    >
                      Publish Now
                    </button>
                    <button
                      onClick={() => showToast("Simulated draft delete", "success")}
                      className="p-1 border border-black bg-brand-pink text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
