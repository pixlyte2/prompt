import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Mic,
  RefreshCw,
  Loader2,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  FileAudio,
  ChevronDown,
  ChevronRight,
  Youtube,
  Instagram,
  Facebook,
  Globe,
  Eye,
  X,
  FileText,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api, { httpClient } from "../../services/api";
import { downloadVoiceOverFile, uploadVoiceOverFile } from "../../utils/voiceOverDownload";
import { VOICE_OVER_ACCEPT, isVoiceOverFileAllowed, voiceOverFileTypeHint } from "../../constants/voiceOverFileTypes";

const PLATFORM_META = {
  youtube: { icon: Youtube, color: "text-red-500" },
  instagram: { icon: Instagram, color: "text-pink-500" },
  facebook: { icon: Facebook, color: "text-blue-600" },
  website: { icon: Globe, color: "text-gray-500" },
};

function toDateKey(d) {
  if (!d || d === "null" || d === "undefined") return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(key) {
  if (!key || key === "no-date") return "Backlog";
  const d = new Date(key + "T00:00:00");
  const today = new Date();
  const todayKey = toDateKey(today);
  const tmrw = new Date(today);
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwKey = toDateKey(tmrw);
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const yestKey = toDateKey(yest);
  const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  if (key === todayKey) return `Today — ${label}`;
  if (key === tmrwKey) return `Tomorrow — ${label}`;
  if (key === yestKey) return `Yesterday — ${label}`;
  return label;
}

function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getTaskUrl(task) {
  if (task.url) return task.url;
  if (task.videoId && (task.platform === "youtube" || !task.platform)) {
    return `https://www.youtube.com/watch?v=${task.videoId}`;
  }
  return null;
}

function getTaskThumbnail(task) {
  if (task.thumbnail) return task.thumbnail;
  const ytId = task.videoId || extractYoutubeId(task.url);
  if (ytId) return `https://i.ytimg.com/vi/${ytId}/default.jpg`;
  return null;
}

function hasScript(task) {
  return Boolean(String(task?.script ?? "").trim());
}

function hasVoiceOver(task) {
  return Boolean(String(task?.voiceOverStoredName ?? "").trim());
}

function sortVoiceOverTasksForDisplay(a, b) {
  const idA = a.customVideoId != null ? Number(a.customVideoId) : Infinity;
  const idB = b.customVideoId != null ? Number(b.customVideoId) : Infinity;
  if (idA !== idB) return idA - idB;
  return String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" });
}

function sanitizeFilenameBase(title) {
  const s = String(title || "script")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return s || "script";
}

function downloadScriptTxt(task, dateKey) {
  const body = String(task.script ?? "").trim();
  if (!body) {
    toast.error("No script on this task");
    return;
  }
  const base = sanitizeFilenameBase(task.title);
  const dk = dateKey || "schedule";
  const name = `${base}-${dk}.txt`;
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("Script downloaded");
}

function PlatformIcon({ platform, size = 14 }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.website;
  const Icon = meta.icon;
  return <Icon size={size} className={`${meta.color} flex-shrink-0`} />;
}

function ScriptViewModal({ task, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!task) return null;
  const body = String(task.script ?? "").trim();
  
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-labelledby="script-view-title"
        className="relative z-10 flex w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[40rem] flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border-t sm:border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300"
      >
        {/* Grab bar for mobile bottom-sheet feel */}
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3 sm:hidden shrink-0" />
        
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/80 dark:bg-gray-900/50">
          <div className="min-w-0">
            <h2 id="script-view-title" className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
              Script View
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 min-h-[15rem] overflow-y-auto vo-script-scrollbar bg-gray-50/55 dark:bg-gray-955/20 px-5 py-4">
          {body ? (
            <pre className="whitespace-pre-wrap break-words text-[13px] sm:text-sm leading-relaxed text-gray-800 dark:text-gray-100 font-sans">
              {body}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <FileText size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No script available for this task.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/90 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={() => downloadScriptTxt(task, null)}
            disabled={!body}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-blue-500/20"
          >
            <Download size={14} /> Download Script (.txt)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteVoiceOverModal({ task, onClose, onConfirm, loading }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  if (!task) return null;
  const fileName = String(task.voiceOverOriginalName || "").trim() || "Uploaded file";

  return (
    <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onClose();
        }}
        aria-label="Close"
      />
      <div
        role="alertdialog"
        aria-labelledby="vo-delete-title"
        aria-describedby="vo-delete-desc"
        className="relative z-10 w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-2xl border-t sm:border border-red-200/80 dark:border-red-900/50 bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300"
      >
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3 sm:hidden shrink-0" />
        
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <Trash2 size={20} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="vo-delete-title" className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              Remove voice-over?
            </h2>
            <p id="vo-delete-desc" className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              This removes the audio file from this task. You can upload a new file later.
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-105 dark:border-gray-850">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">File Name</p>
              <p className="text-xs text-gray-800 dark:text-gray-200 mt-1 truncate font-semibold" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-850 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-1.5 min-w-[7.5rem] px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 shadow-sm shadow-red-500/20 active:scale-95"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>{loading ? "Removing…" : "Remove"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceOverTaskRow({
  task,
  dateKey,
  onReload,
  uploadingTaskId,
  setUploadingTaskId,
  deletingTaskId,
  setDeletingTaskId,
  voiceOverDownloadingIds,
  onVoiceOverDownload,
  playingTaskId,
  audioPlaying,
  audioLoading,
  onPlayToggle,
  uploadProgress,
  setUploadProgress,
}) {
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scriptDownloadBusy, setScriptDownloadBusy] = useState(false);
  const taskUrl = getTaskUrl(task);
  const thumb = getTaskThumbnail(task);
  const platform = task.platform || "youtube";
  const scriptOk = hasScript(task);
  const voOk = hasVoiceOver(task);
  const taskKey = String(task._id);

  const busyUpload = uploadingTaskId === taskKey;
  const busyDelete = deletingTaskId === taskKey;
  const busyVoDownload = voiceOverDownloadingIds?.has(taskKey) ?? false;
  const rowBlocking = busyUpload || busyDelete || busyVoDownload;

  const isPlayingThisTask = playingTaskId === taskKey;

  const handleVoiceFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    if (!isVoiceOverFileAllowed(file)) {
      toast.error(`Unsupported file type. Allowed: ${voiceOverFileTypeHint()}`);
      return;
    }
    setUploadingTaskId(taskKey);
    setUploadProgress(0);

    const startTime = Date.now();
    let intervalId;
    
    // Simulated smooth progress up to 99% over 5 seconds
    const duration = 5000; // 5 seconds
    const intervalTime = 50; // Update every 50ms
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    intervalId = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(intervalId);
        setUploadProgress(99);
      } else {
        const pct = Math.min(Math.round((currentStep / totalSteps) * 99), 99);
        setUploadProgress(pct);
      }
    }, intervalTime);

    try {
      // Run the upload request
      await uploadVoiceOverFile(task._id, file);

      // Clear the simulation interval
      clearInterval(intervalId);

      // Calculate how much time is remaining to reach 5 seconds
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);

      if (remaining > 0) {
        // Animate the remaining progress smoothly to 100% over the remaining time
        const startProgress = currentStep >= totalSteps ? 99 : Math.round((currentStep / totalSteps) * 99);
        const stepsLeft = Math.ceil(remaining / 50);
        let currentStepLeft = 0;

        await new Promise((resolve) => {
          const finalInterval = setInterval(() => {
            currentStepLeft++;
            if (currentStepLeft >= stepsLeft) {
              clearInterval(finalInterval);
              setUploadProgress(100);
              resolve();
            } else {
              const progressDiff = 100 - startProgress;
              const nextPct = Math.round(startProgress + (currentStepLeft / stepsLeft) * progressDiff);
              setUploadProgress(Math.min(nextPct, 100));
            }
          }, 50);
        });
      } else {
        setUploadProgress(100);
        // Small delay to let the user see the 100% before hiding
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      toast.success("Voice-over uploaded");
      await onReload();
    } catch (err) {
      clearInterval(intervalId);
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingTaskId(null);
      setUploadProgress(0);
    }
  };

  const handleDownloadScriptTxt = () => {
    if (!scriptOk || rowBlocking || scriptDownloadBusy) return;
    setScriptDownloadBusy(true);
    queueMicrotask(() => {
      try {
        downloadScriptTxt(task, dateKey);
      } finally {
        setScriptDownloadBusy(false);
      }
    });
  };

  const handleConfirmDeleteVoice = async () => {
    setDeletingTaskId(taskKey);
    try {
      await api.delete(`/video-tasks/${task._id}/voice-over`);
      toast.success("Voice-over removed");
      setDeleteModalOpen(false);
      await onReload();
    } catch {
      toast.error("Failed to remove file");
    } finally {
      setDeletingTaskId(null);
    }
  };

  const scriptActionsLocked = !scriptOk || rowBlocking || scriptDownloadBusy;
  const canUploadVo = scriptOk && !busyUpload && !rowBlocking;
  
  const uploadLabelTitle = !scriptOk
    ? "Add a script to this task in Production Hub before uploading voice-over"
    : busyUpload
      ? "Uploading…"
      : rowBlocking
        ? "Wait for the current action to finish"
        : "Upload voice-over (audio file)";

  const uploadIdleClasses = canUploadVo
    ? "cursor-pointer border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:scale-95 shadow-sm"
    : "cursor-not-allowed border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 text-gray-400 dark:text-gray-600";

  const uploadBusyClasses =
    "pointer-events-none cursor-wait border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-200 shadow-inner";

  return (
    <>
      {scriptModalOpen && <ScriptViewModal task={task} onClose={() => setScriptModalOpen(false)} />}
      {deleteModalOpen && (
        <DeleteVoiceOverModal
          task={task}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDeleteVoice}
          loading={busyDelete}
        />
      )}
      
      <div className="group flex flex-col p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 hover:border-blue-400/60 dark:hover:border-blue-700/60 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
          {/* Media and Text Container */}
          <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 flex-1">
            {thumb ? (
              <a
                href={taskUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-16 h-10 sm:w-20 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative ring-1 ring-black/5 block group-hover:scale-105 transition-transform"
              >
                <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ExternalLink size={12} className="drop-shadow" />
                </span>
              </a>
            ) : (
              <div className="flex-shrink-0 w-16 h-10 sm:w-20 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200/60 dark:border-gray-700/60">
                <PlatformIcon platform={platform} size={18} />
              </div>
            )}
            
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {task.title}
              </h3>
              
              {/* Badges list */}
              <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-1">
                {task.customVideoId && (
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-950/80 dark:bg-blue-950/40 px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 shadow-sm">
                    ID: {task.customVideoId}
                  </span>
                )}
                {scriptOk ? (
                  <span className="inline-flex items-center rounded-md sm:rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-950/60 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Script Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md sm:rounded-lg border border-dashed border-amber-300 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-955/20 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Needs Script
                  </span>
                )}
                
                {scriptOk && voOk && (
                  <span className="inline-flex items-center rounded-md sm:rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-950/60 dark:bg-indigo-950/40 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    VO Ready
                  </span>
                )}
                
                {voOk && (
                  <span
                    className="min-w-0 max-w-[10rem] sm:max-w-[12rem] truncate rounded-md sm:rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/80 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-gray-600 dark:text-gray-300"
                    title={task.voiceOverOriginalName || "Uploaded file"}
                  >
                    🎧 {task.voiceOverOriginalName || "Uploaded file"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Container */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-105 sm:pt-0 sm:border-0 sm:justify-end shrink-0">
            
            {/* Custom inline stream play trigger */}
            {voOk && (
              <button
                type="button"
                onClick={() => onPlayToggle?.(task)}
                disabled={rowBlocking}
                className={`h-8 px-2.5 sm:h-9 sm:px-3 inline-flex items-center justify-center gap-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isPlayingThisTask
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 active:scale-95"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
                }`}
              >
                {audioLoading && isPlayingThisTask ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isPlayingThisTask && audioPlaying ? (
                  <Pause size={12} />
                ) : (
                  <Play size={12} />
                )}
                <span>{isPlayingThisTask && audioPlaying ? "Playing" : "Listen"}</span>
              </button>
            )}

            {/* Script view button */}
            <button
              type="button"
              disabled={scriptActionsLocked}
              onClick={() => setScriptModalOpen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-55 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 active:scale-95"
              title={!scriptOk ? "No script on this task" : "View script"}
              aria-label="View script"
            >
              <Eye size={14} />
            </button>

            {/* Script download button */}
            <button
              type="button"
              disabled={scriptActionsLocked}
              onClick={handleDownloadScriptTxt}
              className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-55 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 active:scale-95"
              title="Download script as .txt"
              aria-label="Download script"
            >
              {scriptDownloadBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
            </button>

            {/* Audio Upload element wrapper */}
            <label
              className={`h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 ${
                busyUpload ? uploadBusyClasses : uploadIdleClasses
              }`}
              title={uploadLabelTitle}
            >
              {busyUpload ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <input
                type="file"
                accept={VOICE_OVER_ACCEPT}
                className="sr-only"
                disabled={!canUploadVo || busyUpload}
                onChange={handleVoiceFileChange}
                aria-label={uploadLabelTitle}
              />
            </label>

            {/* Optional Audio Actions (Download, Delete) */}
            {voOk && (
              <>
                <button
                  type="button"
                  disabled={rowBlocking}
                  onClick={() => onVoiceOverDownload?.(task)}
                  className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-55 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 active:scale-95"
                  title="Download voice-over audio file"
                  aria-label="Download voice-over"
                >
                  {busyVoDownload ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileAudio size={14} />
                  )}
                </button>
                
                <button
                  type="button"
                  disabled={rowBlocking}
                  onClick={() => setDeleteModalOpen(true)}
                  className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove voice-over"
                  aria-label="Remove voice-over"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        {busyUpload && (
          <div className="w-full mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <Loader2 size={12} className="animate-spin" /> Uploading voice-over...
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DateSection({
  dateKey,
  tasks,
  defaultOpen,
  onReload,
  uploadingTaskId,
  setUploadingTaskId,
  deletingTaskId,
  setDeletingTaskId,
  voiceOverDownloadingIds,
  onVoiceOverDownload,
  playingTaskId,
  audioPlaying,
  audioLoading,
  onPlayToggle,
  uploadProgress,
  setUploadProgress,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/40 dark:bg-gray-900/20 overflow-hidden shadow-sm hover:shadow transition-shadow duration-300">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 text-left bg-gray-50/90 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-955 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="text-gray-400">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{formatDateLabel(dateKey)}</span>
          <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200/80 dark:bg-gray-850 text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
      </button>
      {open && (
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-950/10">
          {tasks.map((t) => (
            <VoiceOverTaskRow
              key={t._id}
              task={t}
              dateKey={dateKey}
              onReload={onReload}
              uploadingTaskId={uploadingTaskId}
              setUploadingTaskId={setUploadingTaskId}
              deletingTaskId={deletingTaskId}
              setDeletingTaskId={setDeletingTaskId}
              voiceOverDownloadingIds={voiceOverDownloadingIds}
              onVoiceOverDownload={onVoiceOverDownload}
              playingTaskId={playingTaskId}
              audioPlaying={audioPlaying}
              audioLoading={audioLoading}
              onPlayToggle={onPlayToggle}
              uploadProgress={uploadProgress}
              setUploadProgress={setUploadProgress}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VoiceOver() {
  const [scheduleTasks, setScheduleTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [voiceOverDownloadingIds, setVoiceOverDownloadingIds] = useState(() => new Set());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Custom Audio Player State
  const audioRef = useRef(null);
  const [playingTaskId, setPlayingTaskId] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [audioMuted, setAudioMuted] = useState(false);

  const handleStopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTaskId(null);
    setAudioPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  const handleVoiceOverDownload = useCallback(async (task) => {
    const rawId = task?._id;
    if (rawId == null || rawId === "") return;
    const idKey = String(rawId);
    setVoiceOverDownloadingIds((prev) => new Set(prev).add(idKey));
    try {
      await downloadVoiceOverFile(task);
      toast.success("Download started");
    } catch (e) {
      toast.error(e.message || "Download failed");
    } finally {
      setVoiceOverDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(idKey);
        return next;
      });
    }
  }, []);

  const handleTogglePlay = useCallback(async (task) => {
    const taskKey = String(task._id);
    
    if (playingTaskId === taskKey) {
      if (audioRef.current) {
        if (audioPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    setPlayingTaskId(taskKey);
    setAudioLoading(true);
    setAudioProgress(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    try {
      const res = await httpClient.get(`/video-tasks/${task._id}/voice-over`, {
        responseType: "blob",
        timeout: 120_000,
      });
      const blob = res.data;
      const u = URL.createObjectURL(blob);
      setAudioUrl(u);
    } catch (e) {
      toast.error("Failed to load audio stream");
      setPlayingTaskId(null);
      setAudioLoading(false);
    }
  }, [playingTaskId, audioUrl, audioPlaying]);

  const handleSeek = useCallback((percentage) => {
    if (audioRef.current && audioDuration) {
      const newTime = (percentage / 100) * audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioProgress(percentage);
      setAudioCurrentTime(newTime);
    }
  }, [audioDuration]);

  const handleVolumeChange = useCallback((v) => {
    setAudioVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setAudioMuted((m) => {
      const nextMuted = !m;
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
      }
      return nextMuted;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await httpClient.get("/video-tasks?bucket=schedule");
      setScheduleTasks(data || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      // Clean up playing audio URL on unmount
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [load]);

  // Sync state changes with native HTML5 audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setAudioPlaying(true);
    const handlePause = () => setAudioPlaying(false);
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setAudioCurrentTime(audio.currentTime);
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
      setAudioLoading(false);
      audio.play().catch(() => {});
    };
    const handleEnded = () => {
      setAudioPlaying(false);
      setAudioProgress(100);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // Computed: KPI metrics (computed based on selected date if date is selected, otherwise all tasks)
  const metrics = useMemo(() => {
    let list = scheduleTasks || [];
    if (filterDate) {
      list = list.filter((t) => toDateKey(t.scheduledDate) === filterDate);
    }
    const total = list.length;
    const missingScript = list.filter((t) => !hasScript(t)).length;
    const awaitingVo = list.filter((t) => hasScript(t) && !hasVoiceOver(t)).length;
    const voCompleted = list.filter((t) => hasScript(t) && hasVoiceOver(t)).length;
    return { total, missingScript, awaitingVo, voCompleted };
  }, [scheduleTasks, filterDate]);

  // Computed: Filtered Tasks
  const filteredTasks = useMemo(() => {
    return (scheduleTasks || []).filter((t) => {
      if (filterDate) {
        const taskDate = toDateKey(t.scheduledDate);
        if (taskDate !== filterDate) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(t.title || "").toLowerCase().includes(q) ||
        String(t.notes || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      const scriptOk = hasScript(t);
      const voOk = hasVoiceOver(t);

      if (statusFilter === "no-script") return !scriptOk;
      if (statusFilter === "no-vo") return scriptOk && !voOk;
      if (statusFilter === "vo-ready") return scriptOk && voOk;

      return true;
    });
  }, [scheduleTasks, searchQuery, statusFilter, filterDate]);

  // Computed: Group tasks by scheduled date
  const dateGroups = useMemo(() => {
    const list = filteredTasks.filter((t) => t.scheduledDate && toDateKey(t.scheduledDate));
    const map = {};
    list.forEach((t) => {
      const key = toDateKey(t.scheduledDate);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    Object.values(map).forEach((arr) => {
      arr.sort(sortVoiceOverTasksForDisplay);
    });
    const keys = Object.keys(map).sort((a, b) => a.localeCompare(b));
    return keys.map((key) => ({ key, tasks: map[key] }));
  }, [filteredTasks]);

  const todayKey = toDateKey(new Date());

  // Find active playing task details
  const activePlayingTask = useMemo(() => {
    return scheduleTasks.find((t) => String(t._id) === playingTaskId);
  }, [scheduleTasks, playingTaskId]);

  function formatTime(sec) {
    if (Number.isNaN(sec) || sec === Infinity) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <AdminLayout
      title="Voice-over Console"
      titleInfo="A high-performance workspace for recording, streaming, and managing Voice-over assets."
      icon={Mic}
      contentFit
      noPadding
    >
      <div className={`flex flex-col h-full min-h-0 overflow-hidden max-w-5xl mx-auto w-full gap-3 sm:gap-4 px-3 sm:px-4 pt-2 ${activePlayingTask ? "pb-28" : "pb-4"}`}>
        
        {/* Search and Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-4 bg-white/70 dark:bg-gray-900/60 backdrop-blur border border-gray-200/80 dark:border-gray-800/80 rounded-xl sm:rounded-2xl">
          <div className="flex items-center gap-2 w-full sm:flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title..."
                className="w-full pl-8 sm:pl-10 pr-8 py-1.5 sm:py-2 border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl bg-white dark:bg-gray-955 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative shrink-0 flex items-center">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-2.5 pr-8 py-1.5 sm:py-2 border border-gray-200 dark:border-gray-800 rounded-lg sm:rounded-xl bg-white dark:bg-gray-955 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-gray-900 dark:text-white cursor-pointer"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title="Clear date filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-1 shrink-0 hidden sm:inline-block">Filter:</span>
            
            {/* Mobile View: Dropdown Select */}
            <div className="block sm:hidden flex-1 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                {[
                  { value: "all", label: `All (${metrics.total})` },
                  { value: "no-script", label: `Script Pending (${metrics.missingScript})` },
                  { value: "no-vo", label: `VO Pending (${metrics.awaitingVo})` },
                  { value: "vo-ready", label: `VO Complete (${metrics.voCompleted})` },
                ].map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500 dark:text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Desktop View: Button Group */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
              {[
                { value: "all", label: `All (${metrics.total})` },
                { value: "no-script", label: `Script Pending (${metrics.missingScript})` },
                { value: "no-vo", label: `VO Pending (${metrics.awaitingVo})` },
                { value: "vo-ready", label: `VO Complete (${metrics.voCompleted})` },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 active:scale-95 ${
                    statusFilter === f.value
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-0.5 sm:mx-1 shrink-0" />

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
              title="Refresh lists"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Content list block */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-gray-500 dark:text-gray-400">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <p className="text-sm">Loading tasks…</p>
          </div>
        ) : dateGroups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/20 text-gray-500 dark:text-gray-400">
            <Mic size={36} className="mb-3 opacity-30 text-gray-400" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No matching scheduled tasks</p>
            <p className="text-xs mt-1 max-w-sm px-4">
              {searchQuery || statusFilter !== "all" || filterDate
                ? "Try resetting your search query, status filter, or date filter." 
                : "Schedule content with a date in the Production Hub to see it here."}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {dateGroups.map((g) => (
              <DateSection
                key={g.key}
                dateKey={g.key}
                tasks={g.tasks}
                defaultOpen={g.key === todayKey || g.key < todayKey}
                onReload={load}
                uploadingTaskId={uploadingTaskId}
                setUploadingTaskId={setUploadingTaskId}
                deletingTaskId={deletingTaskId}
                setDeletingTaskId={setDeletingTaskId}
                voiceOverDownloadingIds={voiceOverDownloadingIds}
                onVoiceOverDownload={handleVoiceOverDownload}
                playingTaskId={playingTaskId}
                audioPlaying={audioPlaying}
                audioLoading={audioLoading}
                onPlayToggle={handleTogglePlay}
                uploadProgress={uploadProgress}
                setUploadProgress={setUploadProgress}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hidden audio engine */}
      <audio ref={audioRef} src={audioUrl || ""} className="hidden" />

      {/* Premium floating custom audio player widget */}
      {activePlayingTask && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[80] bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom duration-300">
          
          {/* Header Info */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                <Music size={18} className={audioPlaying ? "animate-pulse" : ""} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Now Playing</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={activePlayingTask.title}>
                  {activePlayingTask.title}
                </p>
              </div>
            </div>
            <button
              onClick={handleStopAudio}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              title="Close player"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar and Scrubber */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
              <span>{formatTime(audioCurrentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
            <div className="relative group/progress flex items-center h-2">
              <input
                type="range"
                min="0"
                max="100"
                value={audioProgress}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Player controls bar */}
          <div className="flex items-center justify-between">
            {/* Play/Pause controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTogglePlay(activePlayingTask)}
                disabled={audioLoading}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {audioLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : audioPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </button>
              
              <button
                onClick={() => handleVoiceOverDownload(activePlayingTask)}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-gray-900 transition-colors active:scale-95"
                title="Download Audio"
              >
                <Download size={16} />
              </button>
            </div>

            {/* Volume controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {audioMuted || audioVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioMuted ? 0 : audioVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
