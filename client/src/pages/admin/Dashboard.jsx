import { useEffect, useState } from "react";
import { Users, Layers, FileText } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";

/* Animated Counter Component */
function Counter({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

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
        const res = await api.get("/dashboard");
        setStats(res.data);
      } catch (error) {
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      <Toaster position="top-right" />

      {loading ? (
        <div className="flex justify-center items-center h-60">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* USERS */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">
                <Counter value={stats.totalUsers} />
              </p>
            </div>
            <Users className="text-blue-500" size={40} />
          </div>

          {/* CHANNELS */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm mb-2">Total Channels</h3>
              <p className="text-3xl font-bold text-green-600">
                <Counter value={stats.totalChannels} />
              </p>
            </div>
            <Layers className="text-green-500" size={40} />
          </div>

          {/* PROMPTS */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm mb-2">Total Prompts</h3>
              <p className="text-3xl font-bold text-purple-600">
                <Counter value={stats.totalPrompts} />
              </p>
            </div>
            <FileText className="text-purple-500" size={40} />
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
