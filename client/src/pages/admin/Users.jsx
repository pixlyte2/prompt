import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { startLoading, stopLoading, isLoading } = useLoading();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        startLoading("page");
        const res = await api.get("/users");
        setUsers(res.data);
      } catch {
        toast.error("Failed to load users");
      } finally {
        stopLoading("page");
      }
    };
    loadUsers();
  }, []);

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error("All fields required");
    }
    try {
      setLoading(true);
      await api.post("/users/content", form);
      toast.success("User created successfully");
      setForm({ name: "", email: "", password: "", role: "viewer" });
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "User creation failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/users/${deleting._id}`);
      setUsers(prev => prev.filter(u => u._id !== deleting._id));
      toast.success("User deleted successfully");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "content_manager": return "bg-blue-100 text-blue-700";
      case "admin": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout title="User Management">
      <PageSectionLoader show={isLoading("page")} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <UsersIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              User Management
            </h2>
            <p className="text-blue-100">Manage users and their access permissions</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Add New User</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white"
            >
              <option value="viewer">Viewer</option>
              <option value="content_manager">Content Manager</option>
            </select>
            <button
              onClick={createUser}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl disabled:opacity-50 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Plus size={18} />
              Create User
            </button>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold">Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Name</th>
                  <th className="px-6 py-3 text-left font-medium">Email</th>
                  <th className="px-6 py-3 text-left font-medium">Role</th>
                  <th className="px-6 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getRoleBadge(u.role)}`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleting(u)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">Create your first user to get started</p>
              </div>
            )}
          </div>
        </div>

      <ConfirmModal
        isOpen={!!deleting}
        title="Delete User"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete User"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        loading={loading}
        danger={true}
      />
    </AdminLayout>
  );
}