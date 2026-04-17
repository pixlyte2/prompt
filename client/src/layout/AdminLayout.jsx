import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AssistantWidget from "../components/AssistantWidget";
import { BarChart3, Users, FileText, MessageSquare, HelpCircle, TrendingUp, LayoutDashboard } from "lucide-react";

const adminMenu = [
  { label: "Dashboard", path: "/admin", icon: BarChart3 },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Prompts", path: "/admin/prompts", icon: FileText },
  { label: "AI Chat", path: "/admin/ai-chat", icon: MessageSquare },
  { label: "Trending Hub", path: "/admin/trending-hub", icon: TrendingUp },
  { label: "Production Hub", path: "/admin/production-hub", icon: LayoutDashboard },
  { label: "Help", path: "/admin/help", icon: HelpCircle }
];

export default function AdminLayout({
  title,
  titleInfo,
  icon: Icon,
  children,
  onCacheClear,
  noPadding,
  /** When true, main area fills viewport height on md+ without page scroll (children should use h-full + min-h-0). Small screens may still scroll. */
  contentFit,
}) {
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
        menu={adminMenu}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <Topbar
          title={title}
          titleInfo={titleInfo}
          icon={Icon}
          onCacheClear={onCacheClear}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <div
          className={`flex-1 flex flex-col min-h-0 min-w-0 ${
            contentFit ? "overflow-y-auto md:overflow-hidden" : "overflow-y-auto"
          } ${noPadding ? "" : "p-3 sm:p-4 md:p-4"}`}
        >
          {children}
        </div>
        <AssistantWidget />
      </div>
    </div>
  );
}