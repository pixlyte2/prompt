import { useNavigate } from "react-router-dom";
import { logout } from "../utils/api";

export default function LogoutButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        logout();
        navigate("/login");
      }}
      className="w-full bg-red-600 py-2 rounded hover:bg-red-700"
    >
      Logout
    </button>
  );
}
