import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import useLoading from "../../hooks/useLoading";
import PageSectionLoader from "../../components/PageSectionLoader";

export default function Users() {

  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer"
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const { startLoading, stopLoading, isLoading } = useLoading();

  /* ================= LOAD USERS ================= */

  const loadUsers = async () => {

    try {

      startLoading("page");   // 🔥 USERS SECTION ONLY LOADER

      const res = await api.get("/users");
      setUsers(res.data);

    } catch {
      toast.error("Failed to load users");
    } finally {

      stopLoading("page");

    }

  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ================= CREATE USER ================= */

  const createUser = async () => {

    if (!form.name || !form.email || !form.password) {
      return toast.error("All fields required");
    }

    try {

      await api.post("/users/content", form);

      toast.success("User created successfully");

      setForm({
        name: "",
        email: "",
        password: "",
        role: "viewer"
      });

      loadUsers();

    } catch (err) {

      toast.error(
        err.response?.data?.message || "User creation failed"
      );

    }

  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {

    if (!selectedUserId) return;

    try {

      setLoadingDelete(true);

      await api.delete(`/users/${selectedUserId}`);

      setConfirmOpen(false);
      setSelectedUserId(null);

      toast.success("User deleted successfully");

      loadUsers();

    } catch {

      toast.error("Failed to delete user");

    } finally {

      setLoadingDelete(false);

    }

  };

  /* ================= ROLE BADGE ================= */

  const getRoleBadge = (role) => {
    switch (role) {
      case "content_manager":
        return "bg-blue-100 text-blue-700";
      case "admin":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout title="User Management">

      <div className="relative">

        {/* 🔥 PAGE SECTION LOADER */}
        <PageSectionLoader show={isLoading("page")} />

        {/* CREATE USER */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Create User
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

            <input
              className="border px-3 py-2 rounded-lg"
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              className="border px-3 py-2 rounded-lg"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              type="password"
              className="border px-3 py-2 rounded-lg"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <select
              className="border px-3 py-2 rounded-lg"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="viewer">Viewer</option>
              <option value="content_manager">
                Content Manager
              </option>
            </select>

            <button
              onClick={createUser}
              className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create
            </button>

          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white p-6 rounded-xl shadow">

          <h3 className="text-lg font-semibold mb-4">
            Users
          </h3>

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>

              {users.map((u) => (
                <tr key={u._id} className="border-t">

                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadge(
                        u.role
                      )}`}
                    >
                      {u.role.replace("_", " ")}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedUserId(u._id);
                        setConfirmOpen(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

          {users.length === 0 && (
            <p className="text-gray-500 mt-4">
              No users found
            </p>
          )}

        </div>

        {/* DELETE MODAL */}
        <ConfirmModal
          isOpen={confirmOpen}
          title="Delete User"
          message="Are you sure you want to delete this user?"
          confirmText="Delete"
          cancelText="Cancel"
          loading={loadingDelete}
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirmOpen(false);
            setSelectedUserId(null);
          }}
        />

      </div>

    </AdminLayout>
  );
}