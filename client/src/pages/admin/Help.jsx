import { HelpCircle, Users, Layers, Tag, FileText, MessageSquare, Copy, Eye, LayoutDashboard, TrendingUp, Zap, MousePointer2 } from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";

export default function Help() {
  const sections = [
    {
      title: "Dashboard",
      icon: HelpCircle,
      color: "text-gray-600",
      items: [
        "View system statistics and quick actions",
        "Delivery Monitor: Real-time pipeline tracking and task assignments",
        "Resume last session banner for AI Chat",
        "Navigate to different sections quickly"
      ]
    },
    {
      title: "Production Hub",
      icon: LayoutDashboard,
      color: "text-blue-500",
      items: [
        "Schedule management for video tasks and scripts",
        "Backlog system for unscheduled priorities",
        "Multi-assignee and multi-format (Long/Short) support",
        "Daily workload summaries and pill-based tracking"
      ]
    },
    {
      title: "Trending Hub",
      icon: TrendingUp,
      color: "text-pink-500",
      items: [
        "Viral Lens: Monitor competitors and trending topics",
        "Pulse tracking: Identify high-performing content patterns",
        "Integration with Production Hub for scheduling ideas"
      ]
    },
    {
      title: "Users & Access",
      icon: Users,
      color: "text-blue-600",
      items: [
        "Manage team members and credentials",
        "Role-based access (Admin, Content Manager, Viewer)",
        "Secure credential management"
      ]
    },
    {
      title: "Library Management",
      icon: FileText,
      color: "text-indigo-600",
      items: [
        "Organize prompts by Channels and Types",
        "Preview with Eye icon before use",
        "Export prompts for external backup (JSON)",
        "Advanced filtering by model and category"
      ]
    },
    {
      title: "AI Production",
      icon: MessageSquare,
      color: "text-emerald-600",
      items: [
        "Context-aware AI Chat with prompt memory",
        "Source material processing (URL/Script parsing)",
        "Shift+Enter for multi-line, Enter for instant send",
        "Copy/paste results directly to Production Hub"
      ]
    }
  ];

  return (
    <AdminLayout 
      title="Help & Guide" 
      titleInfo="Complete guide to manage prompts and AI interactions"
      icon={HelpCircle}
    >
      <div className="buffer-card overflow-hidden p-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="buffer-card p-3 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-cyan-600 dark:text-cyan-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mt-3">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
            <Copy className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Use <MousePointer2 className="inline w-4 h-4" /> Sidebar Toggle to maximize workspace</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Pills in Production Hub indicate Long/Short content counts</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Dark Mode preference and Sidebar state persist across pages</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
              <span>Click <Zap className="inline w-4 h-4" /> in Hub to view real-time delivery status</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
