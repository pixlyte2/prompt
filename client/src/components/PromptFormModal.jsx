import { useEffect, useState } from "react";
import { X, Save, Plus } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

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
        channelId: editingPrompt.channelId?._id || editingPrompt.channelId,
        promptTypeId: editingPrompt.promptTypeId?._id || editingPrompt.promptTypeId,
        aiModel: editingPrompt.aiModel || "",
        promptText: editingPrompt.promptText
      });

      loadTypes(editingPrompt.channelId?._id || editingPrompt.channelId);
    } else {
      setForm({
        channelId: "",
        promptTypeId: "",
        aiModel: "",
        promptText: ""
      });
      setTypes([]);
    }
  }, [editingPrompt, isOpen]);

  const loadTypes = async (channelId) => {
    if (!channelId) {
      setTypes([]);
      return;
    }

    try {
      const res = await api.get(`/prompt-types/channel/${channelId}`);
      setTypes(res.data);
    } catch (err) {
      toast.error("Failed to load prompt types");
    }
  };

  const submit = async () => {
    if (!form.channelId || !form.promptTypeId || !form.promptText.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      if (editingPrompt) {
        await api.put(`/prompts/${editingPrompt._id}`, form);
        toast.success("Prompt updated successfully");
      } else {
        await api.post("/prompts", form);
        toast.success("Prompt created successfully");
      }

      onSuccess();
      onClose();

    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {editingPrompt ? (
                <Save className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {editingPrompt ? "Edit Prompt" : "Create New Prompt"}
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-blue-600 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Channel *
              </label>
              <select
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
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
                disabled={loading}
              >
                <option value="">Select a channel...</option>
                {channels.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Prompt Type *
              </label>
              <select
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white disabled:bg-gray-50"
                value={form.promptTypeId}
                onChange={(e) => setForm({ ...form, promptTypeId: e.target.value })}
                disabled={loading || !form.channelId}
              >
                <option value="">
                  {!form.channelId ? "Select a channel first" : "Select prompt type..."}
                </option>
                {types.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {!form.channelId && (
                <p className="text-sm text-gray-500 mt-2">
                  Please select a channel to see available prompt types
                </p>
              )}
            </div>

            {/* AI Model */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                AI Model
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                placeholder="e.g., GPT-4, Claude, Gemini..."
                value={form.aiModel}
                onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Prompt Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Prompt Content *
              </label>
              <textarea
                rows={5}
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                placeholder="Enter your prompt text here..."
                value={form.promptText}
                onChange={(e) => setForm({ ...form, promptText: e.target.value })}
                disabled={loading}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-cyan-600 font-medium">
                  💡 Use [SOURCE] placeholder to insert dynamic content
                </p>
                <span className="text-sm text-gray-400">
                  {form.promptText.length} characters
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              * Required fields
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading || !form.channelId || !form.promptTypeId || !form.promptText.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingPrompt ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {editingPrompt ? (
                      <>
                        <Save className="w-4 h-4" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
