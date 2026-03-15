import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { BarChart3, Users, FileText, MessageSquare, HelpCircle } from "lucide-react";

const adminMenu = [
  { label: "Dashboard", path: "/admin", icon: BarChart3 },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Prompts", path: "/admin/prompts", icon: FileText },
  { label: "AI Chat", path: "/admin/ai-chat", icon: MessageSquare },
  { label: "Help", path: "/admin/help", icon: HelpCircle }
];

export default function AdminLayout({ title, titleInfo, icon: Icon, children, onCacheClear, noPadding }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar menu={adminMenu} />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <Topbar title={title} titleInfo={titleInfo} icon={Icon} onCacheClear={onCacheClear} />
        <div className={`flex-1 overflow-y-auto ${noPadding ? "" : "p-6"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}