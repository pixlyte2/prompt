import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { BarChart3, Users, Layers, Tag, FileText } from "lucide-react";

const adminMenu = [
  { label: "Dashboard", path: "/admin", icon: BarChart3, color: "text-gray-600" },
  { label: "Users", path: "/admin/users", icon: Users, color: "text-blue-600" },
  { label: "Channels", path: "/admin/channels", icon: Layers, color: "text-purple-600" },
  { label: "Prompt Types", path: "/admin/prompt-types", icon: Tag, color: "text-orange-600" },
  { label: "Prompts", path: "/admin/prompts", icon: FileText, color: "text-indigo-600" }
];

export default function AdminLayout({ title, children }) {
  return (
    <div className="flex">
      <Sidebar menu={adminMenu} />

      <div className="flex-1 bg-gray-100 min-h-screen">
        <Topbar title={title} />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
