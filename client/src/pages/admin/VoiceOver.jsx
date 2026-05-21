import { useState, useEffect, useCallback, useMemo } from "react";
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

/** Tasks with script first, then title A–Z */
function sortVoiceOverTasksForDisplay(a, b) {
  const sa = hasScript(a) ? 1 : 0;
  const sb = hasScript(b) ? 1 : 0;
  if (sa !== sb) return sb - sa;
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

/** Icon action: clear enabled vs disabled (dashed / muted) for Voice-over row toolbar */
function VoToolbarIconButton({
  type = "button",
  disabled,
  busy,
  onClick,
  title,
  ariaLabel,
  children,
  variant,
}) {
  const tones = {
    indigo:
      "enabled:border-indigo-300 enabled:dark:border-indigo-600 enabled:bg-gradient-to-b enabled:from-indigo-50 enabled:to-white enabled:dark:from-indigo-950/60 enabled:dark:to-gray-900 enabled:text-indigo-800 enabled:dark:text-indigo-100 enabled:shadow-sm enabled:hover:border-indigo-400 enabled:hover:shadow-md enabled:hover:dark:border-indigo-500 enabled:active:scale-[0.97]",
    violet:
      "enabled:border-violet-300 enabled:dark:border-violet-600 enabled:bg-gradient-to-b enabled:from-violet-50 enabled:to-white enabled:dark:from-violet-950/50 enabled:dark:to-gray-900 enabled:text-violet-800 enabled:dark:text-violet-100 enabled:shadow-sm enabled:hover:border-violet-400 enabled:hover:shadow-md enabled:hover:dark:border-violet-500 enabled:active:scale-[0.97]",
    emerald:
      "enabled:border-emerald-300 enabled:dark:border-emerald-600 enabled:bg-gradient-to-b enabled:from-emerald-50 enabled:to-white enabled:dark:from-emerald-950/45 enabled:dark:to-gray-900 enabled:text-emerald-800 enabled:dark:text-emerald-100 enabled:shadow-sm enabled:hover:border-emerald-400 enabled:hover:shadow-md enabled:hover:dark:border-emerald-500 enabled:active:scale-[0.97]",
    emeraldOutline:
      "enabled:border-emerald-300 enabled:dark:border-emerald-600 enabled:bg-white enabled:dark:bg-gray-900/80 enabled:text-emerald-800 enabled:dark:text-emerald-200 enabled:shadow-sm enabled:hover:bg-emerald-50 enabled:hover:dark:bg-emerald-950/50 enabled:hover:border-emerald-400 enabled:active:scale-[0.97]",
    dangerGhost:
      "enabled:border border-transparent enabled:text-red-600 enabled:dark:text-red-400 enabled:bg-transparent enabled:hover:bg-red-50 enabled:hover:dark:bg-red-950/35 enabled:hover:border-red-200/80 enabled:dark:hover:border-red-900/50 enabled:active:scale-[0.97]",
  };
  const disabledLook =
    "cursor-not-allowed border border-dashed border-gray-300 bg-gray-100 text-gray-400 shadow-none dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-500";

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900";

  const stateClass = disabled || busy ? disabledLook : tones[variant];

  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={`${base} ${stateClass}`}
    >
      {children}
    </button>
  );
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-labelledby="script-view-title"
        className="relative z-10 flex w-full max-w-2xl max-h-[min(85vh,40rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/90 dark:bg-gray-800/80">
          <div className="min-w-0">
            <h2 id="script-view-title" className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              Script
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-[12rem] max-h-[min(52vh,28rem)] min-w-0 overflow-y-scroll vo-script-scrollbar rounded-lg mx-3 mb-1 border border-gray-200/90 dark:border-gray-600/80 bg-gray-50/80 dark:bg-gray-950/40 px-3 py-3">
          {body ? (
            <pre className="whitespace-pre-wrap break-words text-[13px] sm:text-sm leading-relaxed text-gray-800 dark:text-gray-100 font-sans pr-1">
              {body}
            </pre>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No script for this task.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 bg-gray-50/80 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-colors"
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
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onClose();
        }}
        aria-label="Close"
      />
      <div
        role="alertdialog"
        aria-labelledby="vo-delete-title"
        aria-describedby="vo-delete-desc"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-red-200/80 dark:border-red-900/50 bg-white dark:bg-gray-900 shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-red-100 dark:border-red-950/50 px-5 py-4 bg-red-50/90 dark:bg-red-950/30">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
            <Trash2 size={20} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="vo-delete-title" className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              Remove voice-over?
            </h2>
            <p id="vo-delete-desc" className="text-[12px] text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
              This removes the audio file from this task. You can upload a new file later.
            </p>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2 truncate" title={fileName}>
              File: <span className="text-gray-800 dark:text-gray-200">{fileName}</span>
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2" title={task.title}>
              {task.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!loading) onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 min-w-[7.5rem] px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} aria-hidden />}
            {loading ? "Removing…" : "Remove"}
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

  const handleVoiceFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    if (!isVoiceOverFileAllowed(file)) {
      toast.error(`Unsupported file type. Allowed: ${voiceOverFileTypeHint()}`);
      return;
    }
    setUploadingTaskId(taskKey);
    try {
      await uploadVoiceOverFile(task._id, file);
      toast.success("Voice-over uploaded");
      await onReload();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingTaskId(null);
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
    ? "cursor-pointer border-2 border-emerald-400/90 dark:border-emerald-500 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/50 dark:to-gray-900 text-emerald-800 dark:text-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-400 active:scale-[0.97]"
    : "cursor-not-allowed border border-dashed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/70 text-gray-400 dark:text-gray-500 shadow-none";

  const uploadBusyClasses =
    "pointer-events-none cursor-wait border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-200 shadow-inner";

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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-800/50">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {thumb ? (
          <a
            href={taskUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative ring-1 ring-black/5"
          >
            <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white">
              <ExternalLink size={10} />
            </span>
          </a>
        ) : (
          <div className="flex-shrink-0 w-20 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <PlatformIcon platform={platform} size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">{task.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 min-w-0">
            {scriptOk ? (
              <span className="inline-flex items-center rounded-md border border-emerald-200/90 bg-emerald-50/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                Script ready
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md border border-dashed border-amber-300/90 bg-amber-50/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-100">
                Needs script
              </span>
            )}
            {scriptOk && voOk && (
              <span className="inline-flex items-center rounded-md border border-teal-200/90 bg-teal-50/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-900 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-100">
                Voice-over ready
              </span>
            )}
            {voOk && (
              <span
                className="min-w-0 max-w-[11rem] sm:max-w-[14rem] truncate rounded-md border border-gray-200/90 bg-gray-50/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 dark:border-gray-600/80 dark:bg-gray-800/80 dark:text-gray-200"
                title={task.voiceOverOriginalName || "Uploaded file"}
              >
                {task.voiceOverOriginalName || "Uploaded file"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 sm:justify-end">
        <VoToolbarIconButton
          variant="indigo"
          disabled={scriptActionsLocked}
          onClick={() => setScriptModalOpen(true)}
          title={!scriptOk ? "No script on this task" : "View script"}
          ariaLabel="View script"
        >
          <Eye size={16} aria-hidden />
        </VoToolbarIconButton>
        <VoToolbarIconButton
          variant="violet"
          disabled={scriptActionsLocked}
          busy={scriptDownloadBusy}
          onClick={handleDownloadScriptTxt}
          title="Download script as .txt"
          ariaLabel="Download script"
        >
          {scriptDownloadBusy ? (
            <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
          ) : (
            <Download size={16} aria-hidden />
          )}
        </VoToolbarIconButton>

        <label
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
            busyUpload ? uploadBusyClasses : uploadIdleClasses
          }`}
          title={uploadLabelTitle}
        >
          {busyUpload ? <Loader2 size={16} className="animate-spin shrink-0" aria-hidden /> : <Upload size={16} aria-hidden />}
          <input
            type="file"
            accept={VOICE_OVER_ACCEPT}
            className="sr-only"
            disabled={!canUploadVo || busyUpload}
            aria-label={uploadLabelTitle}
            onChange={handleVoiceFileChange}
          />
        </label>

        {voOk && (
          <>
            <VoToolbarIconButton
              variant="emeraldOutline"
              disabled={rowBlocking}
              busy={busyVoDownload}
              onClick={() => onVoiceOverDownload?.(task)}
              title="Download uploaded voice-over file"
              ariaLabel="Download uploaded voice-over file"
            >
              {busyVoDownload ? (
                <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
              ) : (
                <FileAudio size={16} aria-hidden />
              )}
            </VoToolbarIconButton>
            <VoToolbarIconButton
              variant="dangerGhost"
              disabled={rowBlocking}
              onClick={() => setDeleteModalOpen(true)}
              title="Remove voice-over"
              ariaLabel="Remove voice-over"
            >
              <Trash2 size={16} aria-hidden />
            </VoToolbarIconButton>
          </>
        )}
      </div>
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
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-gray-50/90 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400">{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{formatDateLabel(dateKey)}</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">({tasks.length})</span>
        </div>
      </button>
      {open && (
        <div className="p-3 space-y-2 border-t border-gray-100 dark:border-gray-800">
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
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [voiceOverDownloadingIds, setVoiceOverDownloadingIds] = useState(() => new Set());

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
  }, [load]);

  const dateGroups = useMemo(() => {
    const list = (scheduleTasks || []).filter((t) => t.scheduledDate && toDateKey(t.scheduledDate));
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
  }, [scheduleTasks]);

  const todayKey = toDateKey(new Date());

  return (
    <AdminLayout
      title="Voice-over"
      titleInfo="Scheduled Production Hub tasks by date — tasks with a script appear first. View or download scripts; upload voice-over only when a script exists on the task."
      icon={Mic}
      contentFit
    >
      <div className="flex flex-col h-full min-h-0 max-w-5xl mx-auto w-full gap-3 px-1 sm:px-0 pb-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-gray-500 dark:text-gray-400">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <p className="text-sm">Loading tasks…</p>
          </div>
        ) : dateGroups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            <Mic size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No scheduled tasks</p>
            <p className="text-xs mt-1 max-w-sm">Schedule content with a date in Production Hub to see it here.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
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
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
