import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

const MAX_THUMBNAIL_BYTES = 25 * 1024;
const THUMBNAIL_TYPES = ["image/jpeg", "image/png", "image/webp"];
const RECENT_CHANNELS_KEY = "channelPlanner_recentChannels";

const COUNT_ROWS = [
  { label: "Long videos", planned: "longPlanned", format: "long" },
  { label: "Short videos", planned: "shortPlanned", format: "short" },
];

const FORMAT_PILL = {
  long: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  short: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const inputClass = "buffer-input min-h-10 text-sm";
const compactInputClass = "buffer-input min-h-10 text-sm tabular-nums text-center px-1.5";
const dateInputClass =
  "w-full min-h-10 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
const labelClass = "block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1";

function readRecentChannels() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_CHANNELS_KEY) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function rememberChannel(channelId) {
  const recent = readRecentChannels().filter((id) => id !== String(channelId));
  localStorage.setItem(
    RECENT_CHANNELS_KEY,
    JSON.stringify([String(channelId), ...recent].slice(0, 8)),
  );
}

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function tomorrowKey() {
  return toDateKey(new Date(Date.now() + 86_400_000));
}

export default function ChannelPlanModal({
  open,
  onClose,
  onSaved,
  channels,
  contentManagers,
  editPlan,
}) {
  const isEdit = Boolean(editPlan);
  const [channelId, setChannelId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [counts, setCounts] = useState({
    longPlanned: 0,
    shortPlanned: 0,
  });
  const [footageMinutes, setFootageMinutes] = useState("");
  const [firstCut, setFirstCut] = useState(false);
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const thumbnailInputRef = useRef(null);

  if (open && !initialized) {
    setError(null);
    setThumbnailFile(null);
    setThumbnailRemoved(false);
    if (editPlan) {
      setChannelId(String(editPlan.channelId?._id || editPlan.channelId || ""));
      setTitle(editPlan.title || "");
      setScheduledDate(toDateKey(editPlan.scheduledDate) || tomorrowKey());
      setCounts({
        longPlanned: editPlan.longPlanned ?? 0,
        shortPlanned: editPlan.shortPlanned ?? 0,
      });
      setFootageMinutes(
        editPlan.footageMinutes != null && editPlan.footageMinutes !== 0
          ? String(editPlan.footageMinutes)
          : "",
      );
      setFirstCut(Boolean(editPlan.firstCut));
      setNotes(editPlan.notes || "");
      setAssignedTo(String(editPlan.assignedTo?._id || editPlan.assignedTo || ""));
    } else {
      setChannelId(String(readRecentChannels()[0] || channels[0]?._id || ""));
      setTitle("");
      setScheduledDate(tomorrowKey());
      setCounts({
        longPlanned: 0,
        shortPlanned: 0,
      });
      setFootageMinutes("");
      setFirstCut(false);
      setNotes("");
      setAssignedTo("");
    }
    setInitialized(true);
  }

  if (!open && initialized) {
    setInitialized(false);
  }

  const channelGroups = useMemo(() => {
    const ranks = new Map(readRecentChannels().map((id, index) => [id, index]));
    const sorted = [...channels].sort((a, b) => {
      const aRank = ranks.get(String(a._id)) ?? Infinity;
      const bRank = ranks.get(String(b._id)) ?? Infinity;
      return aRank === bRank ? a.name.localeCompare(b.name) : aRank - bRank;
    });
    return {
      frequent: sorted.filter((channel) => ranks.has(String(channel._id))),
      rest: sorted.filter((channel) => !ranks.has(String(channel._id))),
    };
  }, [channels]);

  const previewUrl = useMemo(() => {
    if (thumbnailFile) return URL.createObjectURL(thumbnailFile);
    if (thumbnailRemoved) return "";
    return editPlan?.thumbnail || "";
  }, [thumbnailFile, thumbnailRemoved, editPlan]);

  useEffect(() => {
    if (!thumbnailFile) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [thumbnailFile, previewUrl]);

  if (!open) return null;

  const canSave = Boolean(title.trim() && channelId && scheduledDate);

  const setCount = (field, value) => {
    setCounts((current) => ({ ...current, [field]: value }));
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!THUMBNAIL_TYPES.includes(file.type)) {
      toast.error("Unsupported image. Use JPG, PNG, or WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast.error(
        `Thumbnail is too large (${Math.ceil(file.size / 1024)} KB). Maximum is 25 KB.`,
      );
      event.target.value = "";
      return;
    }
    setThumbnailFile(file);
    setThumbnailRemoved(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = new FormData();
      payload.append("title", title.trim());
      payload.append("channelId", channelId);
      payload.append("scheduledDate", scheduledDate || "");
      payload.append("firstCut", String(firstCut));
      payload.append("notes", notes);
      payload.append("assignedTo", assignedTo);
      for (const { planned } of COUNT_ROWS) {
        payload.append(planned, String(Number(counts[planned]) || 0));
      }
      payload.append("footageMinutes", String(Number(footageMinutes) || 0));
      if (thumbnailFile) payload.append("thumbnail", thumbnailFile);
      if (thumbnailRemoved) payload.append("removeThumbnail", "true");

      if (isEdit) {
        await api.put(`/channel-plans/${editPlan._id}`, payload);
        toast.success("Updated");
      } else {
        await api.post("/channel-plans", payload);
        toast.success("Added to planner");
      }
      rememberChannel(channelId);
      onClose();
      await onSaved?.();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        (isEdit ? "Failed to update" : "Failed to add");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:rounded-2xl">
        <div className="mx-auto mt-2 h-1 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 sm:hidden" />
        <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Plan" : "Add Plan"}
            </h3>
            {isEdit && editPlan?.planId && (
              <span
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-black tabular-nums text-blue-800 dark:border-blue-700/60 dark:bg-blue-900/40 dark:text-blue-300"
                title={`Plan ID ${editPlan.planId}`}
              >
                #{editPlan.planId}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Plan long and short-form output for a channel
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-3 custom-scrollbar">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className={inputClass}
              />
            </div>
            <div className="w-full flex-shrink-0 sm:w-[9.5rem]">
              <label className={labelClass}>Thumbnail</label>
              <div className="flex min-h-10 items-center gap-1.5">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-8 w-12 flex-shrink-0 rounded object-cover bg-gray-100 dark:bg-gray-700"
                    />
                    <button
                      type="button"
                      className="flex-shrink-0 text-[10px] font-semibold text-red-600 hover:underline dark:text-red-400"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailRemoved(true);
                        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                      }}
                    >
                      Remove
                    </button>
                  </>
                ) : null}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept={THUMBNAIL_TYPES.join(",")}
                  onChange={handleThumbnailChange}
                  className="min-w-0 flex-1 text-[10px] text-gray-700 file:mr-0 file:rounded-lg file:border-0 file:bg-gray-200 file:px-1.5 file:py-1 file:text-[9px] file:font-semibold file:text-gray-800 hover:file:bg-gray-300 dark:text-gray-200 dark:file:bg-gray-700 dark:file:text-gray-100 dark:hover:file:bg-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
            <div className="min-w-0">
              <label className={labelClass}>Channel</label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a channel</option>
                {channelGroups.frequent.length > 0 && (
                  <optgroup label="Frequently used">
                    {channelGroups.frequent.map((channel) => (
                      <option key={channel._id} value={channel._id}>
                        {channel.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {channelGroups.rest.length > 0 && (
                  <optgroup label={channelGroups.frequent.length ? "All channels" : "Channels"}>
                    {channelGroups.rest.map((channel) => (
                      <option key={channel._id} value={channel._id}>
                        {channel.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Shoot date</label>
              <input
                type="date"
                value={scheduledDate || ""}
                onChange={(e) => setScheduledDate(e.target.value || tomorrowKey())}
                className={dateInputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 items-end gap-2">
            <div className="min-w-0">
              <label className={labelClass}>Footage Minutes</label>
              <input
                type="number"
                min="0"
                step="1"
                value={footageMinutes}
                onChange={(e) => setFootageMinutes(e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            {COUNT_ROWS.map(({ planned, format }) => (
              <div key={planned} className="min-w-0">
                <span className={`mb-1 inline-flex rounded-lg px-1 py-0.5 text-[9px] font-bold leading-none ${FORMAT_PILL[format]}`}>
                  {format === "long" ? "Long Vid" : "Short Video"}
                </span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={counts[planned]}
                  onChange={(e) => setCount(planned, e.target.value)}
                  className={`${compactInputClass} w-full`}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <label className={labelClass}>Assigned to</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className={inputClass}
                disabled={contentManagers.length === 0}
              >
                <option value="">Unassigned</option>
                {contentManagers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {contentManagers.length === 0 && (
                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                  No content managers yet — add one in Users
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 sm:min-h-10 sm:flex-col sm:items-center sm:justify-center sm:gap-0.5 sm:border-0 sm:px-2 sm:py-0 dark:border-gray-700">
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                First Cut
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                    firstCut ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                  }`}
                >
                  {firstCut ? "Ready" : "Pending"}
                </span>
                <button
                  type="button"
                  onClick={() => setFirstCut((value) => !value)}
                  title="Toggle first cut ready"
                  aria-pressed={firstCut}
                  className={`relative inline-flex h-[18px] w-[32px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    firstCut ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      firstCut ? "translate-x-[14px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add any notes…"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800/50">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-900/30 dark:bg-red-900/20">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
              <p className="text-[11px] font-medium leading-tight text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="flex flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="buffer-button-secondary flex-shrink-0 px-3 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="buffer-button-primary ml-auto inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs disabled:opacity-50 sm:px-4"
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isEdit ? (
                <Pencil size={12} />
              ) : (
                <Plus size={12} />
              )}
              {isEdit ? "Update Plan" : "Add to Production"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
