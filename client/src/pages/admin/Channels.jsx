import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import api from "../../utils/api";

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [name, setName] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [editName, setEditName] = useState("");

  /* ================= LOAD ================= */

  const loadChannels = async () => {
    const res = await api.get("/channels");
    setChannels(res.data);
  };

  useEffect(() => {
    loadChannels();
  }, []);

  /* ================= CREATE ================= */

  const createChannel = async () => {
    if (!name) return alert("Channel name required");
    await api.post("/channels", { name });
    setName("");
    loadChannels();
  };

  /* ================= EDIT (MODAL) ================= */

  const openEditModal = (channel) => {
    setEditingChannel(channel);
    setEditName(channel.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingChannel(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editName) return alert("Channel name required");

    await api.put(`/channels/${editingChannel._id}`, {
      name: editName
    });

    closeModal();
    loadChannels();
  };

  /* ================= DELETE ================= */

  const deleteChannel = async (id) => {
    if (!window.confirm("Delete this channel?")) return;
    await api.delete(`/channels/${id}`);
    loadChannels();
  };

  return (
    <AdminLayout title="Channel Management">
      {/* CREATE CHANNEL */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Create Channel</h3>

        <div className="flex gap-3">
          <input
            className="border px-3 py-2 rounded-lg w-full"
            placeholder="Channel name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            onClick={createChannel}
            className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* CHANNEL LIST */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Channels</h3>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Channel Name</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {channels.map((c) => (
              <tr key={c._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-center space-x-3">
                  <button
                    onClick={() => openEditModal(c)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteChannel(c._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {channels.length === 0 && (
          <p className="text-gray-500 mt-4">No channels found</p>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              Edit Channel
            </h3>

            <input
              className="w-full border px-3 py-2 rounded-lg mb-4"
              placeholder="Channel name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
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
