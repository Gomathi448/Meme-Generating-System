import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ThumbsUp, ThumbsDown, Cpu, Activity, DollarSign, RefreshCw, Layers } from "lucide-react";

export const AIModelDashboard: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [costSummary, setCostSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modelSwapLoading, setModelSwapLoading] = useState(false);
  const [activeVersion, setActiveVersion] = useState("gpt-4o-mini");

  const fetchAIData = async () => {
    if (!token) return;
    try {
      // 1. Fetch prompt telemetry logs
      const logsRes = await fetch(`${API_BASE_URL}/ai-models/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }

      // 2. Fetch Cost tracker
      const costRes = await fetch(`${API_BASE_URL}/ai-models/cost-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (costRes.ok) {
        const costData = await costRes.json();
        setCostSummary(costData);
      }
    } catch {
      showToast("Error retrieving technical telemetries.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, [token]);

  const handleModelVersionSwap = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextVer = e.target.value;
    setModelSwapLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai-models/version`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ model_version: nextVer })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveVersion(data.active_version);
        showToast(`AI Pipeline model updated to ${data.active_version}!`, "success");
      }
    } catch {
      showToast("Could not modify pipeline model.", "error");
    } finally {
      setModelSwapLoading(false);
    }
  };

  const handleFeedback = async (logId: number, currentFeedback: number, type: "up" | "down") => {
    // Determine target vote value
    const targetFeedback = type === "up" ? (currentFeedback === 1 ? 0 : 1) : (currentFeedback === -1 ? 0 : -1);
    
    try {
      const res = await fetch(`${API_BASE_URL}/ai-models/feedback/${logId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ feedback: targetFeedback })
      });
      if (res.ok) {
        // Update local logs list state
        setLogs((prev) =>
          prev.map((l) => (l.id === logId ? { ...l, feedback: targetFeedback } : l))
        );
        showToast("Model tuning feedback logged!", "success");
      }
    } catch {
      showToast("Could not submit feedback.", "error");
    }
  };

  if (loading || !costSummary) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="skeleton w-32 h-6 rounded" />
      </div>
    );
  }

  // Prep latency data mapping for Recharts LineChart
  const latencyTrend = logs
    .map((l, i) => ({
      name: `G-${logs.length - i}`,
      latency: l.latency_ms
    }))
    .reverse();

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold uppercase dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <Cpu className="w-8 h-8 text-brand-green" />
            AI Pipeline Monitor
          </h2>
          <p className="text-sm font-bold text-zinc-400 uppercase">
            Model telemetry logs, cost track meters, and reinforcement feedback logs
          </p>
        </div>

        {/* Model Version Dropdown switcher */}
        <div className="flex items-center gap-2 border-2 border-black p-2 bg-white dark:bg-brand-lightDark">
          <span className="text-[10px] font-black uppercase text-zinc-400">ACTIVE CAPTION ENGINE:</span>
          <select
            value={activeVersion}
            onChange={handleModelVersionSwap}
            disabled={modelSwapLoading}
            className="border-2 border-black p-1 text-[10px] font-black uppercase bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 cursor-pointer focus:outline-none"
          >
            <option value="gpt-4o-mini">GPT-4o-mini (Default)</option>
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
            <option value="local-transformer-v2">Local Offline Simulation</option>
          </select>
        </div>
      </div>

      {/* Pipeline metrics row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex items-center gap-4">
          <div className="p-3 border-2 border-black bg-brand-green">
            <Activity className="w-6 h-6 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-zinc-400">Avg pipeline latency</span>
            <span className="text-2xl font-black dark:text-zinc-50">{costSummary.avg_latency_ms}ms</span>
          </div>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex items-center gap-4">
          <div className="p-3 border-2 border-black bg-brand-purple">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-zinc-400">Pipeline success rate</span>
            <span className="text-2xl font-black dark:text-zinc-50">{costSummary.api_success_rate}%</span>
          </div>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex items-center gap-4">
          <div className="p-3 border-2 border-black bg-brand-pink">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-zinc-400">API Total Costs (Est)</span>
            <span className="text-2xl font-black dark:text-zinc-50">${costSummary.total_cost}</span>
          </div>
        </div>

        <div className="border-4 border-black p-5 bg-white dark:bg-brand-lightDark shadow-brutal flex items-center gap-4">
          <div className="p-3 border-2 border-black bg-zinc-100 dark:bg-zinc-800">
            <RefreshCw className="w-6 h-6 text-zinc-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-zinc-400">Total Pipeline Queries</span>
            <span className="text-2xl font-black dark:text-zinc-50">{costSummary.total_generations}</span>
          </div>
        </div>
      </section>

      {/* Latency Line chart */}
      <section className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
        <h3 className="text-lg font-black uppercase dark:text-zinc-50">NLP Pipeline Telemetry Latencies</h3>
        
        <div className="h-64 w-full">
          {latencyTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-400 uppercase font-black">
              Telemetry pipeline empty. Run a caption generation to record latencies!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#a1a1aa" fontSize={10} fontWeight="bold" label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fontWeight: "bold", fill: "#a1a1aa" } }} />
                <Tooltip contentStyle={{ fontWeight: "bold", border: "2px solid black" }} />
                <Line type="monotone" dataKey="latency" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Log Diagnostic table */}
      <section className="border-4 border-black p-6 bg-white dark:bg-brand-lightDark shadow-brutal flex flex-col gap-4">
        <h3 className="text-lg font-black uppercase dark:text-zinc-50">AI Model diagnostics & feedback logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-bold">
            <thead>
              <tr className="border-b-2 border-black text-zinc-400 uppercase">
                <th className="py-2">User</th>
                <th className="py-2">Prompt Input</th>
                <th className="py-2">Caption Output</th>
                <th className="py-2">Model</th>
                <th className="py-2">Latency</th>
                <th className="py-2 text-right">Human Tuning Feedback</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-400 uppercase">
                    No diagnostic logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="py-3 text-brand-purple">{l.username}</td>
                    <td className="py-3 max-w-xs truncate dark:text-zinc-300" title={l.prompt_text}>
                      {l.prompt_text}
                    </td>
                    <td className="py-3 max-w-xs truncate dark:text-zinc-50" title={l.generated_caption}>
                      {l.generated_caption}
                    </td>
                    <td className="py-3 uppercase dark:text-zinc-400">{l.model_version}</td>
                    <td className="py-3 text-brand-green">{l.latency_ms}ms</td>
                    <td className="py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleFeedback(l.id, l.feedback, "up")}
                        className={`p-1.5 border border-black transition-colors ${
                          l.feedback === 1 ? "bg-brand-green text-black" : "bg-white dark:bg-zinc-800 text-zinc-400"
                        }`}
                        title="Good generation (Thumbs Up)"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(l.id, l.feedback, "down")}
                        className={`p-1.5 border border-black transition-colors ${
                          l.feedback === -1 ? "bg-brand-pink text-white" : "bg-white dark:bg-zinc-800 text-zinc-400"
                        }`}
                        title="Poor generation (Thumbs Down)"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
