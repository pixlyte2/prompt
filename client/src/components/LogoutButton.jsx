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
      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 font-medium group border border-slate-700 hover:border-red-500/30"
    >
      <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
      <span>Logout</span>
    </button>
  );
}
