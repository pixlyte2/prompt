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
      <div className="buffer-card p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gemini API Key *
            </label>
            <div className="relative max-w-md">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                name="api-key-field"
                id="gemini-api-key"
                className="buffer-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                tabIndex={-1}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Key size={16} />
              How to get your API key:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-4">
              <li>Visit Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Click "Create API Key"</li>
              <li>Copy and paste the key here</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
              <Shield size={16} />
              Security:
            </h3>
            <p className="text-sm text-green-800">
              Your API key is encrypted with AES-256-GCM before storage. It's stored locally in your browser and never sent to our servers.
            </p>
          </div>

          <div className="flex justify-between gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearApiKey}
              disabled={!apiKey}
              className="buffer-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Key
            </button>
            <button
              onClick={saveApiKey}
              disabled={loading}
              className="buffer-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Encrypting...
                </>
              ) : (
                <>
                  <Save size={16} />
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
