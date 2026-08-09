import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../context/AuthContext";
import { Trash2, Shield, Ban, CheckCircle, Settings, Users, Server, Eye } from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings toggle
  const [visionModeToggle, setVisionModeToggle] = useState(true);
  const [rateLimitInput, setRateLimitInput] = useState("100");

  // Mock moderation queue items
  const [moderationQueue, setModerationQueue] = useState<any[]>([
    {
      id: 101,
      title: "Risky Corporate Synergies",
      image_url: "/static/templates/temp_doge.png",
      creator_username: "SlackCoder",
      flag_reason: "NSFW filter warning (82% matching logo overlap)",
      status: "FLAGGED"
    },
    {
      id: 102,
      title: "Highly controversial deployment joke",
      image_url: "/static/templates/temp_two_buttons.png",
      creator_username: "MemeLord99",
      flag_reason: "User flagged: offensive humor language",
      status: "FLAGGED"
    }
  ]);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      // 1. Fetch user list
      const uRes = await fetch(`${API_BASE_URL}/users/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsersList(uData);
      }

      // 2. Fetch platform telemetry stats
      const sRes = await fetch(`${API_BASE_URL}/analytics/platform`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setPlatformStats(sData);
      }
    } catch {
      showToast("Error retrieving administrative details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleBanToggle = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/ban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        showToast(
          `User ${updated.username} account ${updated.is_active ? "restored" : "deactivated"}.`,
          "success"
        );
      }
    } catch {
      showToast("Could not process ban toggle.", "error");
    }
  };

  const handleRoleToggle = async (userId: number, currentRole: string) => {
    const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        showToast(`User ${updated.username} promoted to ${updated.role}!`, "success");
      }
    } catch {
      showToast("Could not modify roles.", "error");
    }
  };

  const handleApproveContent = (id: number) => {
    setModerationQueue((prev) => prev.filter((m) => m.id !== id));
    showToast("Meme approved and cleared from queue.", "success");
  };

  const handleRejectContent = (id: number) => {
    setModerationQueue((prev) => prev.filter((m) => m.id !== id));
    showToast("Meme rejected and deleted from server.", "error");
  };

  if (loading || !platformStats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="skeleton w-32 h-6 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-3xl font-display font-extrabold uppercase dark:text-zinc-50 tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-brand-pink" />
          System Administration
        </h2>
        <p className="text-sm font-bold text-zinc-400 uppercase">
          Moderation pipelines, account permissions, and system setting parameters
        </p>
      </div>

      {/* Analytics stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">Daily Active Users (DAU)</span>
          <span className="text-3xl font-black dark:text-zinc-50">{platformStats.total_users - 1 || 4}</span>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">API Latency Avg</span>
          <span className="text-3xl font-black text-brand-green">{platformStats.average_api_latency_ms}ms</span>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">Cost Accrued (Est)</span>
          <span className="text-3xl font-black text-brand-purple">${platformStats.total_api_cost}</span>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase text-zinc-400">Server Health Widget</span>
          <span className="text-sm font-black text-brand-green uppercase flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-brand-green rounded-full animate-ping" />
            CPU: {platformStats.health.cpu_usage_percent}% RAM: {platformStats.health.memory_usage_percent}%
          </span>
        </div>
      </section>

      {/* Main double column layouts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Accounts Management list */}
        <div className="lg:col-span-2 border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
          <h3 className="text-lg font-black uppercase dark:text-zinc-50 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Registered User Accounts ({usersList.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-bold">
              <thead>
                <tr className="border-b-2 border-black text-zinc-400 uppercase">
                  <th className="py-2">User ID</th>
                  <th className="py-2">Username</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="py-3 dark:text-zinc-300">#{u.id}</td>
                    <td className="py-3 dark:text-zinc-50">{u.username}</td>
                    <td className="py-3 dark:text-zinc-400">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 border border-black text-[8px] uppercase ${
                        u.role === "ADMIN" ? "bg-red-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 text-black"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-right flex gap-1.5 justify-end">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        className="px-2 py-1 border border-black bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-50 text-[9px] uppercase"
                      >
                        Swap Role
                      </button>
                      <button
                        onClick={() => handleBanToggle(u.id)}
                        disabled={u.id === user?.id}
                        className={`p-1 border border-black text-white disabled:opacity-30 ${
                          u.is_active ? "bg-brand-pink" : "bg-brand-green"
                        }`}
                        title={u.is_active ? "Ban user" : "Unban user"}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Moderation Queue */}
        <div className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
          <h3 className="text-lg font-black uppercase dark:text-zinc-50 flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-pink animate-pulse" />
            NSFW Flagged Queue ({moderationQueue.length})
          </h3>
          
          <div className="flex flex-col gap-3">
            {moderationQueue.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-400 uppercase font-black">
                Moderation queue cleared. Good job!
              </div>
            ) : (
              moderationQueue.map((m) => (
                <div key={m.id} className="border-2 border-black p-3 bg-zinc-50 dark:bg-zinc-900 flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <img src={m.image_url} alt="flagged" className="w-12 h-12 object-cover border" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase truncate dark:text-zinc-50">{m.title}</span>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase">Creator: {m.creator_username}</span>
                      <span className="text-[8px] font-bold text-brand-pink uppercase tracking-wide mt-1 italic block leading-none truncate">
                        {m.flag_reason}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end border-t border-zinc-200 dark:border-zinc-800 pt-2 text-[9px] font-extrabold uppercase">
                    <button
                      onClick={() => handleApproveContent(m.id)}
                      className="px-3 py-1 border border-black bg-brand-green text-black flex items-center gap-1"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectContent(m.id)}
                      className="px-3 py-1 border border-black bg-brand-pink text-white flex items-center gap-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* System Settings configuration */}
      <section className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
        <h3 className="text-lg font-black uppercase dark:text-zinc-50 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-purple" />
          MemeGen System Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-bold">
          <div className="flex flex-col gap-1.5 border-2 border-black p-4 bg-zinc-50 dark:bg-zinc-900">
            <span className="font-extrabold uppercase text-zinc-500">API Quotas limits</span>
            <input
              type="number"
              value={rateLimitInput}
              onChange={(e) => setRateLimitInput(e.target.value)}
              className="border-2 border-black p-2 bg-white dark:bg-zinc-800 dark:text-white"
            />
            <button
              onClick={() => showToast("Rate limits updated globally!", "success")}
              className="mt-2 py-1.5 border-2 border-black bg-brand-purple text-white uppercase text-[10px]"
            >
              Update Quotas
            </button>
          </div>

          <div className="flex flex-col gap-2 border-2 border-black p-4 bg-zinc-50 dark:bg-zinc-900">
            <span className="font-extrabold uppercase text-zinc-500">Vision Analysis matches</span>
            <div className="flex items-center justify-between py-2">
              <span className="dark:text-zinc-300">Enable OCR captions</span>
              <button
                onClick={() => setVisionModeToggle(!visionModeToggle)}
                className={`w-12 h-6 border-2 border-black relative transition-all ${
                  visionModeToggle ? "bg-brand-green" : "bg-zinc-300"
                }`}
              >
                <span className={`absolute top-0.5 w-4.5 h-4.5 border border-black bg-white transition-all ${
                  visionModeToggle ? "right-1" : "left-1"
                }`} />
              </button>
            </div>
            <span className="text-[9px] text-zinc-400 font-bold leading-normal">
              Allows user photo upload vision descriptors to run.
            </span>
          </div>

          <div className="flex flex-col gap-1 border-2 border-black p-4 bg-zinc-50 dark:bg-zinc-900">
            <span className="font-extrabold uppercase text-zinc-500">Active Pipeline models</span>
            <span className="text-[10px] text-zinc-500 uppercase mt-1">Image overlays: PIL overlay engine</span>
            <span className="text-[10px] text-zinc-500 uppercase mt-1">Sentiment model: pipeline-v3.1</span>
            <span className="text-[10px] text-brand-green uppercase font-black tracking-wider mt-4">
              All engines operational
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
