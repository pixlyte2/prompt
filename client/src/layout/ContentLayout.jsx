import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FileText } from "lucide-react";

const contentMenu = [
  { label: "Prompts", path: "/content/prompts", icon: FileText }
];

export default function ContentLayout({ title, titleInfo, icon, children, onCacheClear, noPadding }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar menu={contentMenu} />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <Topbar title={title} titleInfo={titleInfo} icon={icon} onCacheClear={onCacheClear} />
        <div className={`flex-1 overflow-y-auto ${noPadding ? "" : "p-6"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
