import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { MemeCard } from "../components/MemeCard";
import type { MemeData } from "../components/MemeCard";

import { API_BASE_URL } from "../context/AuthContext";
import { UserPlus, UserMinus, Grid, Image, Heart } from "lucide-react";

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<any>(null);
  const [userMemes, setUserMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Follower state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLock, setFollowLock] = useState(false);

  const fetchProfile = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Fetch profile statistics
      const profileRes = await fetch(`${API_BASE_URL}/users/profile/${username}`, { headers });
      if (!profileRes.ok) {
        showToast("User not found.", "error");
        navigate("/gallery");
        return;
      }
      const pData = await profileRes.json();
      setProfileData(pData);
      setIsFollowing(pData.is_following);
      setFollowersCount(pData.followers_count);

      // Fetch memes of this user
      let memesUrl = `${API_BASE_URL}/memes?creator_id=${pData.id}`;
      if (user) memesUrl += `&current_user_id=${user.id}`;
      const memesRes = await fetch(memesUrl);
      if (memesRes.ok) {
        const mData = await memesRes.json();
        setUserMemes(mData);
      }
    } catch {
      showToast("Error loading profile stats.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [username, token]);

  const handleFollowToggle = async () => {
    if (!token) {
      showToast("Please log in to subscribe to creators!", "warning");
      return;
    }
    if (followLock) return;

    // Optimistic UI update
    const previousFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));
    setFollowLock(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/profile/${username}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIsFollowing(data.is_following);
      setFollowersCount(data.followers_count);
    } catch {
      // Revert on error
      setIsFollowing(previousFollowing);
      setFollowersCount((prev) => (previousFollowing ? prev + 1 : prev - 1));
      showToast("Could not process subscription.", "error");
    } finally {
      setFollowLock(false);
    }
  };

  const handleDeleteMeme = async (id: number) => {
    if (!confirm("Are you sure you want to delete this meme?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/memes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUserMemes((prev) => prev.filter((m) => m.id !== id));
        showToast("Meme deleted successfully", "success");
      }
    } catch {
      showToast("Could not delete meme.", "error");
    }
  };

  if (loading || !profileData) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="skeleton w-32 h-6 rounded" />
      </div>
    );
  }

  const isOwnProfile = user && user.username === username;

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8 max-w-5xl mx-auto w-full">
      {/* Profile summary card banner */}
      <section className="bg-white dark:bg-brand-lightDark border-4 border-black p-6 md:p-8 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <img
            src={profileData.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
            alt={username}
            className="w-20 h-20 md:w-24 md:h-24 border-4 border-black rounded-none bg-brand-purple/10 p-1"
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-display font-extrabold uppercase dark:text-zinc-50 leading-none">
                {username}
              </h2>
              {profileData.role === "ADMIN" && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-red-500 text-red-500 bg-red-500/10">
                  SYSTEM MODERATOR
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              Joined {new Date(profileData.created_at).toLocaleDateString()}
            </span>
            
            {/* Follow stats counter info */}
            <div className="flex gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-lg font-black dark:text-zinc-50 leading-tight">{followersCount}</span>
                <span className="text-[9px] font-extrabold uppercase text-zinc-400">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black dark:text-zinc-50 leading-tight">{profileData.following_count}</span>
                <span className="text-[9px] font-extrabold uppercase text-zinc-400">Following</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black dark:text-zinc-50 leading-tight">{profileData.total_likes_received}</span>
                <span className="text-[9px] font-extrabold uppercase text-zinc-400">Likes Earned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isOwnProfile ? (
          <button
            onClick={handleFollowToggle}
            className={`flex items-center gap-2 px-6 py-3 border-2 border-black font-black uppercase shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-xs ${
              isFollowing ? "bg-zinc-200 text-black" : "bg-brand-purple text-white"
            }`}
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4" />
                Unfollow User
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Follow Creator
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => navigate("/dashboard/user")}
            className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-brand-green text-black font-black uppercase shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-xs"
          >
            Manage Dashboard
          </button>
        )}
      </section>

      {/* Creator Creations gallery grid */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b-4 border-black pb-3">
          <Grid className="w-5 h-5 text-brand-purple" />
          <h3 className="text-xl font-black uppercase dark:text-zinc-50">Creations Feed ({userMemes.length})</h3>
        </div>

        {userMemes.length === 0 ? (
          <div className="border-4 border-black p-12 bg-white dark:bg-brand-lightDark text-center flex flex-col items-center justify-center gap-4 shadow-brutal">
            <Image className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
            <h3 className="text-xl font-black uppercase dark:text-zinc-50">No memes published yet</h3>
            <p className="text-xs text-zinc-500 font-bold max-w-sm">
              This creator hasn't published any memes to the gallery feed yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userMemes.map((m) => (
              <MemeCard
                key={m.id}
                meme={m}
                onDelete={handleDeleteMeme}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
