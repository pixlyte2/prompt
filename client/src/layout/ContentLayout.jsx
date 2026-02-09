import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const contentMenu = [
  { label: "Prompts", path: "/content/prompts" }
];

export default function ContentLayout({ title, children }) {
  return (
    <div className="flex">
      <Sidebar menu={contentMenu} />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <Topbar title={title} />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
