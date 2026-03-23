import AdminLayout from "../../layout/AdminLayout";
import AIChatTabs from "../../components/AIChatTabs";
import { MessageSquare } from "lucide-react";

export default function AIChat() {
  return (
    <AdminLayout 
      title="AI Chatss" 
      titleInfo="Create amazing content with AI-powered prompts"
      icon={MessageSquare}
    >
      <AIChatTabs />
    </AdminLayout>
  );
}