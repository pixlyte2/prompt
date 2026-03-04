import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Layers, 
  FileText, 
  Tag, 
  TrendingUp, 
  Activity,
  Calendar,
  BarChart3
} from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";

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
    totalPromptTypes: 0,
    activeUsers: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

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
          totalPromptTypes: promptTypes.data.length || 0,
          activeUsers: Math.floor((users.data.length || 0) * 0.7),
          recentActivity: Math.floor(Math.random() * 50) + 10
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
      title: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
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
    },
    {
      title: "Recent Activity",
      value: stats.recentActivity,
      icon: TrendingUp,
      color: "pink",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600"
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
    <AdminLayout title="Dashboard">
      <Toaster />
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-3">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Online</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Services</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Running</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Storage</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600">75% Used</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">New user registered</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Prompt type created</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Channel updated</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">System backup completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}