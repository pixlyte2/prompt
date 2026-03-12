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
      <div className="p-6 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-3xl">🤖</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">CreatorAI</h2>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-600 hover:border-cyan-500/50 transition-all duration-300 shadow-lg">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-slate-700 group-hover:ring-cyan-500/50 transition-all duration-300">
                <span className="text-white font-bold text-lg">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-lg"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors duration-300">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30" 
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              {Icon && <Icon size={20} className={isActive ? "text-white" : `${item.color} group-hover:scale-110 transition-transform`} />}
              <span className="font-medium">{item.label}</span>
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
