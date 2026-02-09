import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const viewerMenu = [
  { label: "View Prompts", path: "/viewer/prompts" }
];

export default function ViewerLayout({ title, children }) {
  return (
    <div className="flex">
      <Sidebar menu={viewerMenu} />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <Topbar title={title} />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
