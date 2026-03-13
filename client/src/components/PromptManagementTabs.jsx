import { useState } from "react";
import { FileText, Tag } from "lucide-react";
import PromptManager from "./PromptManager";
import PromptTypeManager from "./PromptTypeManager";

export default function PromptManagementTabs() {
  const [activeTab, setActiveTab] = useState("prompts");

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("prompts")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "prompts"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileText size={20} />
            Prompts
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "types"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Tag size={20} />
            Prompt Types
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "prompts" && <PromptManager />}
        {activeTab === "types" && <PromptTypeManager />}
      </div>
    </div>
  );
}
