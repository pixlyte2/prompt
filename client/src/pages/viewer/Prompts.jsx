import ViewerLayout from "../../layout/ViewerLayout";
import PromptManager from "../../components/PromptManager";
import { Eye } from "lucide-react";

export default function Prompts() {
  return (
    <ViewerLayout 
      title="View Prompts" 
      titleInfo="Browse and view AI prompts"
      icon={Eye}
    >
      <PromptManager />
    </ViewerLayout>
  );
}
