import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Layers, 
  FileText, 
  Tag,
  Calendar,
  BarChart3,
  Copy,
  Clock,
  Eye
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";
import { getRecentPrompts, clearRecentPrompts } from "../../utils/cache";

function Counter({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChannels: 0,
    totalPrompts: 0,
    totalPromptTypes: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState(null);

  useEffect(() => {
    setRecentPrompts(getRecentPrompts());
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [dashboard, users, channels, prompts, promptTypes] = await Promise.all([
          api.get("/dashboard").catch(() => ({ data: {} })),
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
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Channels",
      value: stats.totalChannels,
      icon: Layers,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      title: "Prompt Types",
      value: stats.totalPromptTypes,
      icon: Tag,
      color: "orange",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "Total Prompts",
      value: stats.totalPrompts,
      icon: FileText,
      color: "indigo",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    }
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center h-60">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" onCacheClear={() => setRecentPrompts([])}>
      
      <div className="p-4 space-y-4">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h1>
              <p className="text-blue-100">Monitor and manage your prompt system</p>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Calendar size={20} />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                    <p className={`text-3xl font-bold text-${card.color}-600`}>
                      <Counter value={card.value} />
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button 
              onClick={() => navigate('/admin/users')}
              className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left transition-colors"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-gray-600">Add or edit users</p>
            </button>
            <button 
              onClick={() => navigate('/admin/channels')}
              className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-left transition-colors"
            >
              <Layers className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium">Manage Channels</p>
              <p className="text-sm text-gray-600">Organize channels</p>
            </button>
            <button 
              onClick={() => navigate('/admin/prompt-types')}
              className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 text-left transition-colors"
            >
              <Tag className="w-8 h-8 text-orange-600 mb-2" />
              <p className="font-medium">Prompt Types</p>
              <p className="text-sm text-gray-600">Manage categories</p>
            </button>
            <button 
              onClick={() => navigate('/admin/prompts')}
              className="p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 text-left transition-colors"
            >
              <FileText className="w-8 h-8 text-indigo-600 mb-2" />
              <p className="font-medium">View Prompts</p>
              <p className="text-sm text-gray-600">Browse all prompts</p>
            </button>
          </div>
        </div>

        {/* Recent Prompts */}
        {recentPrompts.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Recent Prompts</h3>
              </div>
              <button
                onClick={() => {
                  clearRecentPrompts();
                  setRecentPrompts([]);
                  toast.success("Recent prompts cleared");
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {recentPrompts.slice(0, 5).map((prompt, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600">{prompt.channelId?.name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600">{prompt.promptTypeId?.name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-mono">{prompt.aiModel}</span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {prompt.promptText.length > 200 ? `${prompt.promptText.substring(0, 200)}...` : prompt.promptText}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => {
                        setPreviewPrompt(prompt);
                        setPreviewModal(true);
                      }}
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(prompt.promptText);
                        toast.success("Copied to clipboard");
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Copy"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewModal && previewPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Prompt Preview</h3>
                <button onClick={() => setPreviewModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-3 border-b">
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Channel:</span>
                    <div className="font-medium">{previewPrompt.channelId?.name || "-"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Type:</span>
                    <div className="font-medium">{previewPrompt.promptTypeId?.name || "-"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Model:</span>
                    <div className="font-medium font-mono text-sm">{previewPrompt.aiModel || "-"}</div>
                  </div>
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">{previewPrompt.promptText}</pre>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewPrompt.promptText);
                    toast.success("Copied to clipboard");
                    setPreviewModal(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Copy size={16} />
                  Copy
                </button>
                <button
                  onClick={() => setPreviewModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </AdminLayout>
  );
}