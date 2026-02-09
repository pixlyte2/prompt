import AdminLayout from "../../layout/AdminLayout";
import PromptManager from "../../components/PromptManager";

export default function Prompts() {
  return (
    <AdminLayout title="Prompt Management">
      <PromptManager />
    </AdminLayout>
  );
}
