import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";

export default function PromptTypes() {
  const [channels, setChannels] = useState([]);
  const [types, setTypes] = useState([]);

  const [form, setForm] = useState({
    name: "",
    channelId: ""
  });

  /* ===== EDIT MODAL ===== */
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  /* ===== LOAD ===== */
  const load = async () => {
    const ch = await api.get("/channels");
    const pt = await api.get("/prompt-types");

    setChannels(ch.data);
    setTypes(pt.data);
  };

  useEffect(() => {
    load();
  }, []);

  /* ===== CREATE ===== */
  const create = async () => {
    if (!form.name || !form.channelId) {
      return alert("All fields required");
    }

    await api.post("/prompt-types", form);
    setForm({ name: "", channelId: "" });
    load();
  };

  /* ===== EDIT ===== */
  const openEdit = (type) => {
    setEditing(type);
    setEditName(type.name);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editName) return alert("Name required");

    await api.put(`/prompt-types/${editing._id}`, {
      name: editName
    });

    setShowEdit(false);
    setEditing(null);
    setEditName("");
    load();
  };

  /* ===== DELETE ===== */
  const deleteType = async (id) => {
    if (!window.confirm("Delete this prompt type?")) return;

    await api.delete(`/prompt-types/${id}`);
    load();
  };

  return (
    <AdminLayout title="Prompt Types">
      {/* ===== CREATE FORM ===== */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Create Prompt Type
        </h3>

        <div className="flex gap-3">
          <input
            className="border px-3 py-2 rounded-lg w-full"
            placeholder="Prompt type name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <select
            className="border px-3 py-2 rounded-lg"
            value={form.channelId}
            onChange={(e) =>
              setForm({ ...form, channelId: e.target.value })
            }
          >
            <option value="">Select Channel</option>
            {channels.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={create}
            className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">
          Prompt Types
        </h3>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Channel</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {types.map((t) => (
              <tr
                key={t._id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">{t.name}</td>
                <td className="p-3">
                  {t.channelId?.name || "-"}
                </td>
                <td className="p-3 text-center space-x-3">
                  <button
                    onClick={() => openEdit(t)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteType(t._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {types.length === 0 && (
          <p className="text-gray-500 mt-4">
            No prompt types found
          </p>
        )}
      </div>

      {/* ===== EDIT MODAL ===== */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Edit Prompt Type
            </h3>

            <input
              className="w-full border px-3 py-2 rounded-lg mb-4"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
