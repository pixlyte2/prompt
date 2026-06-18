import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AssistantWidget from "../components/AssistantWidget";
import WeekOverviewPanel from "../components/WeekOverviewPanel";
import { BarChart3, Users, FileText, MessageSquare, HelpCircle, TrendingUp, LayoutDashboard, Youtube, Mic, LineChart } from "lucide-react";
import { getRole } from "../utils/api";

const adminMenu = [
  { label: "Dashboard", path: "/admin", icon: BarChart3 },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Prompts", path: "/admin/prompts", icon: FileText },
  { label: "AI Chat", path: "/admin/ai-chat", icon: MessageSquare },
  { label: "Trending Hub", path: "/admin/trending-hub", icon: TrendingUp },
  { label: "Production Hub", path: "/admin/production-hub", icon: LayoutDashboard },
  { label: "Voice-over", path: "/admin/voice-over", icon: Mic },
  { label: "YouTube Analytics", path: "/admin/youtube-analytics", icon: LineChart },
  { label: "Help", path: "/admin/help", icon: HelpCircle }
];

const voiceOverMenu = [{ label: "Voice-over", path: "/admin/voice-over", icon: Mic }];

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
  const [weekPanelCollapsed, setWeekPanelCollapsed] = useState(() => {
    return localStorage.getItem("WEEK_PANEL_COLLAPSED") === "true";
  });

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("SIDEBAR_COLLAPSED", String(newVal));
      return newVal;
    });
  };

  const handleToggleWeekPanel = () => {
    setWeekPanelCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("WEEK_PANEL_COLLAPSED", String(newVal));
      return newVal;
    });
  };

  const role = getRole();
  const isVoLimitedRole = role === "voice_over" || role === "voice_over_training";
  const sidebarMenu = useMemo(
    () => (isVoLimitedRole ? voiceOverMenu : adminMenu),
    [isVoLimitedRole],
  );
  const showAssistant = !isVoLimitedRole;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        menu={sidebarMenu}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        showTomorrowPipeline={!isVoLimitedRole}
      />

      <div
        className={`flex flex-1 min-w-0 min-h-0 flex-row transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          <Topbar
            title={title}
            titleInfo={titleInfo}
            icon={Icon}
            onCacheClear={onCacheClear}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <div
            className={`flex-1 flex flex-col min-h-0 min-w-0 ${
              contentFit ? "overflow-hidden" : "overflow-y-auto"
            } ${noPadding ? "" : "p-3 sm:p-4 md:p-4"}`}
          >
            {children}
          </div>
          {showAssistant ? <AssistantWidget /> : null}
        </div>

        {!isVoLimitedRole && (
          <WeekOverviewPanel
            isCollapsed={weekPanelCollapsed}
            onToggleCollapse={handleToggleWeekPanel}
          />
        )}
      </div>
    </div>
  );
}
