import AdminLayout from "../../layout/AdminLayout";
import PromptManager from "../../components/PromptManager";
import { FileText } from "lucide-react";

export default function Prompts() {
  return (
    <AdminLayout 
      title="Prompt Management" 
      titleInfo="Create and manage your AI prompts"
      icon={FileText}
    >
      <PromptManager />
    </AdminLayout>
  );
}
