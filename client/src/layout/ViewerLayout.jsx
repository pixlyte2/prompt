import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Eye } from "lucide-react";

const viewerMenu = [
  { label: "View Prompts", path: "/viewer", icon: Eye, color: "text-purple-600" }
];

export default function ViewerLayout({ title, titleInfo, icon, children, onCacheClear, noPadding }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar menu={viewerMenu} />

      <div className="flex-1 flex flex-col ml-0 md:ml-64 overflow-hidden">
        <Topbar title={title} titleInfo={titleInfo} icon={icon} onCacheClear={onCacheClear} />
        <div className={`flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50 ${noPadding ? "" : "p-6"}`}>{children}</div>
      </div>
    </div>
  );
}
