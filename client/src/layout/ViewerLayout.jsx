import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Eye } from "lucide-react";

const viewerMenu = [
  { label: "View Prompts", path: "/viewer", icon: Eye }
];

export default function ViewerLayout({ title, titleInfo, icon, children, onCacheClear, noPadding }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        menu={viewerMenu}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col ml-0 md:ml-64 min-w-0">
        <Topbar
          title={title}
          titleInfo={titleInfo}
          icon={icon}
          onCacheClear={onCacheClear}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <div className={`flex-1 overflow-y-auto min-w-0 ${noPadding ? "" : "p-4 sm:p-6"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
