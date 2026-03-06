import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { BarChart3, Users, Layers, Tag, FileText, MessageSquare, Settings, HelpCircle } from "lucide-react";

const adminMenu = [
  { label: "Dashboard", path: "/admin", icon: BarChart3, color: "text-gray-600" },
  { label: "Users", path: "/admin/users", icon: Users, color: "text-blue-600" },
  { label: "Channels", path: "/admin/channels", icon: Layers, color: "text-purple-600" },
  { label: "Prompt Types", path: "/admin/prompt-types", icon: Tag, color: "text-orange-600" },
  { label: "Prompts", path: "/admin/prompts", icon: FileText, color: "text-indigo-600" },
  { label: "AI Chat", path: "/admin/ai-chat", icon: MessageSquare, color: "text-emerald-600" },
  { label: "Settings", path: "/admin/settings", icon: Settings, color: "text-pink-600" },
  { label: "Help", path: "/admin/help", icon: HelpCircle, color: "text-cyan-600" }
];

export default function AdminLayout({ title, titleInfo, icon: Icon, children, onCacheClear, noPadding, onHistoryClick, historyCount }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar menu={adminMenu} />

      <div className="flex-1 flex flex-col ml-0 md:ml-64 overflow-hidden">
        <Topbar title={title} titleInfo={titleInfo} icon={Icon} onCacheClear={onCacheClear} onHistoryClick={onHistoryClick} historyCount={historyCount} />
        <div className={`flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50 ${noPadding ? "" : "p-6"}`}>{children}</div>
      </div>
    </div>
  );
}