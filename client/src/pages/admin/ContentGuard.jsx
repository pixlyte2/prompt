import AdminLayout from "../../layout/AdminLayout";
import ContentValidator from "../../components/ContentValidator";
import { ShieldCheck } from "lucide-react";

export default function ContentGuard() {
  return (
    <AdminLayout
      title="Content Guard"
      titleInfo="Validate content for policy compliance & ad-suitability"
      icon={ShieldCheck}
    >
      <ContentValidator />
    </AdminLayout>
  );
}
