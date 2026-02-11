import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChannels: 0,
    totalPrompts: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-500 text-sm">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? "..." : stats.totalUsers}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-500 text-sm">Total Channels</h3>
          <p className="text-3xl font-bold text-green-600">
            {loading ? "..." : stats.totalChannels}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-500 text-sm">Total Prompts</h3>
          <p className="text-3xl font-bold text-purple-600">
            {loading ? "..." : stats.totalPrompts}
          </p>
        </div>

      </div>
    </AdminLayout>
  );
}
