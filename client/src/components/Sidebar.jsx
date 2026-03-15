import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { getRole, getUser } from "../utils/api";

export default function Sidebar({ menu }) {
  const location = useLocation();
  const user = getUser();
  const role = getRole();

  return (
    <div className="w-64 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 h-screen flex flex-col hidden md:flex">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">CA</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">CreatorAI</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {Icon && (
                <Icon 
                  size={18} 
                  className={`transition-colors duration-200 ${
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  }`} 
                />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <LogoutButton />
      </div>
    </div>
  );
}
