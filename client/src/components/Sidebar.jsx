import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { getRole, getUser } from "../utils/api";

export default function Sidebar({ menu }) {
  const location = useLocation();
  const user = getUser();
  const role = getRole();

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 h-screen flex flex-col shadow-2xl fixed left-0 top-0 hidden md:flex">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-3xl">🤖</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">CreatorAI</h2>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 backdrop-blur-sm">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full shadow-lg">
            <User size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 capitalize">{role || 'viewer'}</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1 flex-1">
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

      <div className="p-4 border-t border-slate-700">
        <LogoutButton />
      </div>
    </div>
  );
}
