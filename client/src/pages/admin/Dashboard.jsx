import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Users, Layers, FileText, MessageSquare, BarChart3, Plus, ArrowUpRight, Activity, Clock, Sparkles } from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../services/api";
import { getUser } from "../../utils/api";
import HistoryModal from "../../components/HistoryModal";

const statItems = [
  { key: "totalPrompts", label: "Prompts", icon: FileText, path: "/admin/prompts", bg: "bg-blue-50", fg: "text-blue-600" },
  { key: "totalChannels", label: "Channels", icon: Layers, path: "/admin/channels", bg: "bg-emerald-50", fg: "text-emerald-600" },
  { key: "totalUsers", label: "Users", icon: Users, path: "/admin/users", bg: "bg-violet-50", fg: "text-violet-600" },
  { key: "totalPromptTypes", label: "Prompt Types", icon: Activity, path: "/admin/prompt-types", bg: "bg-amber-50", fg: "text-amber-600" },
];

const actions = [
  { title: "Create Prompt", desc: "Add a new AI prompt", icon: Plus, path: "/admin/prompts", bg: "bg-blue-50", fg: "text-blue-600" },
  { title: "Manage Users", desc: "Accounts & permissions", icon: Users, path: "/admin/users", bg: "bg-emerald-50", fg: "text-emerald-600" },
  { title: "AI Chat", desc: "Test with AI assistant", icon: MessageSquare, path: "/admin/ai-chat", bg: "bg-violet-50", fg: "text-violet-600" },
];

function getAIChatHistory() {
  try {
    const stored = localStorage.getItem("AI_CHAT_HISTORY");
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState({ totalUsers: 0, totalChannels: 0, totalPrompts: 0, totalPromptTypes: 0 });
  const [loading, setLoading] = useState(true);
  const [historyModal, setHistoryModal] = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);

  const history = getAIChatHistory();
  const recentHistory = history.slice(0, 3);
  const lastUsed = history[0] || null;

  // Parse "Channel - PromptType" from title
  const lastChannel = lastUsed?.title?.split(" - ")[0] || null;
  const lastPromptType = lastUsed?.title?.split(" - ")[1] || null;

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [users, channels, prompts, promptTypes] = await Promise.all([
        api.get("/users").catch(() => ({ data: [] })),
        api.get("/channels").catch(() => ({ data: [] })),
        api.get("/prompts").catch(() => ({ data: [] })),
        api.get("/prompt-types").catch(() => ({ data: [] }))
      ]);
      setStats({
        totalUsers: users.data.length || 0,
        totalChannels: channels.data.length || 0,
        totalPrompts: prompts.data.length || 0,
        totalPromptTypes: promptTypes.data.length || 0
      });
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const greeting = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" titleInfo={`Good ${greeting}, ${user?.name || "Admin"}`} icon={BarChart3}>
      <div className="flex flex-col gap-3">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {statItems.map(({ key, label, icon: Icon, path, bg, fg }) => (
            <button key={key} onClick={() => navigate(path)}
              className="buffer-card px-3 py-2.5 text-left group hover:shadow-md hover:border-gray-300 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={15} className={fg} />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 leading-tight">{stats[key]}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {actions.map(({ title, desc, icon: Icon, path, bg, fg }) => (
            <button key={title} onClick={() => navigate(path)}
              className="buffer-card px-3 py-2.5 text-left flex items-center gap-2.5 group hover:shadow-md hover:border-gray-300">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={15} className={fg} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
                <p className="text-[11px] text-gray-500 truncate">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Last AI Chat */}
        {lastUsed ? (
          <button onClick={() => navigate("/admin/ai-chat", { state: { promptId: lastUsed.promptId, sourceText: lastUsed.sourceText, videoLength: lastUsed.videoLength, aiModel: lastUsed.aiModel } })}
            className="buffer-card px-3 py-2.5 text-left group hover:shadow-md hover:border-gray-300 flex items-center gap-3">
            <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
            <span className="text-[11px] font-medium text-gray-500">Last AI Chat</span>
            {lastChannel && <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{lastChannel}</span>}
            {lastPromptType && <span className="text-[11px] font-medium bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">{lastPromptType}</span>}
            {lastUsed.aiModel && <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{lastUsed.aiModel}</span>}
            <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(lastUsed.timestamp)}</span>
          </button>
        ) : null}

        {/* Recent AI Chat History */}
        {recentHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={12} className="text-gray-400" /> Recent AI Generations
              </h3>
              <button onClick={() => { setHistoryItemId(null); setHistoryModal(true); }} className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                View all <ArrowUpRight size={10} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {recentHistory.map((item) => (
                <div key={item.id} onClick={() => { setHistoryItemId(item.id); setHistoryModal(true); }}
                  className="buffer-card px-3 py-2.5 group hover:shadow-md hover:border-gray-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      {(item.channel || item.title?.split(" - ")[0]) && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded truncate bg-blue-50 text-blue-700">{item.channel || item.title?.split(" - ")[0]}</span>
                      )}
                      {(item.promptType || item.title?.split(" - ")[1]) && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded truncate bg-violet-50 text-violet-700">{item.promptType || item.title?.split(" - ")[1]}</span>
                      )}
                      {item.aiModel && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded truncate bg-amber-50 text-amber-700">{item.aiModel}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{timeAgo(item.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                    {item.result?.replace(/<[^>]*>/g, "").replace(/[#*`_~]/g, "").substring(0, 120)}...
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">{item.videoLength || ""}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.result); toast.success("Copied"); }}
                      className="text-[11px] text-blue-600 font-medium opacity-0 group-hover:opacity-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {historyModal && <HistoryModal onClose={() => setHistoryModal(false)} initialItemId={historyItemId} />}
    </AdminLayout>
  );
}
