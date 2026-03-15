import { useEffect, useState } from "react";
import { X, Save, Plus, PlusCircle } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function PromptFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingPrompt = null,
  channels: initialChannels = []
}) {
  const [channels, setChannels] = useState(initialChannels);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  const [form, setForm] = useState({
    channelId: "",
    promptTypeId: "",
    aiModel: "",
    promptText: ""
  });

  useEffect(() => { setChannels(initialChannels); }, [initialChannels]);

  useEffect(() => {
    if (isOpen) loadTypes();
    if (editingPrompt) {
      setForm({
        channelId: editingPrompt.channelId?._id || editingPrompt.channelId,
        promptTypeId: editingPrompt.promptTypeId?._id || editingPrompt.promptTypeId,
        aiModel: editingPrompt.aiModel || "",
        promptText: editingPrompt.promptText
      });
    } else {
      setForm({ channelId: "", promptTypeId: "", aiModel: "", promptText: "" });
    }
  }, [editingPrompt, isOpen]);

  const loadTypes = async () => {
    try {
      const res = await api.get("/prompt-types");
      setTypes(res.data);
    } catch {
      toast.error("Failed to load prompt types");
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return toast.error("Channel name is required");
    try {
      setLoading(true);
      const res = await api.post("/channels", { name: newChannelName });
      toast.success("Channel created");
      setChannels(prev => [...prev, res.data]);
      setForm({ ...form, channelId: res.data._id });
      setNewChannelName("");
      setShowAddChannel(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  const createPromptType = async () => {
    if (!newTypeName.trim()) return toast.error("Prompt type name is required");
    try {
      setLoading(true);
      const res = await api.post("/prompt-types", { name: newTypeName });
      toast.success("Prompt type created");
      setTypes(prev => [...prev, res.data]);
      setForm({ ...form, promptTypeId: res.data._id });
      setNewTypeName("");
      setShowAddType(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create prompt type");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!form.channelId || !form.promptTypeId || !form.promptText.trim()) {
      return toast.error("Please fill in all required fields");
    }
    try {
      setLoading(true);
      if (editingPrompt) {
        await api.put(`/prompts/${editingPrompt._id}`, form);
        toast.success("Prompt updated");
      } else {
        await api.post("/prompts", form);
        toast.success("Prompt created");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { if (!loading) onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              {editingPrompt ? <Save size={16} className="text-blue-600" /> : <Plus size={16} className="text-blue-600" />}
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {editingPrompt ? "Edit Prompt" : "New Prompt"}
            </h2>
          </div>
          <button onClick={handleClose} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} autoComplete="off">
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Channel + Prompt Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel *</label>
              <div className="flex gap-1.5">
                <select
                  className="buffer-input text-sm flex-1"
                  value={form.channelId}
                  onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                  disabled={loading}
                  autoComplete="off"
                  data-form-type="other"
                >
                  <option value="">Select channel...</option>
                  {channels.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddChannel(true)}
                  className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-gray-300 hover:border-emerald-300"
                  title="Add channel"
                  disabled={loading}
                >
                  <PlusCircle size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prompt Type *</label>
              <div className="flex gap-1.5">
                <select
                  className="buffer-input text-sm flex-1"
                  value={form.promptTypeId}
                  onChange={(e) => setForm({ ...form, promptTypeId: e.target.value })}
                  disabled={loading}
                  autoComplete="off"
                  data-form-type="other"
                >
                  <option value="">Select type...</option>
                  {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddType(true)}
                  className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-gray-300 hover:border-emerald-300"
                  title="Add type"
                  disabled={loading}
                >
                  <PlusCircle size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Sub Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Type</label>
            <input
              type="text"
              className="buffer-input text-sm"
              placeholder="e.g., Crime, All, Sports..."
              value={form.aiModel}
              onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
              disabled={loading}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
            />
          </div>

          {/* Prompt Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prompt Content *</label>
            <textarea
              rows={6}
              className="buffer-input text-sm resize-none"
              placeholder="Enter your prompt text here..."
              value={form.promptText}
              onChange={(e) => setForm({ ...form, promptText: e.target.value })}
              disabled={loading}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
            />
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-xs text-blue-600">💡 Use [SOURCE] for content, [LENGTH] for video duration</p>
              <span className="text-xs text-gray-400">{form.promptText.length} chars</span>
            </div>
          </div>
        </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-gray-400">* Required</span>
          <div className="flex gap-2">
            <button onClick={handleClose} disabled={loading} className="buffer-button-secondary text-sm py-2 disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading || !form.channelId || !form.promptTypeId || !form.promptText.trim()}
              className="buffer-button-primary text-sm py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{editingPrompt ? "Updating..." : "Creating..."}</>
              ) : (
                <>{editingPrompt ? <><Save size={14} />Update</> : <><Plus size={14} />Create</>}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Add Channel */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Channel</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel name</label>
              <input
                placeholder="e.g. Instagram, YouTube..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createChannel()}
                maxLength={30}
                className="buffer-input text-sm"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => { setShowAddChannel(false); setNewChannelName(""); }} disabled={loading} className="buffer-button-secondary text-sm py-2">Cancel</button>
              <button onClick={createChannel} disabled={loading || !newChannelName.trim()} className="buffer-button-primary text-sm py-2 flex items-center gap-1.5 disabled:opacity-50">
                {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Add Prompt Type */}
      {showAddType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Prompt Type</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type name</label>
              <input
                placeholder="e.g. Script, Hook, CTA..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createPromptType()}
                maxLength={30}
                className="buffer-input text-sm"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => { setShowAddType(false); setNewTypeName(""); }} disabled={loading} className="buffer-button-secondary text-sm py-2">Cancel</button>
              <button onClick={createPromptType} disabled={loading || !newTypeName.trim()} className="buffer-button-primary text-sm py-2 flex items-center gap-1.5 disabled:opacity-50">
                {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
