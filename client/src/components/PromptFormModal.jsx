import { useEffect, useState } from "react";
import api from "../utils/api";

export default function PromptFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingPrompt = null,
  channels = []
}) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    channelId: "",
    promptTypeId: "",
    aiModel: "",
    promptText: ""
  });

  useEffect(() => {
    if (editingPrompt) {
      setForm({
        channelId: editingPrompt.channelId,
        promptTypeId: editingPrompt.promptTypeId,
        aiModel: editingPrompt.aiModel || "",
        promptText: editingPrompt.promptText
      });

      loadTypes(editingPrompt.channelId);
    } else {
      setForm({
        channelId: "",
        promptTypeId: "",
        aiModel: "",
        promptText: ""
      });
      setTypes([]);
    }
  }, [editingPrompt]);

  const loadTypes = async (channelId) => {
    if (!channelId) {
      setTypes([]);
      return;
    }

    const res = await api.get(`/prompt-types/channel/${channelId}`);
    setTypes(res.data);
  };

  const submit = async () => {
    if (!form.channelId || !form.promptTypeId || !form.promptText) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      if (editingPrompt) {
        await api.put(`/prompts/${editingPrompt._id}`, form);
      } else {
        await api.post("/prompts", form);
      }

      onSuccess();   // refresh parent
      onClose();     // close modal

    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">
          {editingPrompt ? "Edit Prompt" : "Create Prompt"}
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

            loadTypes(channelId);
          }}
        >
          <option value="">Select Channel</option>
          {channels.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Prompt Type */}
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

        {/* AI Model */}
        <input
          className="w-full mb-3 border px-3 py-2 rounded"
          placeholder="AI Model"
          value={form.aiModel}
          onChange={(e) =>
            setForm({ ...form, aiModel: e.target.value })
          }
        />

        {/* Prompt Text */}
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {editingPrompt ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
