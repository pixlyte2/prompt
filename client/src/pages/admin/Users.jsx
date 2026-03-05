import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
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
      
      <div className="bg-gray-50 p-4">
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <p className="text-gray-600">Add new users to the system</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border px-3 py-2 rounded-lg"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border px-3 py-2 rounded-lg"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border px-3 py-2 rounded-lg"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border px-3 py-2 rounded-lg"
            >
              <option value="viewer">Viewer</option>
              <option value="content_manager">Content Manager</option>
            </select>
            <button
              onClick={createUser}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} />
              Create User
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
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
      </div>

      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Delete User</h3>
            <p className="mb-4">Delete "{deleting.name}"?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleting(null)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}