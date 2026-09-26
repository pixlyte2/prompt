import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  UserPlus,
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

const ASSIGNEE_COLORS = [
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200";
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
      setScheduledDate(toDateKey(editPlan.scheduledDate));
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

  const canSave = Boolean(title.trim() && channelId);

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
        toast.success(scheduledDate ? "Added to planner" : "Added to backlog");
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
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
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

        <div className="max-h-[65vh] space-y-3 overflow-y-auto px-5 py-4 custom-scrollbar">
          <div>
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
            <label className={labelClass}>Thumbnail (optional)</label>
            {previewUrl && (
              <div className="mb-2 flex items-center gap-2">
                <img
                  src={previewUrl}
                  alt=""
                  className="h-10 w-16 rounded object-cover bg-gray-100 dark:bg-gray-700"
                />
                <button
                  type="button"
                  className="text-[11px] font-semibold text-red-600 hover:underline dark:text-red-400"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailRemoved(true);
                    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept={THUMBNAIL_TYPES.join(",")}
              onChange={handleThumbnailChange}
              className="w-full text-[11px] text-gray-700 file:mr-2 file:rounded-lg file:border-0 file:bg-gray-200 file:px-2 file:py-1.5 file:text-[10px] file:font-semibold file:text-gray-800 hover:file:bg-gray-300 dark:text-gray-200 dark:file:bg-gray-700 dark:file:text-gray-100 dark:hover:file:bg-gray-600"
            />
            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
              Max 25 KB. Formats: JPG, PNG, WebP.
            </p>
          </div>

          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className={inputClass}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className={`${labelClass} mb-0`}>Scheduled Date</label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                    !scheduledDate ? "text-amber-600 dark:text-amber-400" : "text-gray-400"
                  }`}
                >
                  Backlog
                </span>
                <button
                  type="button"
                  onClick={() => setScheduledDate(scheduledDate ? null : tomorrowKey())}
                  title="Move this plan to the backlog"
                  aria-pressed={!scheduledDate}
                  className={`relative inline-flex h-[18px] w-[32px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !scheduledDate ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-gray-200 dark:bg-gray-700"
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
              onChange={(e) => setScheduledDate(e.target.value || null)}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                !scheduledDate
                  ? "border-gray-100 bg-gray-50/50 text-gray-400 opacity-60 dark:border-gray-800 dark:bg-gray-800/50"
                  : "border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              }`}
            />
          </div>

          <div>
            <label className={labelClass}>Video Counts</label>
            <div className="grid grid-cols-2 gap-2">
              {COUNT_ROWS.map(({ label, planned, format }) => (
                <label key={label} className="block">
                  <span className={`mb-1 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold ${FORMAT_PILL[format]}`}>
                    {label}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={counts[planned]}
                    onChange={(e) => setCount(planned, e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
              Planned output for this date
            </p>
          </div>

          <div>
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
            <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
              Total raw footage minutes for this plan (e.g. 600 = 10 hours)
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">First Cut</p>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                Mark when the first cut is ready for review
              </p>
            </div>
            <div className="flex items-center gap-2">
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

          <div>
            <label className={labelClass}>Assigned to</label>
            {contentManagers.length === 0 ? (
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800/50">
                <UserPlus size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <p className="text-[11px] leading-tight text-gray-500 dark:text-gray-400">
                  No content managers yet. Create one in Users to assign this plan.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {contentManagers.map((user, index) => {
                    const isSelected = assignedTo === String(user._id);
                    const pillClass = ASSIGNEE_COLORS[index % ASSIGNEE_COLORS.length];
                    return (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => setAssignedTo(isSelected ? "" : String(user._id))}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                          isSelected
                            ? `${pillClass} border-current shadow-sm`
                            : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                        }`}
                      >
                        {user.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  Select one, or none to leave unassigned
                </p>
              </>
            )}
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
              className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="ml-auto inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 sm:px-4"
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isEdit ? (
                <Pencil size={12} />
              ) : scheduledDate ? (
                <Plus size={12} />
              ) : (
                <ListChecks size={12} />
              )}
              {isEdit ? "Update Plan" : scheduledDate ? "Schedule Plan" : "Add to Backlog"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
