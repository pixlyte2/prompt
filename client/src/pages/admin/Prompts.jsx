import AdminLayout from "../../layout/AdminLayout";
import PromptManager from "../../components/PromptManager";
import { FileText } from "lucide-react";

export default function Prompts() {
  return (
    <AdminLayout title="Prompt Management">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Prompt Management
            </h2>
            <p className="text-blue-100">Create and manage your AI prompts</p>
          </div>
        </div>
      </div>

      <PromptManager />
    </AdminLayout>
  );
}
