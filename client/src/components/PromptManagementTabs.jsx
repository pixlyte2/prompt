import { useState } from "react";
import { FileText, Tag } from "lucide-react";
import PromptManager from "./PromptManager";
import PromptTypeManager from "./PromptTypeManager";

export default function PromptManagementTabs() {
  const [activeTab, setActiveTab] = useState("prompts");

  const tabs = [
    { key: "prompts", label: "Prompts", icon: FileText },
    { key: "types", label: "Prompt Types", icon: Tag },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === "prompts" && <PromptManager />}
        {activeTab === "types" && <PromptTypeManager />}
      </div>
    </div>
  );
}
