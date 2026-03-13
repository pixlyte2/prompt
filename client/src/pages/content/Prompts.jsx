import ContentLayout from "../../layout/ContentLayout";
import PromptManagementTabs from "../../components/PromptManagementTabs";
import { FileText } from "lucide-react";

export default function Prompts() {
  return (
    <ContentLayout 
      title="Prompt Management" 
      titleInfo="Create and manage your AI prompts and types"
      icon={FileText}
    >
      <PromptManagementTabs />
    </ContentLayout>
  );
}
