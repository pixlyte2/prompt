import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { FileText } from "lucide-react";

const contentMenu = [
  { label: "Prompts", path: "/content/prompts", icon: FileText }
];

export default function ContentLayout({ title, titleInfo, icon, children, onCacheClear, noPadding }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("SIDEBAR_COLLAPSED") === "true";
  });

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("SIDEBAR_COLLAPSED", String(newVal));
      return newVal;
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        menu={contentMenu}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
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
