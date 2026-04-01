import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Users as UsersIcon, X, Search, Mail } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

/* ================= USER CARD ================= */
function UserCard({ user, onDelete }) {
  const getRoleInfo = (role) => {
    switch (role) {
      case "content_manager":
        return { label: "Content Manager", color: "bg-blue-100 text-blue-700" };
      case "admin":
        return { label: "Admin", color: "bg-purple-100 text-purple-700" };
      default:
        return { label: "Viewer", color: "bg-gray-100 text-gray-700" };
    }
  };

  const roleInfo = getRoleInfo(user.role);

  return (
    <div className="buffer-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:shadow-md transition group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 break-all">
            <Mail size={12} className="flex-shrink-0" />
            <span className="min-w-0">{user.email}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 sm:flex-nowrap sm:justify-end">
        <span className={`text-xs px-3 py-1 rounded-full ${roleInfo.color}`}>
          {roleInfo.label}
        </span>

        <div className="text-xs text-gray-400 dark:text-gray-500 text-left sm:text-right">
          <p>Created</p>
          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(user)}
          className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded ml-auto sm:ml-0"
          aria-label={`Delete ${user.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ================= MAIN ================= */
export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

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
      setShowAddModal(false);
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

  /* ================= FILTER ================= */
  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole =
      activeFilter === "all" || u.role === activeFilter;

    return matchSearch && matchRole;
  });

  /* ================= STATS ================= */
  const total = users.length;
  const admins = users.filter(u => u.role === "admin").length;
  const content = users.filter(u => u.role === "content_manager").length;
  const viewers = users.filter(u => u.role === "viewer").length;

  return (
    <AdminLayout title="Users" icon={UsersIcon}>
      <PageSectionLoader show={isLoading("page")} />

      <div className="space-y-5">

        {/* 🔥 STATS - PRO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {[
            { label: "Total Users", value: total, filter: "all", color: "blue" },
            { label: "Admins", value: admins, filter: "admin", color: "purple" },
            { label: "Content", value: content, filter: "content_manager", color: "green" },
            { label: "Viewers", value: viewers, filter: "viewer", color: "gray" }
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => setActiveFilter(item.filter)}
              className={`buffer-card p-4 cursor-pointer transition hover:shadow-md ${
                activeFilter === item.filter ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <p className="text-xs text-gray-500">{item.label}</p>

              <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">
                {item.value}
              </p>

              {/* MINI CHART */}
              <div className="mt-3 h-8 flex items-end gap-[3px]">
                {[5, 8, 6, 10, 7, 9, 6].map((h, idx) => (
                  <div
                    key={idx}
                    className={
                      item.color === "blue"
                        ? "bg-blue-400/60"
                        : item.color === "purple"
                        ? "bg-purple-400/60"
                        : item.color === "green"
                        ? "bg-green-400/60"
                        : "bg-gray-400/60"
                    }
                    style={{ height: `${h * 3}px`, width: "100%" }}
                  />
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* SEARCH + ADD */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="buffer-input pl-9 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="buffer-button-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto flex-shrink-0"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        {/* USERS */}
        <div className="space-y-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <UserCard key={user._id} user={user} onDelete={setDeleting} />
            ))
          ) : (
            <div className="buffer-card p-8 text-center">
              <p className="text-sm text-gray-500">No users found</p>
            </div>
          )}
        </div>

        {/* MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="buffer-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-semibold mb-4">Add User</h3>

              <div className="space-y-3">
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="buffer-input"
                />
                <input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="buffer-input"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="buffer-input"
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="buffer-input"
                >
                  <option value="viewer">Viewer</option>
                  <option value="content_manager">Content Manager</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowAddModal(false)} className="buffer-button-secondary">
                  Cancel
                </button>
                <button onClick={createUser} className="buffer-button-primary">
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={!!deleting}
          title="Delete User"
          message={`Delete "${deleting?.name}"?`}
          confirmText="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          loading={loading}
          danger
        />
      </div>
    </AdminLayout>
  );
}