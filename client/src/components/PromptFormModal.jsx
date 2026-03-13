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

  useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);

  useEffect(() => {
    if (isOpen) {
      loadTypes();
    }

    if (editingPrompt) {
      setForm({
        channelId: editingPrompt.channelId?._id || editingPrompt.channelId,
        promptTypeId: editingPrompt.promptTypeId?._id || editingPrompt.promptTypeId,
        aiModel: editingPrompt.aiModel || "",
        promptText: editingPrompt.promptText
      });
    } else {
      setForm({
        channelId: "",
        promptTypeId: "",
        aiModel: "",
        promptText: ""
      });
    }
  }, [editingPrompt, isOpen]);

  const loadTypes = async () => {
    try {
      const res = await api.get('/prompt-types');
      setTypes(res.data);
    } catch (err) {
      toast.error("Failed to load prompt types");
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error("Channel name is required");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/channels", { name: newChannelName });
      toast.success("Channel created successfully");
      
      // Add the new channel to the local state immediately
      setChannels(prev => [...prev, res.data]);
      
      // Set the newly created channel as selected
      setForm({ ...form, channelId: res.data._id });
      
      // Reset and close
      setNewChannelName("");
      setShowAddChannel(false);
      
      // Reload parent's channels list
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  const createPromptType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Prompt type name is required");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/prompt-types", { 
        name: newTypeName
        // channelId is omitted - prompt types are now independent
      });
      toast.success("Prompt type created successfully");
      
      // Add the new type to the local state immediately
      setTypes(prev => [...prev, res.data]);
      
      // Set the newly created type as selected
      setForm({ ...form, promptTypeId: res.data._id });
      
      // Reset and close
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
            {/* Channel and Prompt Type in Single Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Channel *
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
                    value={form.channelId}
                    onChange={(e) => setForm({ ...form, channelId: e.target.value })}
                    disabled={loading}
                  >
                    <option value="">Select a channel...</option>
                    {channels.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddChannel(true)}
                    className="px-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Add new channel"
                    disabled={loading}
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              </div>

              {/* Prompt Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Prompt Type *
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
                    value={form.promptTypeId}
                    onChange={(e) => setForm({ ...form, promptTypeId: e.target.value })}
                    disabled={loading}
                  >
                    <option value="">Select prompt type...</option>
                    {types.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddType(true)}
                    className="px-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Add new prompt type"
                    disabled={loading}
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sub Type - Full Width and Larger */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Sub Type
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-200 px-4 py-4 rounded-xl text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                placeholder="e.g., Crime, All, Sports..."
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
                  💡 Use [SOURCE] for content, [LENGTH] for video duration
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

      {/* Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PlusCircle size={24} />
                Add New Channel
              </h3>
              <button onClick={() => setShowAddChannel(false)} className="hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Channel Name</label>
              <input
                placeholder="Enter channel name..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                maxLength={30}
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && createChannel()}
              />
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAddChannel(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={createChannel}
                disabled={loading || !newChannelName.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle size={20} />
                    Create Channel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prompt Type Modal */}
      {showAddType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PlusCircle size={24} />
                Add New Prompt Type
              </h3>
              <button onClick={() => setShowAddType(false)} className="hover:bg-white/20 p-2 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Prompt Type Name</label>
              <input
                placeholder="Enter prompt type name..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                maxLength={30}
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && createPromptType()}
              />
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAddType(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={createPromptType}
                disabled={loading || !newTypeName.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle size={20} />
                    Create Type
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
