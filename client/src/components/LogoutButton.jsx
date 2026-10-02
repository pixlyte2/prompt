import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "../utils/api";

export default function LogoutButton({ isCollapsed }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        logout();
        navigate("/login");
      }}
      className={`w-full flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-all duration-200 ${
        isCollapsed ? "justify-center p-2 md:p-2.5" : "gap-2 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5"
      }`}
    >
      <LogOut className="flex-shrink-0 w-4 h-4 md:w-[18px] md:h-[18px]" />
      {!isCollapsed && <span>Sign out</span>}
    </button>
  );
}
