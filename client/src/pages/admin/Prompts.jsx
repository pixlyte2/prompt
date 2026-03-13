import AdminLayout from "../../layout/AdminLayout";
import PromptManagementTabs from "../../components/PromptManagementTabs";
import { FileText } from "lucide-react";

export default function Prompts() {
  return (
    <AdminLayout 
      title="Prompt Management" 
      titleInfo="Create and manage your AI prompts and types"
      icon={FileText}
    >
      <PromptManagementTabs />
    </AdminLayout>
  );
}
