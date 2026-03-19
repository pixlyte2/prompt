import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Users as UsersIcon, X, Search, Mail, Shield, User } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../layout/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

function UserCard({ user, onDelete }) {
  const getRoleInfo = (role) => {
    switch (role) {
      case "content_manager": 
        return { 
          label: "Content Manager", 
          color: "bg-blue-100 text-blue-700", 
          icon: "✏️" 
        };
      case "admin": 
        return { 
          label: "Admin", 
          color: "bg-purple-100 text-purple-700", 
          icon: "👑" 
        };
      default: 
        return { 
          label: "Viewer", 
          color: "bg-gray-100 text-gray-700", 
          icon: "👁️" 
        };
    }
  };

  const roleInfo = getRoleInfo(user.role);

  return (
    <div className="buffer-card px-3 py-2.5 hover:shadow-md hover:border-gray-300 group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-xs">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Mail size={12} />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(user)}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
          title="Delete user"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${roleInfo.color}`}>
          <span>{roleInfo.icon}</span>
          {roleInfo.label}
        </span>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout 
      title="Users" 
      titleInfo={`Manage ${users.length} team members and their permissions`}
      icon={UsersIcon}
    >
      <PageSectionLoader show={isLoading("page")} />

      <div className="space-y-3">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="buffer-input pl-9 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="buffer-button-primary flex items-center gap-1.5 text-sm py-2"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredUsers.map(user => (
              <UserCard 
                key={user._id} 
                user={user} 
                onDelete={setDeleting}
              />
            ))}
          </div>
        ) : (
          <div className="buffer-card p-8 text-center">
            <UsersIcon size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {searchTerm ? 'No users found' : 'No users yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first user to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="buffer-button-primary text-sm py-2 mt-3 flex items-center gap-1.5 mx-auto"
              >
                <Plus size={14} /> Add First User
              </button>
            )}
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <User size={16} />
                  Add New User
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoComplete="off"
                    className="buffer-input text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="off"
                    className="buffer-input text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    name="user-password-field"
                    className="buffer-input text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="buffer-input text-sm"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="content_manager">Content Manager</option>
                  </select>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="buffer-button-secondary text-sm py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  disabled={loading}
                  className="buffer-button-primary text-sm py-2 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                  ) : (
                    <><Plus size={14} /> Create User</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={!!deleting}
          title="Delete User"
          message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
          confirmText="Delete User"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          loading={loading}
          danger={true}
        />
      </div>
    </AdminLayout>
  );
}