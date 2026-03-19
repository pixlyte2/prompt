import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "../utils/api";

export default function LogoutButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        logout();
        navigate("/login");
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-all duration-200"
    >
      <LogOut size={18} />
      <span>Sign out</span>
    </button>
  );
}
