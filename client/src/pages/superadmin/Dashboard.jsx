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
    <div className="min-h-screen bg-gray-50 p-8 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">{profile?.email}</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <FiUserPlus /> Create Admin
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-md shadow-sm p-4 flex flex-col md:flex-row gap-4">
        <div className="flex items-center border rounded px-3 py-2 w-full md:w-1/3">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            placeholder="Search name or email"
            className="outline-none w-full text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border rounded px-3 py-2 text-sm md:w-1/4"
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
      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((a) => (
              <tr key={a._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{a.name}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3">{a.companyId?.name || "-"}</td>
                <td className="p-3 flex justify-center gap-3">
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
                <td colSpan="4" className="p-6 text-center text-gray-400">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-2 rounded-full">
                <FiTrash2 />
              </div>
              <h3 className="text-lg font-semibold">
                Delete {deleteCompanyName}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete the company and all its admins.
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAdmin}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
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
    className={`p-2 rounded hover:bg-gray-100 ${
      danger ? "text-red-600" : "text-indigo-600"
    }`}
  >
    {icon}
  </button>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-md w-full max-w-md p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        <button onClick={onClose}><FiX /></button>
      </div>
      {children}
    </div>
  </div>
);

const ModalInput = (props) => (
  <input
    {...props}
    className="w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-500"
  />
);

const ModalSave = ({ ...props }) => (
  <button
    {...props}
    className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
  >
    Save
  </button>
);
