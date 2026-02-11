  import { useEffect, useState } from "react";
  import api from "../utils/api";
  import { getRole } from "../utils/api";

  export default function PromptManager() {
    const role = getRole(); // admin | content_manager | viewer

    const [prompts, setPrompts] = useState([]);
    const [channels, setChannels] = useState([]);
    const [types, setTypes] = useState([]);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
      channelId: "", 
      promptTypeId: "",
      aiModel: "",
      promptText: ""
    });

    /* ================= LOAD DATA ================= */

    const loadPrompts = async () => {
      const res = await api.get("/prompts");
      setPrompts(res.data);
    };

    const loadChannels = async () => {
      const res = await api.get("/channels");
      setChannels(res.data);
    };

  const loadTypes = async (channelId) => {
    if (!channelId) {
      setTypes([]);
      return;
    }

    const res = await api.get(`/prompt-types/channel/${channelId}`);
    setTypes(res.data); // array of objects
  };

    useEffect(() => {
      loadPrompts();
      loadChannels();
    }, []);

    /* ================= CREATE / UPDATE ================= */

    const submit = async () => {
    if (!form.channelId || !form.promptTypeId || !form.promptText) {
    return alert("All fields are required");
  }


      if (editingId) {
        await api.put(`/prompts/${editingId}`, form);
      } else {
        await api.post("/prompts", form);

      }

      closeModal();
      loadPrompts();
    };

    /* ================= MODAL HANDLERS ================= */

    const openCreate = () => {
      setEditingId(null);
      setForm({
        channelId: "",
        promptTypeId: "",
        aiModel: "",
        promptText: ""
      });
      setTypes([]);
      setShowModal(true);
    };

    const openEdit = async (p) => {
      setEditingId(p._id);
      setForm({
        channelId: p.channelId,
        promptTypeId: p.promptTypeId,
        aiModel: p.aiModel || "",
        promptText: p.promptText
      });

      await loadTypes(p.channelId);
      setShowModal(true);
    };

    const closeModal = () => {
      setShowModal(false);
      setEditingId(null);
      setTypes([]);
    };

    /* ================= DELETE ================= */

    const deletePrompt = async (id) => {
      if (!window.confirm("Delete this prompt?")) return;
      await api.delete(`/prompts/${id}`);
      loadPrompts();
    };

    /* ================= COPY ================= */

    const copyText = (text) => {
      navigator.clipboard.writeText(text);
      alert("Prompt copied");
    };

    /* ================= SEARCH + PAGINATION ================= */

   const filtered = prompts.filter(
  (p) =>
    p.promptText?.toLowerCase().includes(search.toLowerCase()) ||
    p.promptTypeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.channelId?.name?.toLowerCase().includes(search.toLowerCase())
);


    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    return (
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Prompt Manager</h2>

          {(role === "admin" || role === "content_manager") && (
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Prompt
            </button>
          )}
        </div>

        {/* SEARCH */}
        <input
          placeholder="Search by channel / type / text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg"
        />

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Channel</th>
                <th className="p-3">Type</th>
                <th className="p-3">Model</th>
                <th className="p-3">Prompt</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((p) => (
                <tr key={p._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{p.channelId?.name || "-"}</td>
                  <td className="p-3 font-medium">{p.promptTypeId?.name || "-"}</td>
                  <td className="p-3">{p.aiModel || "-"}</td>
                  <td className="p-3 max-w-md truncate">{p.promptText}</td>

                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => copyText(p.promptText)}
                      className="text-gray-600"
                    >
                      Copy
                    </button>

                    {(role === "admin" || role === "content_manager") && (
                      <button
                        onClick={() => openEdit(p)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                    )}

                    {role === "admin" && (
                      <button
                        onClick={() => deletePrompt(p._id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="p-4 text-gray-500">No prompts found</p>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  page === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? "Edit Prompt" : "Create Prompt"}
              </h3>

              {/* Channel */}
          <select
                  className="w-full mb-3 border px-3 py-2 rounded"
                  value={form.channelId}
                  onChange={(e) => {
                    const channelId = e.target.value;

                    setForm({
                      ...form,
                      channelId,
                      promptTypeId: ""
                    });

                    loadTypes(channelId); // 🔥 send ID
                  }}
                >
                  <option value="">Select Channel</option>

                  {channels.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>


              {/* Prompt Type Dropdown */}
              <select
                className="w-full mb-3 border px-3 py-2 rounded"
                value={form.promptTypeId}
                onChange={(e) =>
                  setForm({ ...form, promptTypeId: e.target.value })
                }
              >
                <option value="">Select Prompt Type</option>
              {types.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}

              </select>

              {/* AI MODEL */}
              <input
                className="w-full mb-3 border px-3 py-2 rounded"
                placeholder="AI Model"
                value={form.aiModel}
                onChange={(e) =>
                  setForm({ ...form, aiModel: e.target.value })
                }
              />

              {/* PROMPT TEXT */}
              <textarea
                rows={4}
                className="w-full mb-4 border px-3 py-2 rounded"
                placeholder="Prompt Text"
                value={form.promptText}
                onChange={(e) =>
                  setForm({ ...form, promptText: e.target.value })
                }
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
