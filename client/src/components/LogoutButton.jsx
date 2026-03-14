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
      className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
    >
      <LogOut size={18} />
      <span>Sign out</span>
    </button>
  );
}
