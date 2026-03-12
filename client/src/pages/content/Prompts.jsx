import ContentLayout from "../../layout/ContentLayout";
import PromptManager from "../../components/PromptManager";
import { FileText } from "lucide-react";

export default function Prompts() {
  return (
    <ContentLayout 
      title="Prompt Management" 
      titleInfo="Create and manage your AI prompts"
      icon={FileText}
    >
      <PromptManager />
    </ContentLayout>
  );
}
