import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../context/AuthContext";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, SlidersHorizontal, BarChart3, PieChartIcon, Share2 } from "lucide-react";

export const AnalyticsDashboard: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock A/B test datasets
  const [abTests, setAbTests] = useState<any[]>([
    {
      id: "ab-1",
      prompt: "Asking for budget approval on Friday",
      variant_a: {
        text: "Please take this offline | Let me cry first",
        humor: 94,
        likes: 120,
        shares: 45,
        conversion: "12.4%"
      },
      variant_b: {
        text: "Per my last email | Which went to the trash bin",
        humor: 88,
        likes: 95,
        shares: 28,
        conversion: "9.2%"
      },
      winner: "Variant A (Sarcastic Tone)"
    },
    {
      id: "ab-2",
      prompt: "Dog watching owner code on weekend",
      variant_a: {
        text: "My dog watching me | Work on a Saturday",
        humor: 91,
        likes: 210,
        shares: 110,
        conversion: "18.1%"
      },
      variant_b: {
        text: "Supportive puppy | Celebrating compiling failures",
        humor: 95,
        likes: 312,
        shares: 195,
        conversion: "26.5%"
      },
      winner: "Variant B (Wholesome Tone)"
    }
  ]);

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch {
      showToast("Error loading analytics telemetry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const handleExportCSV = async () => {
    if (!token) return;
    showToast("Compiling tabular CSV dataset report...", "info");
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/export`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meme_creator_analytics_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("CSV report downloaded successfully!", "success");
      }
    } catch {
      showToast("Could not export CSV.", "error");
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="skeleton w-32 h-6 rounded" />
      </div>
    );
  }

  // Sentiment colors
  const COLORS = ["#10B981", "#7C3AED", "#F43F5E", "#3B82F6"];

  // Mock distributions for charts
  const viralityData = [
    { name: "10-30%", count: 2 },
    { name: "30-50%", count: 4 },
    { name: "50-70%", count: 12 },
    { name: "70-90%", count: 18 },
    { name: "90-100%", count: 8 },
  ];

  const sentimentData = [
    { name: "Positive Sentiment (Wholesome)", value: 40 },
    { name: "Neutral Sentiment (Sarcastic)", value: 45 },
    { name: "Negative Sentiment (Dark)", value: 15 },
  ];

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold uppercase dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-purple" />
            Creator Analytics
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase">
            A/B test conversions, sentiment breakdowns, and exportable CSV details
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3 border-2 border-black bg-brand-purple text-white font-extrabold uppercase shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-xs"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Recharts graphic panels */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Virality Distribution */}
        <div className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
          <h3 className="text-lg font-black uppercase dark:text-zinc-50 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-purple" />
            Virality Score Distribution
          </h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viralityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ fontWeight: "bold", border: "2px solid black" }} />
                <Bar dataKey="count" fill="#10B981" stroke="#000000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tone and Sentiment Analysis */}
        <div className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
          <h3 className="text-lg font-black uppercase dark:text-zinc-50 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-brand-pink" />
            Sentiment breakdown
          </h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontWeight: "bold", border: "2px solid black" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* A/B Test viewer for caption variants */}
      <section className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
        <h3 className="text-lg font-black uppercase dark:text-zinc-50 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-brand-green" />
          NLP Caption variants A/B Testing Viewer
        </h3>
        
        <div className="flex flex-col gap-4">
          {abTests.map((t) => (
            <div key={t.id} className="border-2 border-black p-4 bg-zinc-50 dark:bg-zinc-900 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="text-xs font-black uppercase text-brand-purple">Prompt: "{t.prompt}"</span>
                <span className="bg-brand-green text-black px-2 py-0.5 text-[9px] uppercase border border-black font-black">
                  Winner: {t.winner}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Variant A */}
                <div className="border border-black p-3 bg-white dark:bg-zinc-850 flex flex-col gap-2">
                  <span className="font-extrabold uppercase text-zinc-400">Variant A (Control)</span>
                  <p className="font-black text-xs uppercase dark:text-zinc-50">{t.variant_a.text}</p>
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-2 mt-1">
                    <span>Likes: {t.variant_a.likes}</span>
                    <span>Humor: {t.variant_a.humor}%</span>
                    <span className="text-brand-purple">CR: {t.variant_a.conversion}</span>
                  </div>
                </div>

                {/* Variant B */}
                <div className="border border-black p-3 bg-white dark:bg-zinc-850 flex flex-col gap-2">
                  <span className="font-extrabold uppercase text-zinc-400">Variant B (Challenger)</span>
                  <p className="font-black text-xs uppercase dark:text-zinc-50">{t.variant_b.text}</p>
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-2 mt-1">
                    <span>Likes: {t.variant_b.likes}</span>
                    <span>Humor: {t.variant_b.humor}%</span>
                    <span className="text-brand-purple">CR: {t.variant_b.conversion}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
