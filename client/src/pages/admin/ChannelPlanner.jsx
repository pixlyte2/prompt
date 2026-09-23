import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Image,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
import ChannelPlanModal from "../../components/ChannelPlanModal";
import ConfirmModal from "../../components/ConfirmModal";

const DATE_GROUP_PAGE_SIZE = 10;
const SELECTED_CHANNELS_KEY = "channelPlanner_selectedChannels";
const RECENT_CHANNELS_KEY = "channelPlanner_recentChannels";

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function formatDate(dateKey) {
  if (dateKey === "backlog") return "Backlog";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00`));
}

function FilterSegment({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-gray-200/60 bg-gray-100/80 p-1 backdrop-blur dark:border-gray-700/60 dark:bg-gray-800/80">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value
              ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
              : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200"
          }`}
        >
          {option.label}
          {option.count > 0 && (
            <span className="rounded-md bg-gray-200/80 px-1.5 py-0.5 text-[9px] font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-200">
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ChannelPicker({ channels, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const recent = useMemo(() => readStoredArray(RECENT_CHANNELS_KEY), []);
  const sorted = useMemo(() => {
    const ranks = new Map(recent.map((id, index) => [id, index]));
    return [...channels].sort((a, b) => {
      const ar = ranks.get(String(a._id)) ?? Infinity;
      const br = ranks.get(String(b._id)) ?? Infinity;
      return ar === br ? a.name.localeCompare(b.name) : ar - br;
    });
  }, [channels, recent]);

  const toggle = (id) => {
    const stringId = String(id);
    onChange(
      selectedIds.includes(stringId)
        ? selectedIds.filter((value) => value !== stringId)
        : [...selectedIds, stringId],
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-w-44 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        <span>{selectedIds.length ? `${selectedIds.length} channels selected` : "All channels"}</span>
        <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-700">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Channels</span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {sorted.map((channel, index) => {
              const checked = selectedIds.includes(String(channel._id));
              const showDivider = index > 0 && recent.includes(String(sorted[index - 1]._id)) && !recent.includes(String(channel._id));
              return (
                <div key={channel._id}>
                  {showDivider && <div className="my-1 border-t border-gray-100 dark:border-gray-700" />}
                  <button
                    type="button"
                    onClick={() => toggle(channel._id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 dark:border-gray-600"}`}>
                      {checked && <Check size={11} />}
                    </span>
                    <span className="truncate">{channel.name}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CountPill({ label, value, done }) {
  return (
    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${done ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"}`}>
      {label} {value || 0}
    </span>
  );
}

function ChannelPlanRow({ plan, onEdit, onDelete, onToggleStatus, onThumbnail }) {
  return (
    <div className="grid grid-cols-[48px_minmax(180px,1.7fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(120px,1fr)_96px] items-center gap-3 border-t border-gray-100 px-4 py-3 text-xs first:border-t-0 dark:border-gray-700/70">
      <button
        type="button"
        disabled={!plan.thumbnail}
        onClick={() => plan.thumbnail && onThumbnail(plan.thumbnail)}
        className="flex h-8 w-11 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400 disabled:cursor-default dark:bg-gray-700"
        title={plan.thumbnail ? "View thumbnail" : "No thumbnail"}
      >
        {plan.thumbnail ? (
          <img src={plan.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image size={14} />
        )}
      </button>
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-900 dark:text-gray-100" title={plan.title}>
          {plan.title.length > 60 ? `${plan.title.slice(0, 60)}…` : plan.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">
          {plan.channelId?.name || "Unknown channel"}
          {plan.assignedTo?.name ? ` · ${plan.assignedTo.name}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        <CountPill label="L plan" value={plan.longPlanned} />
        <CountPill label="L done" value={plan.longCompleted} done />
      </div>
      <div className="flex flex-wrap gap-1">
        <CountPill label="S plan" value={plan.shortPlanned} />
        <CountPill label="S done" value={plan.shortCompleted} done />
      </div>
      <span
        className="truncate rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        title={plan.notes || "No notes"}
      >
        {plan.notes || "No notes"}
      </span>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onToggleStatus(plan)}
          className={`rounded-lg p-1.5 transition ${plan.status === "completed" ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"}`}
          title={plan.status === "completed" ? "Reopen" : "Mark completed"}
        >
          <CheckCircle2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(plan)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function DateGroup(props) {
  const { group } = props;
  const [open, setOpen] = useState(true);
  const totals = group.totals;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 bg-gray-50/80 px-4 py-3 text-left hover:bg-gray-100/80 dark:bg-gray-800 dark:hover:bg-gray-700/70"
      >
        <div className="flex min-w-0 items-center gap-2">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatDate(group.date)}</span>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {group.tasks.length}
          </span>
        </div>
        <div className="hidden flex-wrap justify-end gap-1 sm:flex">
          <CountPill label="L plan" value={totals.longPlanned} />
          <CountPill label="L done" value={totals.longCompleted} done />
          <CountPill label="S plan" value={totals.shortPlanned} />
          <CountPill label="S done" value={totals.shortCompleted} done />
        </div>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-[48px_minmax(180px,1.7fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(120px,1fr)_96px] gap-3 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
              <span>Image</span><span>Plan</span><span>Long videos</span><span>Short videos</span><span>Notes</span><span className="text-right">Actions</span>
            </div>
            {group.tasks.map((plan) => <ChannelPlanRow key={plan._id} plan={plan} {...props} />)}
          </div>
        </div>
      )}
    </section>
  );
}

function ThumbnailModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-5" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={20} /></button>
      <img src={url} alt="Plan thumbnail" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
    </div>
  );
}

export default function ChannelPlanner() {
  const [channels, setChannels] = useState([]);
  const [contentManagers, setContentManagers] = useState([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState(() => readStoredArray(SELECTED_CHANNELS_KEY));
  const [activeChannelTab, setActiveChannelTab] = useState("all");
  const [viewMode, setViewMode] = useState("schedule");
  const [dateGroupPage, setDateGroupPage] = useState(1);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalGroups: 0, totalPlans: 0 });
  const [stats, setStats] = useState({ schedule: 0, completed: 0, backlog: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const filterParams = useMemo(() => {
    if (activeChannelTab !== "all") return { channelId: activeChannelTab };
    if (selectedChannelIds.length > 0) return { channelIds: selectedChannelIds.join(",") };
    return {};
  }, [activeChannelTab, selectedChannelIds]);

  const loadReferenceData = useCallback(async () => {
    try {
      const [channelsResponse, usersResponse] = await Promise.all([
        api.get("/channels"),
        api.get("/users/content-managers"),
      ]);
      setChannels(channelsResponse.data);
      setContentManagers(usersResponse.data);
      const valid = new Set(channelsResponse.data.map((channel) => String(channel._id)));
      setSelectedChannelIds((current) => {
        const next = current.filter((id) => valid.has(id));
        localStorage.setItem(SELECTED_CHANNELS_KEY, JSON.stringify(next));
        return next;
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load channels");
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bucket: viewMode,
        page: String(dateGroupPage),
        limit: String(DATE_GROUP_PAGE_SIZE),
        ...filterParams,
      });
      if (search.trim()) params.set("search", search.trim());
      const [plansResponse, statsResponse] = await Promise.all([
        api.get(`/channel-plans?${params.toString()}`),
        api.get(`/channel-plans/stats?${new URLSearchParams(filterParams).toString()}`),
      ]);
      setGroups(plansResponse.data.groups || []);
      setPagination(plansResponse.data.pagination || { page: 1, totalPages: 1, totalGroups: 0, totalPlans: 0 });
      setStats(statsResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load channel plans");
    } finally {
      setLoading(false);
    }
  }, [viewMode, dateGroupPage, filterParams, search]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPlans(), 250);
    return () => window.clearTimeout(timer);
  }, [loadPlans]);

  const selectedChannels = useMemo(() => {
    const byId = new Map(channels.map((channel) => [String(channel._id), channel]));
    return selectedChannelIds.map((id) => byId.get(id)).filter(Boolean);
  }, [channels, selectedChannelIds]);

  const changeSelectedChannels = (ids) => {
    setSelectedChannelIds(ids);
    localStorage.setItem(SELECTED_CHANNELS_KEY, JSON.stringify(ids));
    if (activeChannelTab !== "all" && !ids.includes(activeChannelTab)) setActiveChannelTab("all");
    setDateGroupPage(1);
  };

  const changeView = (value) => {
    setViewMode(value);
    setDateGroupPage(1);
  };

  const changeChannelTab = (value) => {
    setActiveChannelTab(value);
    setDateGroupPage(1);
  };

  const handleSaved = async () => {
    await loadReferenceData();
    await loadPlans();
  };

  const handleToggleStatus = async (plan) => {
    try {
      await api.put(`/channel-plans/${plan._id}`, {
        status: plan.status === "completed" ? "todo" : "completed",
      });
      toast.success(plan.status === "completed" ? "Plan reopened" : "Plan completed");
      await loadPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update plan");
    }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    try {
      await api.delete(`/channel-plans/${deletePlan._id}`);
      toast.success("Plan deleted");
      setDeletePlan(null);
      await loadPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete plan");
    } finally {
      setDeleting(false);
    }
  };

  const bucketOptions = [
    { value: "schedule", label: "Schedule", count: stats.schedule },
    { value: "completed", label: "Completed", count: stats.completed },
    { value: "backlog", label: "Backlog", count: stats.backlog },
  ];
  const channelOptions = [
    { value: "all", label: "All", count: 0 },
    ...selectedChannels.map((channel) => ({ value: String(channel._id), label: channel.name, count: 0 })),
  ];

  return (
    <AdminLayout title="Channel Planner" icon={CalendarDays} contentFit>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/60">
          <div className="flex flex-wrap items-center gap-3">
            <FilterSegment options={bucketOptions} value={viewMode} onChange={changeView} />
            <div className="relative min-w-48 flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setDateGroupPage(1);
                }}
                placeholder="Search title or notes"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-8 text-xs text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"><X size={13} /></button>}
            </div>
            <button
              type="button"
              onClick={() => void loadPlans()}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditPlan(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus size={15} /> Add Plan
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <ChannelPicker channels={channels} selectedIds={selectedChannelIds} onChange={changeSelectedChannels} />
            <div className="max-w-full overflow-x-auto">
              <FilterSegment options={channelOptions} value={activeChannelTab} onChange={changeChannelTab} />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 size={28} className="animate-spin text-blue-500" />
              <span className="text-sm">Loading plans…</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                <Layers3 size={25} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No plans found</p>
              <p className="mt-1 text-xs text-gray-500">Add a plan or adjust the active filters.</p>
            </div>
          ) : (
            <div className="space-y-2 pb-3">
              {groups.map((group) => (
                <DateGroup
                  key={group.date}
                  group={group}
                  onEdit={(plan) => {
                    setEditPlan(plan);
                    setModalOpen(true);
                  }}
                  onDelete={setDeletePlan}
                  onToggleStatus={handleToggleStatus}
                  onThumbnail={setThumbnailUrl}
                />
              ))}
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <span>{pagination.totalGroups} date groups · {pagination.totalPlans} plans</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={pagination.page <= 1} onClick={() => setDateGroupPage((page) => page - 1)} className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-30 dark:border-gray-600"><ChevronLeft size={14} /></button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setDateGroupPage((page) => page + 1)} className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-30 dark:border-gray-600"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <ChannelPlanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditPlan(null);
        }}
        onSaved={handleSaved}
        channels={channels}
        contentManagers={contentManagers}
        editPlan={editPlan}
      />
      <ConfirmModal
        isOpen={Boolean(deletePlan)}
        title="Delete channel plan?"
        message={<>This permanently deletes <strong>{deletePlan?.title}</strong>.</>}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletePlan(null)}
        loading={deleting}
        danger
      />
      {thumbnailUrl && <ThumbnailModal url={thumbnailUrl} onClose={() => setThumbnailUrl("")} />}
    </AdminLayout>
  );
}
