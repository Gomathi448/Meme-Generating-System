import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, LogOut, LogIn, Radio } from "lucide-react";

interface NavbarProps {
  wsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ wsConnected }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-brand-dark border-b-4 border-black px-6 py-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-2xl md:text-3xl font-display font-extrabold uppercase tracking-tight flex items-center gap-2">
          <span className="bg-brand-purple text-white px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            MEME
          </span>
          <span className="text-black dark:text-white">GEN.AI</span>
        </Link>
        
        {/* WS State telemetry */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border-2 border-black ${
          wsConnected ? "bg-brand-green/20 text-brand-green border-brand-green" : "bg-zinc-200 text-zinc-500 border-zinc-400 dark:bg-zinc-800"
        }`}>
          <Radio className={`w-3.5 h-3.5 ${wsConnected ? "animate-pulse" : ""}`} />
          {wsConnected ? "LIVE TELEMETRY ACTIVE" : "OFFLINE MODES"}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark/Light mode persistent button */}
        <button
          onClick={toggleTheme}
          className="p-2 border-2 border-black bg-zinc-100 hover:bg-zinc-200 dark:bg-brand-lightDark dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 transition-colors"
          aria-label="Toggle theme mode"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center gap-2 hover:opacity-85"
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt="user avatar"
                className="w-10 h-10 border-2 border-black rounded-none bg-brand-purple/20 p-0.5"
              />
              <span className="hidden sm:inline font-extrabold text-sm uppercase dark:text-zinc-50">
                {user.username}
              </span>
            </Link>
            
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="p-2 border-2 border-black bg-brand-pink text-white hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 text-sm font-bold uppercase transition-all"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-brand-green text-black font-extrabold uppercase hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
