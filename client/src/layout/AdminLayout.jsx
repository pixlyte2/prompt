import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const adminMenu = [
  { label: "Dashboard", path: "/admin" },
  { label: "Users", path: "/admin/users" },
  { label: "Channels", path: "/admin/channels" },
  { label: "Prompts", path: "/admin/prompts" }
];

export default function AdminLayout({ title, children }) {
  return (
    <div className="flex">
      <Sidebar menu={adminMenu} />

      <div className="flex-1 bg-gray-100 min-h-screen">
        <Topbar title={title} />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
