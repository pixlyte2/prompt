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
      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 font-medium"
    >
      <LogOut size={20} />
      <span>Logout</span>
    </button>
  );
}
