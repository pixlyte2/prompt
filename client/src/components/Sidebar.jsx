import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";

export default function Sidebar({ menu }) {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-5">
      <h2 className="text-xl font-bold mb-6">CreatorAI</h2>

      <nav className="space-y-3">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="block px-3 py-2 rounded hover:bg-gray-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        <LogoutButton />
      </div>
    </div>
  );
}
