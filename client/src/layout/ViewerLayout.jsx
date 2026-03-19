import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Eye } from "lucide-react";

const viewerMenu = [
  { label: "View Prompts", path: "/viewer", icon: Eye }
];

export default function ViewerLayout({ title, titleInfo, icon, children, onCacheClear, noPadding }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar menu={viewerMenu} />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <Topbar title={title} titleInfo={titleInfo} icon={icon} onCacheClear={onCacheClear} />
        <div className={`flex-1 overflow-y-auto ${noPadding ? "" : "p-6"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
