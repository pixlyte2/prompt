import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiTrash2,
  FiKey,
  FiUserPlus,
  FiSearch,
  FiX
} from "react-icons/fi";

export default function SuperAdminDashboard() {
  const [profile, setProfile] = useState(null);
  const [admins, setAdmins] = useState([]);

  /* ===== UI STATES ===== */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ===== DELETE STATE ===== */
  const [deleteCompanyId, setDeleteCompanyId] = useState(null);
  const [deleteCompanyName, setDeleteCompanyName] = useState("");

  /* ===== FILTER STATES ===== */
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  /* ===== FORMS ===== */
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: ""
  });

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  /* ===== LOAD DATA ===== */
  const loadProfile = async () => {
    const res = await api.get("/superadmin/me");
    setProfile(res.data);
  };

  const loadAdmins = async () => {
    const res = await api.get("/superadmin/admins");
    setAdmins(res.data);
  };

  useEffect(() => {
    loadProfile();
    loadAdmins();
  }, []);

  /* ===== CREATE ADMIN ===== */
  const createAdmin = async () => {
    const { name, email, password, companyName } = form;
    if (!name || !email || !password || !companyName) {
      return toast.error("All fields are required");
    }

    try {
      await api.post("/superadmin/create-admin", form);
      toast.success("Admin created successfully");
      setForm({ name: "", email: "", password: "", companyName: "" });
      setShowCreateModal(false);
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Create failed");
    }
  };

  /* ===== EDIT ADMIN ===== */
  const openEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setEditForm({ name: admin.name, email: admin.email });
    setShowEditModal(true);
  };

  const updateAdmin = async () => {
    try {
      await api.put(`/superadmin/admin/${editingAdmin._id}`, editForm);
      toast.success("Admin updated");
      setShowEditModal(false);
      loadAdmins();
    } catch {
      toast.error("Update failed");
    }
  };

  /* ===== RESET PASSWORD ===== */
  const openResetPassword = (admin) => {
    setEditingAdmin(admin);
    setShowResetModal(true);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/superadmin/admin/${editingAdmin._id}`, {
        password: e.target.password.value
      });
      toast.success("Password reset successful");
      setShowResetModal(false);
    } catch {
      toast.error("Password reset failed");
    }
  };

  /* ===== DELETE (CONFIRM MODAL) ===== */
  const openDeleteModal = (companyId, companyName) => {
    setDeleteCompanyId(companyId);
    setDeleteCompanyName(companyName);
    setShowDeleteModal(true);
  };

  const confirmDeleteAdmin = async () => {
    try {
      await api.delete(`/superadmin/company/${deleteCompanyId}`);
      toast.success("Company and admins deleted");
      setShowDeleteModal(false);
      setDeleteCompanyId(null);
      setDeleteCompanyName("");
      loadAdmins();
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ===== FILTER LOGIC ===== */
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const textMatch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase());

      const companyMatch = companyFilter
        ? a.companyId?.name === companyFilter
        : true;

      return textMatch && companyMatch;
    });
  }, [admins, search, companyFilter]);

  const companies = [
    ...new Set(admins.map((a) => a.companyId?.name).filter(Boolean))
  ];

  /* ===== UI ===== */
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">
            Super Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500">{profile?.email}</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <FiUserPlus size={14} /> Create Admin
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="buffer-card p-3 flex flex-col md:flex-row gap-3">
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/3">
          <FiSearch className="text-gray-400 mr-2" size={14} />
          <input
            placeholder="Search name or email"
            className="outline-none w-full text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm md:w-1/4"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="buffer-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Company</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((a) => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">{a.name}</td>
                <td className="px-4 py-3 text-gray-500">{a.email}</td>
                <td className="px-4 py-3 text-gray-500">{a.companyId?.name || "-"}</td>
                <td className="px-4 py-3 flex justify-center gap-1">
                  <ActionBtn icon={<FiEdit />} onClick={() => openEditAdmin(a)} />
                  <ActionBtn icon={<FiKey />} onClick={() => openResetPassword(a)} />
                  <ActionBtn
                    icon={<FiTrash2 />}
                    danger
                    onClick={() =>
                      openDeleteModal(
                        a.companyId._id,
                        a.companyId?.name
                      )
                    }
                  />
                </td>
              </tr>
            ))}

            {filteredAdmins.length === 0 && (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-xs text-gray-400">
                  No admins found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <Modal title="Create Admin" onClose={() => setShowCreateModal(false)}>
          <ModalInput placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <ModalInput placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <ModalInput type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <ModalInput placeholder="Company Name" onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <ModalSave onClick={createAdmin} />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <Modal title="Edit Admin" onClose={() => setShowEditModal(false)}>
          <ModalInput value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <ModalInput value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <ModalSave onClick={updateAdmin} />
        </Modal>
      )}

      {/* RESET MODAL */}
      {showResetModal && (
        <Modal title="Reset Password" onClose={() => setShowResetModal(false)}>
          <form onSubmit={resetPassword} className="space-y-4">
            <ModalInput type="password" name="password" placeholder="New Password" />
            <ModalSave type="submit" />
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl">
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="bg-red-50 text-red-600 p-1.5 rounded-lg">
                  <FiTrash2 size={14} />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Delete {deleteCompanyName}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                This will permanently delete the company and all its admins. This action cannot be undone.
              </p>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="buffer-button-secondary text-sm py-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAdmin}
                className="buffer-button text-sm py-2 text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== REUSABLE UI ===== */

const ActionBtn = ({ icon, danger, onClick }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-md hover:bg-gray-100 ${
      danger ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
    }`}
  >
    {icon}
  </button>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

const ModalInput = (props) => (
  <input
    {...props}
    className="buffer-input text-sm"
  />
);

const ModalSave = ({ ...props }) => (
  <button
    {...props}
    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
  >
    Save
  </button>
);
