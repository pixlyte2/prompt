import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Loader2,
  Copy,
  Sparkles,
  Download,
  Wand2,
  CalendarPlus,
  Plus,
  ListChecks,
  AlertTriangle,
  Check,
  FileText,
  Settings2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import api from "../services/api";
import { renderMarkdown } from "../utils/markdown";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  buildFinalizedPrompt,
  extractYouTubeVideoId,
  readStoredPromptId,
  readStoredVideoLength,
  saveStoredPromptId,
  saveStoredVideoLength,
} from "../utils/aiPromptUtils";

const FORMAT_OPTIONS = [
  { value: "short", label: "Shorts" },
  { value: "long", label: "Long" },
];

const ASSIGNED_OPTIONS = [
  { value: "pooja", label: "Pooja" },
  { value: "mahalakshmi", label: "Mahalakshmi" },
];

const FORMAT_PILL = {
  short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

const ASSIGNED_PILL = {
  pooja: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  mahalakshmi: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function isShortVideo(video) {
  if (!video) return false;
  return (
    video.videoFormat === "short" ||
    video.duration === "Short" ||
    (video.duration && !String(video.duration).includes(":"))
  );
}

function defaultScheduledDate() {
  return new Date(Date.now() + 86_400_000).toISOString().split("T")[0];
}

function SectionHeader({ step, icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      {step != null && (
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center">
          {step}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />}
          <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
        </div>
        {description && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable AI script modal for YouTube videos with Production Hub scheduling.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} channelType - Required for scheduling (competitor category name)
 * @param {{ videoId: string, title?: string, thumbnail?: string, url?: string, channelName?: string, channelHandle?: string, views?: number, viewsText?: string, duration?: string, videoFormat?: string } | null} video
 * @param {boolean} [scriptOnly] - Hide schedule tab; show "Use Script" callback flow
 * @param {(script: string) => void} [onScriptGenerated] - Called when user confirms script in scriptOnly mode
 */
export default function VideoAIModal({
  open,
  onClose,
  video,
  channelType = "",
  scriptOnly = false,
  onScriptGenerated,
}) {
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("script");
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [videoLength, setVideoLength] = useState(() => readStoredVideoLength());
  const [generatedScript, setGeneratedScript] = useState("");
  const [fetchingCaptions, setFetchingCaptions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const [schedTitle, setSchedTitle] = useState("");
  const [contentFormat, setContentFormat] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(defaultScheduledDate);
  const [notes, setNotes] = useState("");
  const [scheduleScript, setScheduleScript] = useState("");
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedError, setSchedError] = useState(null);

  const resolvedVideoId = video?.videoId || extractYouTubeVideoId(sourceText);
  const watchUrl =
    video?.url || (resolvedVideoId ? `https://www.youtube.com/watch?v=${resolvedVideoId}` : "");

  const selectedPromptObj = prompts.find((p) => p._id === selectedPrompt);
  const aiModel = selectedPromptObj?.aiModel || "gemini-2.5-flash";

  const fetchCaptions = useCallback(async (forcedVideoId) => {
    const videoId = forcedVideoId || resolvedVideoId;
    if (!videoId) {
      toast.error("No valid YouTube video ID");
      return;
    }

    setFetchingCaptions(true);
    try {
      const captionApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const response = await captionApi.post("/youtube/captions", { videoId });

      if (response.data.captions) {
        setSourceText(response.data.captions);
        const lang = response.data.language?.toUpperCase() || "UNKNOWN";
        const typeLabel = response.data.type === "auto-generated" ? "auto" : "manual";
        toast.success(`Captions fetched in ${lang} (${typeLabel})`);
      } else {
        const msg =
          response.data.message ||
          (response.data.availableLanguages?.length
            ? `Could not load captions. Available: ${response.data.availableLanguages.join(", ")}`
            : "No captions available for this video");
        toast.error(msg);
      }
    } catch (error) {
      let errorMessage = "Failed to fetch captions";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        const available = error.response.data.availableLanguages;
        if (available?.length) {
          errorMessage += `. Try: ${available.join(", ")}`;
        }
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied. Video may be private or restricted.";
      }
      toast.error(errorMessage);
    } finally {
      setFetchingCaptions(false);
    }
  }, [resolvedVideoId]);

  const loadPrompts = useCallback(async () => {
    setLoadingPrompts(true);
    try {
      const res = await api.get("/prompts");
      setPrompts(res.data);
    } catch {
      toast.error("Failed to load prompts");
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadPrompts();
  }, [open, loadPrompts]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("script");
    setSourceText("");
    setGeneratedScript("");
    setVideoLength(readStoredVideoLength());
    setSchedTitle(video?.title || "");
    setContentFormat(isShortVideo(video) ? ["short"] : []);
    setAssignedTo([]);
    setScheduledDate(defaultScheduledDate());
    setNotes("");
    setScheduleScript("");
    setSchedError(null);

    if (video?.videoId) {
      fetchCaptions(video.videoId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, video?.videoId]);

  useEffect(() => {
    if (!open || loadingPrompts) return;
    setSelectedPrompt(readStoredPromptId(prompts.map((p) => p._id)));
  }, [open, prompts, loadingPrompts]);

  useEffect(() => {
    if (generatedScript) {
      setScheduleScript(generatedScript);
    }
  }, [generatedScript]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleGenerate = async () => {
    if (!selectedPrompt) {
      toast.error("Please select a prompt");
      return;
    }
    if (!sourceText.trim()) {
      toast.error("Add source text or fetch captions first");
      return;
    }

    const storedKey = localStorage.getItem("GEMINI_API_KEY_ENC");
    if (!storedKey) {
      toast.error("Please configure your Gemini API key in Settings first");
      return;
    }

    let apiKey;
    try {
      const { decryptData } = await import("../utils/encryption");
      apiKey = await decryptData(storedKey);
      if (!apiKey) {
        toast.error("Failed to decrypt API key. Please reconfigure in Settings");
        return;
      }
    } catch {
      toast.error("Error accessing API key. Please reconfigure in Settings");
      return;
    }

    setGenerating(true);
    setGeneratedScript("");

    try {
      const aiApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        timeout: 120000,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const res = await aiApi.post("/ai/chat", {
        promptId: selectedPrompt,
        sourceText,
        videoLength,
        aiModel,
        message: "Generate content based on the prompt",
        history: [],
        apiKey,
      });

      const result = res.data.response;
      setGeneratedScript(result);
      toast.success("Script generated!");
    } catch (err) {
      let errorMessage = "Failed to generate script";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      } else if (err.response?.status === 429) {
        errorMessage = "Rate limit exceeded. Please wait a moment.";
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid API key. Check your Gemini API key in Settings.";
      } else if (err.response?.status >= 500) {
        errorMessage = "AI service is temporarily unavailable.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleUseScript = () => {
    if (!generatedScript.trim()) return;
    onScriptGenerated?.(generatedScript);
    onClose();
  };

  const canSchedule = Boolean(schedTitle.trim() && channelType);
  const videoUrl = watchUrl || (video?.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : "");

  const handleSchedule = async () => {
    if (!canSchedule) {
      if (!channelType) toast.error("Select a channel taxonomy in Trending Hub first");
      else toast.error("Title is required");
      return;
    }

    setSchedSaving(true);
    setSchedError(null);
    try {
      await api.post("/video-tasks", {
        videoId: video?.videoId || resolvedVideoId || "",
        title: schedTitle.trim(),
        thumbnail: video?.thumbnail || "",
        channelName: video?.channelName || "",
        channelHandle: video?.channelHandle || "",
        channelType,
        platform: "youtube",
        contentFormat: Array.isArray(contentFormat) ? contentFormat : [],
        assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
        url: videoUrl,
        views: video?.views,
        viewsText: video?.viewsText || "",
        duration: video?.duration || "",
        scheduledDate,
        notes,
        script: scheduleScript,
      });

      toast.success(
        (t) => (
          <span className="flex items-center gap-2">
            Added to Production Hub
            <button
              type="button"
              className="text-blue-600 font-medium underline text-xs"
              onClick={() => {
                toast.dismiss(t.id);
                navigate("/admin/production-hub");
              }}
            >
              View Hub
            </button>
          </span>
        ),
        { duration: 4000 },
      );
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to schedule task";
      setSchedError(msg);
      toast.error(msg);
    } finally {
      setSchedSaving(false);
    }
  };

  if (!open || !video) return null;

  const finalizedPreview = selectedPromptObj
    ? buildFinalizedPrompt(selectedPromptObj, sourceText, videoLength)
    : "";

  const modalTitle = scriptOnly ? "Get Script" : "AI Script & Schedule";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4" style={{ zIndex: scriptOnly ? 110 : 100 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col buffer-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/30">
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt=""
              className="w-20 h-12 sm:w-24 sm:h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-0.5">
              <Sparkles size={14} />
              {modalTitle}
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
              {video.title || "Untitled video"}
            </h3>
            {video.channelName && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {video.channelName}
              </p>
            )}
            {watchUrl && !scriptOnly && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-500 hover:underline mt-0.5 inline-block truncate max-w-full"
              >
                {watchUrl}
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs — hidden in scriptOnly mode */}
        {!scriptOnly && (
          <div className="px-4 sm:px-5 pt-3 flex-shrink-0">
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveTab("script")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "script"
                    ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200/80 dark:ring-gray-700/80"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Wand2 size={13} />
                Script
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "schedule"
                    ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200/80 dark:ring-gray-700/80"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <CalendarPlus size={13} />
                Schedule
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5 custom-scrollbar">
          {(scriptOnly || activeTab === "script") ? (
            <>
              {/* Step 1: Source */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800/50">
                <SectionHeader
                  step={1}
                  icon={Download}
                  title="Source material"
                  description="Fetch YouTube captions or paste a transcript manually."
                />
                <div className="relative mt-2">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Fetch captions or paste script / transcript here…"
                    rows={5}
                    disabled={fetchingCaptions}
                    className={`w-full buffer-input text-sm resize-y min-h-[6rem] ${fetchingCaptions ? 'opacity-40 blur-[0.5px] select-none' : ''}`}
                  />
                  {fetchingCaptions && (
                    <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 rounded-lg pointer-events-none">
                      <Loader2 size={22} className="animate-spin text-blue-500" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fetching captions automatically...</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Step 2: Configure */}
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800/50">
                <SectionHeader
                  step={2}
                  icon={Settings2}
                  title="Generation settings"
                  description="Choose video length and the prompt template to use."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Video Length
                    </label>
                    <select
                      value={videoLength}
                      onChange={(e) => {
                        const next = e.target.value;
                        setVideoLength(next);
                        saveStoredVideoLength(next);
                      }}
                      className="buffer-input text-sm w-full"
                    >
                      <option value="40s">40 seconds</option>
                      <option value="2min">2 minutes</option>
                      <option value="3min">3 minutes</option>
                      <option value="5min">5 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Select Prompt
                    </label>
                    <select
                      value={selectedPrompt}
                      onChange={(e) => {
                        const next = e.target.value;
                        setSelectedPrompt(next);
                        saveStoredPromptId(next);
                      }}
                      disabled={loadingPrompts}
                      className="buffer-input text-sm w-full disabled:opacity-60"
                    >
                      <option value="">
                        {loadingPrompts ? "Loading prompts…" : "Choose a prompt…"}
                      </option>
                      {prompts.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.channelId?.name} - {p.promptTypeId?.name} ({p.aiModel})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {finalizedPreview && (
                  <details className="group mt-3">
                    <summary className="text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Preview finalized prompt
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                      {finalizedPreview}
                    </pre>
                  </details>
                )}
              </section>

              {/* Step 3: Output */}
              {(generatedScript || generating) && (
                <section className="rounded-xl border border-blue-200 dark:border-blue-800/50 p-4 bg-blue-50/30 dark:bg-blue-950/20">
                  <SectionHeader
                    step={3}
                    icon={FileText}
                    title="Generated script"
                    description="Review the output below. Copy or use it in your task."
                  />
                  <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[8rem] max-h-64 overflow-y-auto p-3 custom-scrollbar">
                    {generating ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
                        <Loader2 size={18} className="animate-spin text-blue-500" />
                        Generating script…
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(generatedScript, isDark),
                        }}
                      />
                    )}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              {!channelType && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                    Select a channel taxonomy in Trending Hub before scheduling.
                  </p>
                </div>
              )}

              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800/50 space-y-4">
                <SectionHeader
                  icon={CalendarPlus}
                  title="Task details"
                  description="Configure how this video appears on the Production Hub board."
                />

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={schedTitle}
                    onChange={(e) => setSchedTitle(e.target.value)}
                    placeholder="Enter title for your content"
                    className="w-full buffer-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Content Format
                  </label>
                  <div className="flex gap-1.5">
                    {FORMAT_OPTIONS.map((f) => {
                      const isSelected = contentFormat.includes(f.value);
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => {
                            setContentFormat((prev) =>
                              isSelected ? prev.filter((v) => v !== f.value) : [...prev, f.value],
                            );
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? `${FORMAT_PILL[f.value]} border-current shadow-sm`
                              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Assigned to
                  </label>
                  <div className="flex gap-1.5">
                    {ASSIGNED_OPTIONS.map((a) => {
                      const isSelected = assignedTo.includes(a.value);
                      return (
                        <button
                          key={a.value}
                          type="button"
                          onClick={() => {
                            setAssignedTo((prev) =>
                              isSelected ? prev.filter((v) => v !== a.value) : [...prev, a.value],
                            );
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? `${ASSIGNED_PILL[a.value]} border-current shadow-sm`
                              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Channel Type
                    </label>
                    <div className="buffer-input text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
                      {channelType || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Scheduled Date
                      </label>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                            !scheduledDate
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-gray-400"
                          }`}
                        >
                          Backlog
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setScheduledDate(
                              scheduledDate ? null : defaultScheduledDate(),
                            )
                          }
                          className={`relative inline-flex h-[18px] w-[32px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !scheduledDate
                              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              !scheduledDate ? "translate-x-[14px]" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={scheduledDate || ""}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      disabled={!scheduledDate}
                      className={`w-full buffer-input text-sm ${
                        !scheduledDate ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Add any notes…"
                    className="w-full buffer-input text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Script
                    {generatedScript && (
                      <span className="ml-1.5 text-[10px] font-normal text-green-600 dark:text-green-400">
                        auto-filled from generated script
                      </span>
                    )}
                  </label>
                  <textarea
                    value={scheduleScript}
                    onChange={(e) => setScheduleScript(e.target.value)}
                    rows={6}
                    placeholder="Generate a script first, or paste/write one here…"
                    className="w-full buffer-input text-sm resize-y min-h-[8rem] font-mono text-xs"
                  />
                </div>

                {schedError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
                    <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] font-medium text-red-700 dark:text-red-400 leading-tight">
                      {schedError}
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0">
          <button type="button" onClick={onClose} className="buffer-button-secondary text-sm">
            {scriptOnly ? "Cancel" : "Close"}
          </button>

          {scriptOnly ? (
            <>
              {generatedScript && !generating && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedScript);
                    toast.success("Copied to clipboard");
                  }}
                  className="buffer-button-secondary text-sm flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} />
                  Copy
                </button>
              )}
              <button
                type="button"
                onClick={handleUseScript}
                disabled={!generatedScript.trim() || generating}
                className="buffer-button-primary text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                Use Script
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedPrompt || !sourceText.trim()}
                className="buffer-button-primary text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate Script
                  </>
                )}
              </button>
            </>
          ) : activeTab === "script" ? (
            <>
              {generatedScript && !generating && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedScript);
                    toast.success("Copied to clipboard");
                  }}
                  className="buffer-button-secondary text-sm flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} />
                  Copy Script
                </button>
              )}
              {generatedScript && !generating && (
                <button
                  type="button"
                  onClick={() => setActiveTab("schedule")}
                  className="buffer-button-secondary text-sm flex items-center justify-center gap-1.5"
                >
                  <CalendarPlus size={14} />
                  Schedule
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedPrompt || !sourceText.trim()}
                className="buffer-button-primary text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate Script
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSchedule}
              disabled={schedSaving || !canSchedule}
              className="buffer-button-primary text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {schedSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : scheduledDate ? (
                <>
                  <Plus size={14} />
                  Schedule Task
                </>
              ) : (
                <>
                  <ListChecks size={14} />
                  Add to Backlog
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
