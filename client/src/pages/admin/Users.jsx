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
    <div className="buffer-card p-6 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail size={14} />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(user)}
          className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Delete user"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${roleInfo.color}`}>
          <span>{roleInfo.icon}</span>
          {roleInfo.label}
        </span>
        <div className="text-xs text-gray-400">
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

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="buffer-input pl-10"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="buffer-button-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <UserCard 
                key={user._id} 
                user={user} 
                onDelete={setDeleting}
              />
            ))}
          </div>
        ) : (
          <div className="buffer-card p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first user to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="buffer-button-primary"
              >
                <Plus size={18} className="mr-2" />
                Add First User
              </button>
            )}
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User size={20} />
                  Add New User
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoComplete="off"
                    className="buffer-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="off"
                    className="buffer-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="buffer-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="buffer-input"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="content_manager">Content Manager</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="buffer-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={createUser}
                  disabled={loading}
                  className="buffer-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create User
                    </>
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