import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Users as UsersIcon, Search, Mail, Pencil, Shield, FileEdit, Eye, Mic, UserX } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";
import UserAvatar from "../../components/UserAvatar";

/* ================= USER CARD ================= */
function UserCard({ user, onDelete, onEdit }) {
  const getRoleInfo = (role) => {
    switch (role) {
      case "content_manager":
        return { label: "Content Manager", color: "bg-blue-100 text-blue-700" };
      case "admin":
        return { label: "Admin", color: "bg-purple-100 text-purple-700" };
      case "voice_over":
        return { label: "Voice Over", color: "bg-emerald-100 text-emerald-800" };
      default:
        return { label: "Viewer", color: "bg-gray-100 text-gray-700" };
    }
  };

  const roleInfo = getRoleInfo(user.role);
  const isActive = user.active !== false;

  return (
    <div className={`buffer-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:shadow-md transition group ${!isActive ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar user={user} size="md" />

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
        {!isActive && (
          <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
            Inactive
          </span>
        )}
        <span className={`text-xs px-3 py-1 rounded-full ${roleInfo.color}`}>
          {roleInfo.label}
        </span>

        <div className="text-xs text-gray-400 dark:text-gray-500 text-left sm:text-right">
          <p>Created</p>
          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded"
            aria-label={`Edit ${user.name}`}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(user)}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded"
            aria-label={`Delete ${user.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN ================= */
export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer", active: true });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "viewer", password: "", active: true });
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
      setForm({ name: "", email: "", password: "", role: "viewer", active: true });
      setShowAddModal(false);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "User creation failed");
    } finally {
      setLoading(false);
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "viewer",
      password: "",
      active: user.active !== false,
    });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
      return toast.error("Name and email are required");
    }
    try {
      setLoading(true);
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        active: editForm.active,
      };
      if (editingUser.role !== "admin") {
        payload.role = editForm.role;
      }
      if (editForm.password?.trim()) {
        payload.password = editForm.password.trim();
      }
      const { data } = await api.put(`/users/${editingUser._id}`, payload);
      setUsers((prev) =>
        prev.map((u) => (u._id === data._id || u._id === editingUser._id ? { ...u, ...data } : u)),
      );
      toast.success("User updated");
      setEditingUser(null);
      setEditForm({ name: "", email: "", role: "viewer", password: "", active: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
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

  /* ================= FILTER & SORT ================= */
  const ROLE_ORDER = { admin: 0, content_manager: 1, viewer: 2, voice_over: 3 };

  const filteredUsers = users
    .filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "inactive" ? u.active === false : u.role === activeFilter);

      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  /* ================= STATS ================= */
  const total = users.length;
  const admins = users.filter(u => u.role === "admin").length;
  const content = users.filter(u => u.role === "content_manager").length;
  const viewers = users.filter(u => u.role === "viewer").length;
  const voiceOver = users.filter(u => u.role === "voice_over").length;
  const inactive = users.filter(u => u.active === false).length;

  return (
    <AdminLayout title="Users" icon={UsersIcon}>
      <PageSectionLoader show={isLoading("page")} />

      <div className="space-y-5">

        <div className="flex flex-nowrap gap-0.5 sm:gap-1.5 w-full min-w-0" role="group" aria-label="Filter users">
          {[
            { label: "All", count: total, filter: "all", icon: UsersIcon, iconBg: "bg-blue-50 dark:bg-blue-950/50", iconFg: "text-blue-600 dark:text-blue-400" },
            { label: "Admins", count: admins, filter: "admin", icon: Shield, iconBg: "bg-violet-50 dark:bg-violet-950/50", iconFg: "text-violet-600 dark:text-violet-400" },
            { label: "Content", count: content, filter: "content_manager", icon: FileEdit, iconBg: "bg-emerald-50 dark:bg-emerald-950/50", iconFg: "text-emerald-600 dark:text-emerald-400" },
            { label: "Viewers", count: viewers, filter: "viewer", icon: Eye, iconBg: "bg-gray-100 dark:bg-gray-700/50", iconFg: "text-gray-600 dark:text-gray-300" },
            { label: "Voice Over", count: voiceOver, filter: "voice_over", icon: Mic, iconBg: "bg-amber-50 dark:bg-amber-950/50", iconFg: "text-amber-600 dark:text-amber-400" },
            { label: "Inactive", count: inactive, filter: "inactive", icon: UserX, iconBg: "bg-red-50 dark:bg-red-950/50", iconFg: "text-red-600 dark:text-red-400" },
          ].map((item) => {
            const isSelected = activeFilter === item.filter;
            const Icon = item.icon;
            return (
              <button
                key={item.filter}
                type="button"
                onClick={() => setActiveFilter(item.filter)}
                aria-pressed={isSelected}
                className={`buffer-card flex flex-1 min-w-0 basis-0 items-center gap-1 sm:gap-2 px-1.5 py-1.5 sm:px-2.5 sm:py-2 transition-all hover:shadow-md ${
                  isSelected
                    ? item.filter === "inactive"
                      ? "ring-2 ring-red-500 bg-red-50/80 dark:bg-red-950/30 shadow-sm"
                      : "ring-2 ring-blue-500 bg-blue-50/80 dark:bg-blue-950/30 shadow-sm"
                    : "hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                  <Icon size={12} className={`sm:hidden ${item.iconFg}`} />
                  <Icon size={14} className={`hidden sm:block ${item.iconFg}`} />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">
                    {item.label}
                  </p>
                  <p className="text-sm sm:text-lg font-bold tabular-nums text-gray-900 dark:text-white leading-tight">
                    {item.count}
                  </p>
                </div>
              </button>
            );
          })}
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
              <UserCard key={user._id} user={user} onDelete={setDeleting} onEdit={openEditUser} />
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
                  <option value="voice_over">Voice Over</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  Active
                </label>
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

        {editingUser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="buffer-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-semibold mb-1">Edit user</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {editingUser.role === "admin"
                  ? "Admin accounts: update name, email, or set a new password. Role cannot be changed here."
                  : "Update name, email, role, or set a new password (optional)."}
              </p>

              <div className="space-y-3">
                <input
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="buffer-input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="buffer-input"
                />
                <input
                  type="password"
                  placeholder="New password (leave blank to keep)"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="buffer-input"
                  autoComplete="new-password"
                />
                {editingUser.role === "admin" ? (
                  <p className="text-xs text-gray-600 dark:text-gray-300 px-1">
                    Role: <span className="font-semibold capitalize">{editingUser.role.replace("_", " ")}</span>
                  </p>
                ) : (
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="buffer-input"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="content_manager">Content Manager</option>
                    <option value="voice_over">Voice Over</option>
                  </select>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.active}
                    onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditForm({ name: "", email: "", role: "viewer", password: "", active: true });
                  }}
                  className="buffer-button-secondary"
                >
                  Cancel
                </button>
                <button type="button" onClick={saveEditUser} className="buffer-button-primary" disabled={loading}>
                  Save changes
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