import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../context/AuthContext";
import { Sparkles, Upload, Calendar, Image as ImageIcon, Check, Edit2, Play, Download } from "lucide-react";

import templatesData from "../templates.json";

interface Template {
  id: number;
  name: string;
  imagePath: string;
  width: number;
  height: number;
  textBoxCount: number;
}


interface CaptionVariant {
  top_text: string;
  bottom_text: string;
  sentiment_score: number;
  humor_score: number;
  virality_score: number;
  explanation: string;
}

export const Generator: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  // Tab State: "library" | "upload"
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  // Form State
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("sarcastic");
  const [language, setLanguage] = useState("en");
  
  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Custom uploaded file state
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  // Caption options state
  const [captions, setCaptions] = useState<CaptionVariant[]>([]);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number | null>(null);

  // Manual overlay text
  const [title, setTitle] = useState("My Awesome Meme");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [status, setStatus] = useState("PUBLISHED"); // PUBLISHED, DRAFT, SCHEDULED
  const [scheduledFor, setScheduledFor] = useState("");

  const [savingMeme, setSavingMeme] = useState(false);
  const [savedMemeUrl, setSavedMemeUrl] = useState<string | null>(null);
  
  // AI Usage statistics
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(50);

  // Live client-side preview Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchTemplatesAndQuota = async () => {
    try {
      // Load templates statically from local manifest
      setTemplates(templatesData);
      if (templatesData.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templatesData[0]);
      }

      // Fetch user quota
      if (token) {
        const overviewRes = await fetch(`${API_BASE_URL}/analytics/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (overviewRes.ok) {
          const stats = await overviewRes.json();
          setQuotaUsed(stats.quota_used);
          setQuotaLimit(stats.quota_limit);
        }
      }
    } catch {
      showToast("Error loading user quota statistics.", "error");
    }
  };


  useEffect(() => {
    fetchTemplatesAndQuota();
  }, [token]);

  // Redraw preview canvas on caption changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    
    // Choose source image
    if (activeTab === "upload" && uploadedImageBase64) {
      img.src = uploadedImageBase64;
    } else if (activeTab === "library" && selectedTemplate) {
      img.src = selectedTemplate.imagePath;

    } else {
      // blank dark image
      canvas.width = 500;
      canvas.height = 500;
      ctx.fillStyle = "#1e1e24";
      ctx.fillRect(0, 0, 500, 500);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("[Select template background]", 110, 250);
      return;
    }

    img.onload = () => {
      // Match canvas dimensions to image aspect ratio (capped at 500px)
      const aspect = img.width / img.height;
      canvas.width = 500;
      canvas.height = 500 / aspect;

      // Draw original image background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Setup styling: white text with thick black borders (traditional Impact meme font)
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = Math.max(3, canvas.height * 0.012);
      ctx.textAlign = "center";
      
      // Helper function to split long lines
      const wrapText = (text: string, font: string, maxWidth: number) => {
        ctx.font = font;
        const words = text.toUpperCase().split(" ");
        const lines: string[] = [];
        let currentLine = words[0] || "";

        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + " " + words[i];
          const w = ctx.measureText(testLine).width;
          if (w < maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = words[i];
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      const drawTextWithOutline = (text: string, cx: number, cy: number, font: string, maxW: number) => {
        const lines = wrapText(text, font, maxW);
        ctx.font = font;
        const metrics = ctx.measureText("A");
        const lineH = (metrics.actualBoundingBoxAscent || 20) + 8;
        let y = cy;
        lines.forEach((line) => {
          ctx.strokeText(line, cx, y);
          ctx.fillText(line, cx, y);
          y += lineH;
        });
      };

      const isDistracted = selectedTemplate?.name.toLowerCase().includes("distracted");
      const isTwoButtons = selectedTemplate?.name.toLowerCase().includes("two buttons");

      if (isDistracted) {
        // Distracted Boyfriend roles:
        // topText = Other Woman (left)
        // bottomText = Boyfriend (center) | Girlfriend (right)
        const parts = bottomText.split("|");
        const boy = parts[0]?.trim() || "";
        const girl = parts[1]?.trim() || "";
        const other = topText.trim();
        
        const labelFont = `900 ${Math.max(14, canvas.height * 0.05)}px Impact, Arial, sans-serif`;
        const maxW = canvas.width * 0.25;
        
        if (other) drawTextWithOutline(other, canvas.width * 0.18, canvas.height * 0.68, labelFont, maxW);
        if (boy) drawTextWithOutline(boy, canvas.width * 0.50, canvas.height * 0.58, labelFont, maxW);
        if (girl) drawTextWithOutline(girl, canvas.width * 0.80, canvas.height * 0.70, labelFont, maxW);
        
      } else if (isTwoButtons) {
        // Two Buttons layout:
        // topText = Button 1 (left) | Button 2 (right)
        // bottomText = Decision Maker (bottom)
        const parts = topText.split("|");
        const btn1 = parts[0]?.trim() || "";
        const btn2 = parts[1]?.trim() || "";
        const user = bottomText.trim();
        
        const labelFont = `900 ${Math.max(12, canvas.height * 0.045)}px Impact, Arial, sans-serif`;
        const maxW = canvas.width * 0.22;
        
        if (btn1) drawTextWithOutline(btn1, canvas.width * 0.25, canvas.height * 0.18, labelFont, maxW);
        if (btn2) drawTextWithOutline(btn2, canvas.width * 0.45, canvas.height * 0.15, labelFont, maxW);
        if (user) {
          const userFont = `900 ${Math.max(16, canvas.height * 0.06)}px Impact, Arial, sans-serif`;
          drawTextWithOutline(user, canvas.width * 0.50, canvas.height * 0.82, userFont, canvas.width * 0.5);
        }
        
      } else if (selectedTemplate && selectedTemplate.textBoxCount > 2) {
        // Multi-box generic layout (e.g., 4 or 5 panels): distribute panels vertically!
        const count = selectedTemplate.textBoxCount;
        const topParts = topText.split("|").map(p => p.trim());
        const bottomParts = bottomText.split("|").map(p => p.trim());
        const topCount = Math.ceil(count / 2);
        
        const values: string[] = [];
        for (let i = 0; i < count; i++) {
          if (i < topCount) {
            values.push(topParts[i] || "");
          } else {
            values.push(bottomParts[i - topCount] || "");
          }
        }
        
        const panelFontSize = Math.max(12, canvas.height * 0.045);
        const standardFont = `900 ${panelFontSize}px Impact, Arial, sans-serif`;
        const maxTextW = canvas.width * 0.85;
        
        values.forEach((val, idx) => {
          if (!val) return;
          const cy = ((idx + 0.5) / count) * canvas.height;
          drawTextWithOutline(val, canvas.width / 2, cy - (panelFontSize / 2), standardFont, maxTextW);
        });
      } else {
        // Standard Top/Bottom layout: dynamically scale font size to fit text and prevent overlap
        const textLen = Math.max(topText.length, bottomText.length);
        let dynamicFontSize = Math.max(16, canvas.height * 0.08);
        if (textLen > 40) {
          dynamicFontSize = Math.max(14, canvas.height * 0.055);
        } else if (textLen > 25) {
          dynamicFontSize = Math.max(16, canvas.height * 0.07);
        }
        
        const standardFont = `900 ${dynamicFontSize}px Impact, Arial, sans-serif`;
        const maxTextW = canvas.width * 0.9;
        
        if (topText) {
          const topLines = wrapText(topText, standardFont, maxTextW);
          const lineH = dynamicFontSize + 4;
          let y = dynamicFontSize + canvas.height * 0.03;
          topLines.forEach((line) => {
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
            y += lineH;
          });
        }
        
        if (bottomText) {
          const bottomLines = wrapText(bottomText, standardFont, maxTextW);
          const lineH = dynamicFontSize + 4;
          let y = canvas.height - (bottomLines.length * lineH) - canvas.height * 0.02 + dynamicFontSize;
          bottomLines.forEach((line) => {
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
            y += lineH;
          });
        }
      }
    };
  }, [selectedTemplate, uploadedImageBase64, topText, bottomText, activeTab]);


  const handleGenerateCaptions = async () => {
    if (!token) {
      showToast("Please sign in to run AI generators!", "warning");
      return;
    }
    if (!prompt.trim()) {
      showToast("Please enter an prompt topic.", "warning");
      return;
    }

    setGeneratingCaptions(true);
    setCaptions([]);
    setSelectedCaptionIndex(null);

    try {
      const res = await fetch(`${API_BASE_URL}/memes/generate-captions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          tone,
          language,
          template_name: selectedTemplate?.name
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Generation failed");
      }

      const data = await res.json();
      setCaptions(data.variants);
      
      // Auto select best caption
      if (data.variants.length > 0) {
        setTopText(data.variants[0].top_text);
        setBottomText(data.variants[0].bottom_text);
        setSelectedCaptionIndex(0);
      }

      // Decrement quota visually
      setQuotaUsed((prev) => Math.min(quotaLimit, prev + 1));
      showToast("NLP caption variants generated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Caption generation failed.", "error");
    } finally {
      setGeneratingCaptions(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Only image file formats allowed.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUploadedImageBase64(base64);
      
      // Call vision describer mock pipeline
      if (token) {
        setAnalyzingImage(true);
        try {
          const res = await fetch(`${API_BASE_URL}/memes/analyze-upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ image_data_url: base64 })
          });
          if (res.ok) {
            const data = await res.json();
            showToast(`Vision analysis: ${data.description}`, "info");
            setCaptions(data.suggested_captions);
            if (data.suggested_captions.length > 0) {
              setTopText(data.suggested_captions[0].top_text);
              setBottomText(data.suggested_captions[0].bottom_text);
              setSelectedCaptionIndex(0);
            }
          }
        } catch {
          showToast("Vision matching failed.", "error");
        } finally {
          setAnalyzingImage(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const selectCaptionOption = (index: number) => {
    setSelectedCaptionIndex(index);
    setTopText(captions[index].top_text);
    setBottomText(captions[index].bottom_text);
  };

  const handleSaveMeme = async () => {
    if (!token) {
      showToast("Please log in to save and publish memes!", "warning");
      return;
    }

    setSavingMeme(true);
    setSavedMemeUrl(null);

    // Build payload
    const payload: any = {
      title,
      top_text: topText,
      bottom_text: bottomText,
      tone,
      tags: `${tone},ai_generated,meme`,
      status,
      scheduled_for: status === "SCHEDULED" && scheduledFor ? new Date(scheduledFor).toISOString() : null
    };

    if (activeTab === "library" && selectedTemplate) {
      payload.template_id = selectedTemplate.id;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/memes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          // If custom photo is uploaded, we pass it as query/body
          image_data_url: activeTab === "upload" ? uploadedImageBase64 : null
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Meme rendering failed");
      }

      const data = await res.json();
      setSavedMemeUrl(data.image_url);
      showToast("Meme rendered and saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to render and save meme.", "error");
    } finally {
      setSavingMeme(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 py-6 px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Left Settings Panel */}
      <section className="flex-1 flex flex-col gap-6 bg-white dark:bg-brand-lightDark border-4 border-black p-6 shadow-brutal">
        <h2 className="text-2xl font-display font-extrabold uppercase dark:text-zinc-50 border-b-2 border-black pb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-purple" />
          AI meme editor
        </h2>

        {/* Tab switches */}
        <div className="flex border-2 border-black">
          <button
            onClick={() => {
              setActiveTab("library");
              setUploadedImageBase64(null);
            }}
            className={`flex-1 py-3 text-xs font-black uppercase transition-colors flex items-center justify-center gap-2 ${
              activeTab === "library" ? "bg-brand-purple text-white" : "bg-white dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Standard Library
          </button>
          <button
            onClick={() => {
              setActiveTab("upload");
              setSelectedTemplate(null);
            }}
            className={`flex-1 py-3 text-xs font-black uppercase transition-colors flex items-center justify-center gap-2 ${
              activeTab === "upload" ? "bg-brand-purple text-white" : "bg-white dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <Upload className="w-4 h-4" />
            Custom Image Upload
          </button>
        </div>

        {/* Dynamic tabs context */}
        {activeTab === "library" ? (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-zinc-400">1. Select Template Grid</span>
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto border-2 border-black p-2 bg-zinc-50 dark:bg-zinc-900">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`border-2 p-1 bg-white dark:bg-zinc-800 transition-all ${
                    selectedTemplate?.id === t.id ? "border-brand-purple scale-95" : "border-black hover:border-zinc-500"
                  }`}
                >
                  <img
                    src={t.imagePath}

                    alt={t.name}
                    className="w-full h-12 object-cover border"
                  />
                  <span className="text-[8px] font-black uppercase block truncate mt-1 text-center dark:text-zinc-200">
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-zinc-400">1. Upload Custom Image</span>
            <div className="border-4 border-dashed border-black dark:border-zinc-700 p-6 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/40 relative">
              <Upload className="w-8 h-8 text-zinc-400 mb-2" />
              <span className="text-xs font-bold text-zinc-400 text-center">Drag image or click to browse</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {uploadedImageBase64 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-brand-green text-black px-2 py-0.5">Image Ready</span>
                  <button onClick={() => setUploadedImageBase64(null)} className="text-xs text-brand-pink underline font-bold">Remove</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt Configuration */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">
              2. Describe your meme theme/topic
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. When your junior developer pushes code directly to production on a Friday"
              rows={2}
              className="border-2 border-black p-3 text-sm font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="border-2 border-black p-2.5 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 cursor-pointer"
              >
                <option value="sarcastic">Sarcastic</option>
                <option value="wholesome">Wholesome</option>
                <option value="dark">Dark</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider dark:text-zinc-300">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border-2 border-black p-2.5 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 cursor-pointer"
              >
                <option value="en">English (US/UK)</option>
                <option value="es">Español (ES)</option>
                <option value="fr">Français (FR)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateCaptions}
            disabled={generatingCaptions || analyzingImage}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-black bg-brand-purple text-white font-extrabold uppercase hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition-all text-xs"
          >
            <Sparkles className="w-4 h-4" />
            {generatingCaptions ? "Running NLP caption variations..." : "Generate AI Caption variants"}
          </button>
        </div>

        {/* Caption Variants outputs list */}
        {captions.length > 0 && (
          <div className="flex flex-col gap-3 border-t-2 border-black pt-4">
            <span className="text-xs font-black uppercase text-zinc-400">3. Select and fine tune</span>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {captions.map((c, i) => (
                <button
                  key={i}
                  onClick={() => selectCaptionOption(i)}
                  className={`text-left border-2 p-3 flex justify-between items-start gap-4 transition-all ${
                    selectedCaptionIndex === i ? "border-brand-purple bg-brand-purple/5" : "border-black hover:bg-zinc-50 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex-1 flex flex-col">
                    <span className="text-xs font-bold uppercase text-brand-purple leading-tight">Top: {c.top_text}</span>
                    <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300 leading-tight mt-1">Bottom: {c.bottom_text}</span>
                    <span className="text-[9px] text-zinc-400 font-bold mt-1.5 italic leading-snug">{c.explanation}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="bg-black text-brand-green border border-brand-green px-2 py-0.5 text-[8px] font-black">
                      Score: {c.humor_score}%
                    </span>
                    {selectedCaptionIndex === i && <Check className="w-4 h-4 text-brand-purple" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Right Preview Panel */}
      <section className="w-full lg:w-96 flex flex-col gap-6 bg-white dark:bg-brand-lightDark border-4 border-black p-6 shadow-brutal justify-between">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-display font-extrabold uppercase dark:text-zinc-50 border-b-2 border-black pb-2">
            Meme preview
          </h2>

          {/* Canvas viewport container */}
          <div className="border-4 border-black bg-zinc-900 overflow-hidden flex items-center justify-center relative aspect-square shadow-brutal-green">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-zinc-400">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-2 border-black p-2 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>

            {(() => {
              const isDistracted = selectedTemplate?.name.toLowerCase().includes("distracted");
              const isTwoButtons = selectedTemplate?.name.toLowerCase().includes("two buttons");

              if (isDistracted) {
                return (
                  <div className="flex flex-col gap-2 border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-brand-purple">Other Woman (Left)</label>
                      <input
                        type="text"
                        placeholder="e.g. New Compiling Tool"
                        value={topText}
                        onChange={(e) => setTopText(e.target.value)}
                        className="border-2 border-black p-2 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-brand-green">Boyfriend (Center)</label>
                        <input
                          type="text"
                          placeholder="e.g. Web Developer"
                          value={bottomText.split("|")[0]?.trim() || ""}
                          onChange={(e) => {
                            const parts = bottomText.split("|");
                            const val1 = e.target.value;
                            const val2 = parts[1]?.trim() || "";
                            setBottomText(`${val1} | ${val2}`);
                          }}
                          className="border-2 border-black p-2 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-green"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-brand-pink">Girlfriend (Right)</label>
                        <input
                          type="text"
                          placeholder="e.g. Stable Old Configs"
                          value={bottomText.split("|")[1]?.trim() || ""}
                          onChange={(e) => {
                            const parts = bottomText.split("|");
                            const val1 = parts[0]?.trim() || "";
                            const val2 = e.target.value;
                            setBottomText(`${val1} | ${val2}`);
                          }}
                          className="border-2 border-black p-2 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-pink"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              if (isTwoButtons) {
                return (
                  <div className="flex flex-col gap-2 border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-brand-purple">Button 1 Label (Left)</label>
                        <input
                          type="text"
                          placeholder="e.g. Fix the Bug"
                          value={topText.split("|")[0]?.trim() || ""}
                          onChange={(e) => {
                            const parts = topText.split("|");
                            const val1 = e.target.value;
                            const val2 = parts[1]?.trim() || "";
                            setTopText(`${val1} | ${val2}`);
                          }}
                          className="border-2 border-black p-2 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-brand-pink">Button 2 Label (Right)</label>
                        <input
                          type="text"
                          placeholder="e.g. Rewrite Everything"
                          value={topText.split("|")[1]?.trim() || ""}
                          onChange={(e) => {
                            const parts = topText.split("|");
                            const val1 = parts[0]?.trim() || "";
                            const val2 = e.target.value;
                            setTopText(`${val1} | ${val2}`);
                          }}
                          className="border-2 border-black p-2 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-pink"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-brand-green">Decision Maker (Bottom)</label>
                      <input
                        type="text"
                        placeholder="e.g. Tired Programmer"
                        value={bottomText}
                        onChange={(e) => setBottomText(e.target.value)}
                        className="border-2 border-black p-2 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-green"
                      />
                    </div>
                  </div>
                );
              }

              if (selectedTemplate && selectedTemplate.textBoxCount > 2) {
                const count = selectedTemplate.textBoxCount;
                const topCount = Math.ceil(count / 2);
                
                const topParts = topText.split("|").map(p => p.trim());
                const bottomParts = bottomText.split("|").map(p => p.trim());
                
                const values: string[] = [];
                for (let i = 0; i < count; i++) {
                  if (i < topCount) {
                    values.push(topParts[i] || "");
                  } else {
                    values.push(bottomParts[i - topCount] || "");
                  }
                }
                
                const handleInputChange = (idx: number, newVal: string) => {
                  values[idx] = newVal;
                  const newTopParts = values.slice(0, topCount);
                  const newBottomParts = values.slice(topCount);
                  setTopText(newTopParts.join(" | "));
                  setBottomText(newBottomParts.join(" | "));
                };
                
                return (
                  <div className="flex flex-col gap-2 border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                    {Array.from({ length: count }).map((_, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400">
                          Panel {idx + 1} Text
                        </label>
                        <input
                          type="text"
                          placeholder={`Text for panel ${idx + 1}`}
                          value={values[idx] || ""}
                          onChange={(e) => handleInputChange(idx, e.target.value)}
                          className="border-2 border-black p-2 text-xs font-bold bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-brand-purple"
                        />
                      </div>
                    ))}
                  </div>
                );
              }

              // Default layout
              return (

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Top Text</label>
                    <input
                      type="text"
                      value={topText}
                      onChange={(e) => setTopText(e.target.value)}
                      className="border-2 border-black p-2 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Bottom Text</label>
                    <input
                      type="text"
                      value={bottomText}
                      onChange={(e) => setBottomText(e.target.value)}
                      className="border-2 border-black p-2 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </div>
                </div>
              );
            })()}


            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-zinc-400">Publish Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border-2 border-black p-2 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 cursor-pointer"
                >
                  <option value="PUBLISHED">Publish Now</option>
                  <option value="DRAFT">Save as Draft</option>
                  <option value="SCHEDULED">Schedule Post</option>
                </select>
              </div>

              {status === "SCHEDULED" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-brand-purple" />
                    Date
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="border-2 border-black p-1 text-[10px] font-bold bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-50 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t-2 border-black pt-4 mt-4">
          {/* Quota indicator meter */}
          {token && (
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-400 uppercase">AI Generations Quota:</span>
              <span className={`${quotaUsed >= quotaLimit ? "text-brand-pink" : "text-brand-green"} uppercase`}>
                {quotaUsed}/{quotaLimit} Used
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveMeme}
              disabled={savingMeme || (!selectedTemplate && !uploadedImageBase64)}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-black bg-brand-green text-black font-extrabold uppercase hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-brutal hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition-all text-xs"
            >
              <Check className="w-4 h-4" />
              {savingMeme ? "Rendering..." : "Save Meme"}
            </button>
            
            {savedMemeUrl && (
              <a
                href={`http://localhost:8000${savedMemeUrl}`}
                download="my_meme.png"
                className="px-4 py-3 border-2 border-black bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                title="Download PNG directly"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
