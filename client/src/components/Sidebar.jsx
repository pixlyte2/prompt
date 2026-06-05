import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, X, ChevronLeft, ChevronRight, ScrollText, Loader2 } from "lucide-react";
import LogoutButton from "./LogoutButton";
import CreatorAILogo from "./CreatorAILogo";
import { useDarkMode } from "../contexts/DarkModeContext";
import api from "../services/api";
import { countTomorrowScriptsReady } from "../utils/videoTaskSchedule";

function navLinkClassName(isActive, isCollapsed) {
  const base =
    "relative flex items-center rounded-lg text-sm font-medium transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900";
  const layout = isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5";
  if (isActive) {
    const activeAccent = isCollapsed
      ? ""
      : "border-l-2 border-blue-600 dark:border-blue-400 pl-[10px]";
    return `${base} ${layout} ${activeAccent} bg-blue-100/90 dark:bg-blue-900/55 text-blue-700 dark:text-blue-200 font-semibold`;
  }
  return `${base} ${layout} text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800`;
}

function SidebarLinkList({ menu, onLinkClick, isCollapsed }) {
  const location = useLocation();
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <nav
        className="flex-1 min-h-0 overflow-y-auto p-4 pt-3 space-y-1"
        aria-label="Main navigation"
      >
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onLinkClick?.()}
              aria-current={isActive ? "page" : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              title={isCollapsed ? item.label : undefined}
              className={navLinkClassName(isActive, isCollapsed)}
            >
              {Icon && (
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-300"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                  }`}
                />
              )}
              {!isCollapsed && <span className="truncate flex-1 min-w-0">{item.label}</span>}
              {!isCollapsed && (
                <ChevronRight
                  size={16}
                  aria-hidden
                  className={`ml-auto flex-shrink-0 transition-opacity duration-200 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-300 opacity-100"
                      : "text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-50"
                  }`}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function TomorrowPipeline({ isCollapsed, onLinkClick }) {
  const [readyCount, setReadyCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/video-tasks");
        if (!cancelled) {
          setReadyCount(countTomorrowScriptsReady(data));
        }
      } catch {
        if (!cancelled) setReadyCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    loading
      ? "Loading tomorrow pipeline"
      : readyCount > 0
        ? `Tomorrow: ${readyCount} script${readyCount === 1 ? "" : "s"} ready`
        : "No scripts for tomorrow";

  const cardClass =
    "block rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 transition-colors hover:border-sky-300/80 dark:hover:border-sky-600/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900";

  if (isCollapsed) {
    return (
      <Link
        to="/admin"
        onClick={() => onLinkClick?.()}
        title={label}
        aria-label={label}
        className={`relative ${cardClass} p-2.5 flex justify-center`}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden />
        ) : (
          <ScrollText
            size={18}
            className={readyCount > 0 ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"}
            aria-hidden
          />
        )}
        {!loading && readyCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 flex items-center justify-center rounded-full bg-sky-600 dark:bg-sky-500 text-white text-[10px] font-bold leading-none">
            {readyCount > 9 ? "9+" : readyCount}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      to="/admin"
      onClick={() => onLinkClick?.()}
      className={`${cardClass} px-3 py-2.5`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {loading ? (
          <Loader2 size={16} className="mt-0.5 flex-shrink-0 animate-spin text-slate-400" aria-hidden />
        ) : (
          <ScrollText
            size={16}
            className={`mt-0.5 flex-shrink-0 ${readyCount > 0 ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"}`}
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tomorrow pipeline
          </p>
          <p
            className={`text-xs font-medium truncate ${
              loading
                ? "text-slate-400 dark:text-slate-500"
                : readyCount > 0
                  ? "text-sky-700 dark:text-sky-300"
                  : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {loading ? "Checking schedule…" : readyCount > 0 ? `${readyCount} script${readyCount === 1 ? "" : "s"} ready` : "No scripts for tomorrow"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SidebarCollapseControl({ isCollapsed, onToggleCollapse }) {
  if (!onToggleCollapse) return null;
  return (
    <button
      type="button"
      onClick={onToggleCollapse}
      title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={`hidden md:flex w-full items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
        isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
      }`}
    >
      {isCollapsed ? (
        <ChevronRight size={18} className="flex-shrink-0" aria-hidden />
      ) : (
        <ChevronLeft size={18} className="flex-shrink-0" aria-hidden />
      )}
      {!isCollapsed && <span>Collapse sidebar</span>}
    </button>
  );
}

function SidebarBottomPanel({ isCollapsed, onToggleCollapse, showTomorrowPipeline, onLinkClick }) {
  return (
    <div className="flex-shrink-0 px-4 pb-2 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
      {showTomorrowPipeline && (
        <TomorrowPipeline isCollapsed={isCollapsed} onLinkClick={onLinkClick} />
      )}
      <SidebarCollapseControl isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
    </div>
  );
}

function SidebarFooter({ onLinkClick, isCollapsed }) {
  const { isDark, toggleDarkMode } = useDarkMode();
  return (
    <div className="p-4 pt-2 space-y-2 flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
      <button
        type="button"
        onClick={toggleDarkMode}
        title={isCollapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
        className={`w-full flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all duration-200 ${
          isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
        }`}
      >
        {isDark ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
        {!isCollapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
      </button>
      <div
        onClick={() => onLinkClick?.()}
        onKeyDown={(e) => e.key === "Enter" && onLinkClick?.()}
        role="presentation"
        className={isCollapsed ? "flex justify-center" : ""}
      >
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}

function BrandBlock({ isCollapsed }) {
  const location = useLocation();
  return (
    <div className={`p-4 border-b border-gray-100 dark:border-gray-700 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
      <Link to={location.pathname} className="flex items-center gap-3 overflow-hidden">
        <CreatorAILogo size="sm" variant="sidebar" />
        {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">Creator AI</h2>}
      </Link>
    </div>
  );
}

export default function Sidebar({
  menu,
  mobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  showTomorrowPipeline = false,
}) {
  const location = useLocation();
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <aside 
        className={`hidden md:flex bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 bottom-0 h-screen flex-col z-20 transition-all duration-300 group/sidebar ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <BrandBlock isCollapsed={isCollapsed} />
        
        {/* Modern Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
        </button>

        <div className="flex flex-1 flex-col min-h-0">
          <SidebarLinkList menu={menu} isCollapsed={isCollapsed} />
          <SidebarBottomPanel
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            showTomorrowPipeline={showTomorrowPipeline}
          />
          <SidebarFooter onLinkClick={undefined} isCollapsed={isCollapsed} />
        </div>
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Close menu"
            onClick={onCloseMobile}
          />
          <aside
            className="fixed left-0 top-0 bottom-0 z-50 w-[min(16rem,88vw)] flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <Link to={location.pathname} className="flex items-center gap-3 min-w-0">
                <CreatorAILogo size="sm" variant="sidebar" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">Creator AI</h2>
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-1 flex-col min-h-0">
              <SidebarLinkList menu={menu} onLinkClick={onCloseMobile} isCollapsed={false} />
              <SidebarBottomPanel
                isCollapsed={false}
                showTomorrowPipeline={showTomorrowPipeline}
                onLinkClick={onCloseMobile}
              />
              <SidebarFooter onLinkClick={onCloseMobile} isCollapsed={false} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
