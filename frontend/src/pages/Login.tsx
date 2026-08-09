import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { LogIn } from "lucide-react";


export const Login: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast("Please fill in all form details.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username, password });
      showToast("Logged in successfully! Welcome back.", "success");
      navigate("/");
    } catch (err: any) {
      showToast(err.message || "Invalid credentials, please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Simulate Google OAuth
      await googleLogin({
        email: "googleuser@gmail.com",
        name: "Google MemeMaster",
        picture: "https://api.dicebear.com/7.x/bottts/svg?seed=googlememe"
      });
      showToast("Simulated Google Authentication success!", "success");
      navigate("/");
    } catch (err) {
      showToast("Google login failed.", "error");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-full max-w-md border-4 border-black p-8 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-display font-extrabold uppercase dark:text-zinc-50 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase">
            Sign in to start posting top-tier memes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. MemeLord42"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-black bg-brand-purple text-white font-extrabold uppercase hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 text-sm mt-2"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? "Authenticating..." : "Login Session"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-2">
          <hr className="flex-1 border-black dark:border-zinc-700" />
          <span className="text-[10px] font-black text-zinc-400 uppercase">OR USE SOCIALS</span>
          <hr className="flex-1 border-black dark:border-zinc-700" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-black bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:text-zinc-50 font-extrabold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-xs transition-all"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google OAuth
          </button>
        </div>

        <span className="text-xs font-bold text-center dark:text-zinc-300">
          New to the platform?{" "}
          <Link to="/signup" className="text-brand-purple hover:underline font-extrabold uppercase">
            Create Account
          </Link>
        </span>
      </div>
    </div>
  );
};
