import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { UserPlus } from "lucide-react";

export const Signup: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER"); // Option for sandbox role testing
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password.trim()) {
      showToast("Please fill in all form details.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, username, password, role });
      showToast("Account registered! Logged in automatically.", "success");
      navigate("/");
    } catch (err: any) {
      showToast(err.message || "Registration failed. Username or email taken.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-full max-w-md border-4 border-black p-8 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-display font-extrabold uppercase dark:text-zinc-50 tracking-tight">
            Create Account
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase">
            Join the automated NLP meme generation hub
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. template@gmail.com"
              className="border-2 border-black p-3 text-sm font-bold rounded-none bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. MemeCreator99"
              className="border-2 border-black p-3 text-sm font-bold rounded-none bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-2 border-black p-3 text-sm font-bold rounded-none bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">
              Select Sandbox Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border-2 border-black p-3 text-sm font-bold rounded-none bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple cursor-pointer"
            >
              <option value="USER">CREATOR (Standard Quotas)</option>
              <option value="ADMIN">ADMINISTRATOR (Access All Dashboards)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-black bg-brand-green text-black font-extrabold uppercase hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 text-sm mt-2"
          >
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <span className="text-xs font-bold text-center dark:text-zinc-300">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-purple hover:underline font-extrabold uppercase">
            Login
          </Link>
        </span>
      </div>
    </div>
  );
};
