import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Flame, Shield, TrendingUp, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col gap-12 py-6 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="bg-brand-purple text-white border-4 border-black p-8 md:p-12 shadow-brutal flex flex-col items-start gap-6 relative overflow-hidden">
        {/* Abstract decorative elements */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="bg-black text-brand-green px-3 py-1 border-2 border-brand-green text-xs font-black uppercase tracking-wider">
          🔥 Powered by Advanced NLP & Vision AI
        </div>
        
        <h1 className="text-4xl md:text-6xl font-display font-extrabold uppercase leading-none max-w-3xl">
          Generate Premium Memes Instantly with Artificial Intelligence
        </h1>
        
        <p className="text-base md:text-lg font-bold text-zinc-100 max-w-xl leading-relaxed">
          Unlock automated caption suggestions, humor scores, sentiment matching, and template overlay engines with zero setup.
        </p>

        <div className="flex flex-wrap gap-4 mt-2">
          <Link
            to="/generator"
            className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-brand-green text-black font-black uppercase hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-sm"
          >
            <Sparkles className="w-5 h-5" />
            Launch AI Generator
          </Link>
          <Link
            to="/gallery"
            className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-white text-black font-black uppercase hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-sm"
          >
            <Flame className="w-5 h-5" />
            Explore Trending Feed
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-3">
          <div className="w-12 h-12 border-2 border-black bg-brand-green flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-xl font-extrabold uppercase dark:text-zinc-50">NLP Caption variants</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 font-bold leading-normal">
            Input a simple idea and watch our pipeline suggest sarcastic, wholesome, dark, or corporate text card variants ranked by engagement likelihood.
          </p>
        </div>

        <div className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-3">
          <div className="w-12 h-12 border-2 border-black bg-brand-purple flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-extrabold uppercase dark:text-zinc-50">Sentiment/Humor score</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 font-bold leading-normal">
            Evaluate virality dynamics, sentiment indicators, and humor percentages calculated contextually by local keyword analysis models.
          </p>
        </div>

        <div className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-3">
          <div className="w-12 h-12 border-2 border-black bg-brand-pink flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-extrabold uppercase dark:text-zinc-50">Admin Moderation Queue</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 font-bold leading-normal">
            Safeguard the community using automatic NSFW classification filters and dedicated rejection controls for content curators.
          </p>
        </div>
      </section>

      {/* Sandbox instructions info */}
      <section className="bg-amber-100 dark:bg-amber-950/20 border-4 border-black p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <HelpCircle className="w-8 h-8 text-amber-600 flex-shrink-0" />
        <div>
          <h4 className="font-extrabold uppercase text-amber-900 dark:text-amber-400 text-sm">Sandbox Playbook & instructions</h4>
          <p className="text-xs text-amber-800 dark:text-amber-500 font-bold leading-relaxed mt-0.5">
            Since this system operates local mock algorithms, you do not need actual API keys in your .env file to generate and customize memes! Simply register or login to acquire credentials, select templates, and begin overlaying captions. Sign up as an <strong>ADMIN</strong> to access developer dashboards.
          </p>
        </div>
      </section>
    </div>
  );
};
