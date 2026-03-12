import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { getRole, getUser } from "../utils/api";

export default function Sidebar({ menu }) {
  const location = useLocation();
  const user = getUser();
  const role = getRole();

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 fixed left-0 top-0 bottom-0 h-screen flex flex-col shadow-2xl hidden md:flex overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-2xl">🤖</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">CreatorAI</h2>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-2.5 p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-600 hover:border-cyan-500/50 transition-all duration-300 shadow-lg">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-slate-700 group-hover:ring-cyan-500/50 transition-all duration-300">
                <span className="text-white font-bold text-base">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-lg"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors duration-300">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
                  {role === 'admin' && '👑 Admin'}
                  {role === 'content_manager' && '✏️ Manager'}
                  {role === 'viewer' && '👁️ Viewer'}
                  {role === 'superadmin' && '⚡ Super Admin'}
                  {!role && '👤 User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 group overflow-hidden ${
                isActive 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/50 transform scale-105" 
                  : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-800/80 hover:to-slate-700/80 hover:text-white hover:shadow-xl hover:shadow-slate-900/50 hover:transform hover:scale-105 hover:-translate-y-0.5"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full shadow-lg shadow-white/50 animate-pulse" />
              )}
              
              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              {/* Icon with enhanced effects */}
              <div className={`relative z-10 transition-all duration-300 ${
                isActive 
                  ? "transform scale-110" 
                  : "group-hover:scale-125 group-hover:rotate-12"
              }`}>
                {Icon && (
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? "bg-white/20 shadow-lg" 
                      : "bg-slate-800/50 group-hover:bg-gradient-to-br group-hover:from-cyan-500/20 group-hover:to-blue-500/20"
                  }`}>
                    <Icon size={18} className={isActive ? "text-white" : `${item.color} group-hover:text-cyan-300`} />
                  </div>
                )}
              </div>

              {/* Label with enhanced typography */}
              <span className={`relative z-10 font-semibold text-base transition-all duration-300 ${
                isActive 
                  ? "text-white" 
                  : "group-hover:text-cyan-300 group-hover:translate-x-1"
              }`}>
                {item.label}
              </span>

              {/* Active badge */}
              {isActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
              )}

              {/* Hover arrow */}
              {!isActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                  <div className="w-1.5 h-1.5 border-t-2 border-r-2 border-cyan-300 transform rotate-45" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        <LogoutButton />
      </div>
    </div>
  );
}
