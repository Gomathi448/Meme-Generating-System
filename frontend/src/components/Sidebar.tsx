import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Sparkles, 
  Flame, 
  LayoutDashboard, 
  ShieldAlert, 
  LineChart, 
  Cpu, 
  User as UserIcon 
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 font-extrabold text-sm uppercase border-2 border-black transition-all ${
      isActive 
        ? "bg-brand-purple text-white shadow-brutal-purple translate-x-0.5 translate-y-0.5" 
        : "bg-white hover:bg-zinc-100 dark:bg-brand-lightDark dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 hover:-translate-y-0.5 shadow-brutal"
    }`;

  return (
    <aside className="w-full md:w-64 flex-shrink-0 border-r-0 md:border-r-4 border-b-4 md:border-b-0 border-black p-6 flex flex-col gap-6 bg-zinc-100 dark:bg-brand-dark/40 transition-colors">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-black uppercase text-zinc-400 tracking-widest pl-2">Create & Discover</span>
        
        <NavLink to="/" className={linkClasses}>
          <Sparkles className="w-4 h-4" />
          Meme Generator
        </NavLink>
        
        <NavLink to="/gallery" className={linkClasses}>
          <Flame className="w-4 h-4" />
          Trending Gallery
        </NavLink>
      </div>

      {isAuthenticated && user && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase text-zinc-400 tracking-widest pl-2">Creator Hub</span>
          
          <NavLink to="/dashboard/user" className={linkClasses}>
            <LayoutDashboard className="w-4 h-4" />
            User Dashboard
          </NavLink>
          
          <NavLink to={`/profile/${user.username}`} className={linkClasses}>
            <UserIcon className="w-4 h-4" />
            My Public Profile
          </NavLink>
        </div>
      )}

      {isAuthenticated && user && user.role === "ADMIN" && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase text-rose-500 tracking-widest pl-2">Admin Tools</span>
          
          <NavLink to="/dashboard/admin" className={linkClasses}>
            <ShieldAlert className="w-4 h-4 text-brand-pink" />
            System Admin
          </NavLink>
          
          <NavLink to="/dashboard/analytics" className={linkClasses}>
            <LineChart className="w-4 h-4" />
            Creator Analytics
          </NavLink>
          
          <NavLink to="/dashboard/ai-model" className={linkClasses}>
            <Cpu className="w-4 h-4 text-brand-green" />
            AI Pipeline Monitor
          </NavLink>
        </div>
      )}
    </aside>
  );
};
