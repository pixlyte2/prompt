import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, X } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useDarkMode } from "../contexts/DarkModeContext";

function SidebarLinkList({ menu, onLinkClick }) {
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
              isActive
                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {Icon && (
              <Icon
                size={18}
                className={`transition-colors duration-200 ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                }`}
              />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onLinkClick }) {
  const { isDark, toggleDarkMode } = useDarkMode();
  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 flex-shrink-0">
      <button
        type="button"
        onClick={toggleDarkMode}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all duration-200"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button>
      <div
        onClick={() => onLinkClick?.()}
        onKeyDown={(e) => e.key === "Enter" && onLinkClick?.()}
        role="presentation"
      >
        <LogoutButton />
      </div>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">CA</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">CreatorAI</h2>
      </div>
    </div>
  );
}

export default function Sidebar({ menu, mobileOpen, onCloseMobile }) {
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
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 bottom-0 h-screen flex-col z-20">
        <BrandBlock />
        <SidebarLinkList menu={menu} />
        <SidebarFooter onLinkClick={undefined} />
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
