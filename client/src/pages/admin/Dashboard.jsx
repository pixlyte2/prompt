import AdminLayout from "../../layout/AdminLayout";

export default function Dashboard() {
  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">Users</div>
        <div className="bg-white p-6 rounded shadow">Channels</div>
        <div className="bg-white p-6 rounded shadow">Prompts</div>
      </div>
    </AdminLayout>
  );
}
