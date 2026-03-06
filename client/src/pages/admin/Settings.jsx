import { useState, useEffect } from "react";
import { Save, Key, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import { encryptData, decryptData } from "../../utils/encryption";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    const stored = localStorage.getItem("GEMINI_API_KEY_ENC");
    if (stored) {
      const decrypted = await decryptData(stored);
      if (decrypted) setApiKey(decrypted);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    if (apiKey.length < 10) {
      toast.error("API key seems too short. Please check your key");
      return;
    }

    setLoading(true);
    try {
      const encrypted = await encryptData(apiKey);
      localStorage.setItem("GEMINI_API_KEY_ENC", encrypted);
      toast.success("API key encrypted and saved");
    } catch {
      toast.error("Failed to encrypt API key");
    } finally {
      setLoading(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem("GEMINI_API_KEY_ENC");
    setApiKey("");
    toast.success("API key cleared");
  };

  return (
    <AdminLayout 
      title="Settings" 
      titleInfo="Configure your Gemini API key with AES-256-GCM encryption"
      icon={Shield}
    >

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Gemini API Key *
            </label>
            <div className="relative w-96">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full border-2 border-gray-200 px-5 py-4 pr-14 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-base"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {showKey ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 font-semibold underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-5 rounded-lg">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              📌 How to get your API key:
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li className="font-medium">Visit Google AI Studio</li>
              <li className="font-medium">Sign in with your Google account</li>
              <li className="font-medium">Click "Create API Key"</li>
              <li className="font-medium">Copy and paste the key here</li>
            </ol>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-5 rounded-lg">
            <h3 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
              <Shield size={18} />
              Security:
            </h3>
            <p className="text-sm text-green-800 leading-relaxed">
              Your API key is encrypted with AES-256-GCM before storage. It's stored locally in your browser and never sent to our servers.
            </p>
          </div>

          <div className="flex justify-between gap-4 pt-6 border-t">
            <button
              onClick={clearApiKey}
              disabled={!apiKey}
              className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              Clear Key
            </button>
            <button
              onClick={saveApiKey}
              disabled={loading}
              className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Encrypting...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save API Key
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
