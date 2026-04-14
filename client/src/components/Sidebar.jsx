import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, X, ChevronLeft, ChevronRight } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useDarkMode } from "../contexts/DarkModeContext";

function SidebarLinkList({ menu, onLinkClick, isCollapsed }) {
  const location = useLocation();
  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {menu.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => onLinkClick?.()}
            className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 group ${
              isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
            } ${
              isActive
                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {Icon && (
              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors duration-200 ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                }`}
              />
            )}
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onLinkClick, isCollapsed }) {
  const { isDark, toggleDarkMode } = useDarkMode();
  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 flex-shrink-0">
      <button
        type="button"
        onClick={toggleDarkMode}
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
  return (
    <div className={`p-4 border-b border-gray-100 dark:border-gray-700 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">CA</span>
        </div>
        {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">CreatorAI</h2>}
      </div>
    </div>
  );
}

export default function Sidebar({ menu, mobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }) {
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

        <SidebarLinkList menu={menu} isCollapsed={isCollapsed} />
        <SidebarFooter onLinkClick={undefined} isCollapsed={isCollapsed} />
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
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">CA</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">CreatorAI</h2>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarLinkList menu={menu} onLinkClick={onCloseMobile} />
            <SidebarFooter onLinkClick={onCloseMobile} />
          </aside>
        </>
      )}
    </>
  );
}
