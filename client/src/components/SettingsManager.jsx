import { useState, useEffect } from "react";
import { Save, Key, Eye, EyeOff, Shield, CheckCircle2, XCircle, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { encryptData, decryptData } from "../utils/encryption";

export default function SettingsManager() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => { loadApiKey(); }, []);

  const loadApiKey = async () => {
    const stored = localStorage.getItem("GEMINI_API_KEY_ENC");
    if (stored) {
      setHasStoredKey(true);
      const decrypted = await decryptData(stored);
      if (decrypted) setApiKey(decrypted);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return toast.error("Please enter an API key");
    if (apiKey.length < 10) return toast.error("API key seems too short");
    setLoading(true);
    try {
      const encrypted = await encryptData(apiKey);
      localStorage.setItem("GEMINI_API_KEY_ENC", encrypted);
      setHasStoredKey(true);
      toast.success("API key saved");
    } catch {
      toast.error("Failed to encrypt API key");
    } finally {
      setLoading(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem("GEMINI_API_KEY_ENC");
    setApiKey("");
    setHasStoredKey(false);
    toast.success("API key cleared");
  };

  return (
    <div className="max-w-lg space-y-3">
      {/* Status */}
      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${
        hasStoredKey ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      }`}>
        {hasStoredKey
          ? <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          : <XCircle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
        }
        <span className={`text-xs font-medium ${hasStoredKey ? "text-emerald-800 dark:text-emerald-200" : "text-amber-800 dark:text-amber-200"}`}>
          {hasStoredKey ? "API key configured — encrypted with AES-256-GCM" : "No API key configured — AI Chat won't work"}
        </span>
      </div>

      {/* API Key Card */}
      <div className="buffer-card">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Key size={14} className="text-gray-400 dark:text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Gemini API Key</h3>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
              placeholder="AIzaSy..."
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="api-key-field"
              id="gemini-api-key"
              className="buffer-input text-sm font-mono pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded"
              tabIndex={-1}
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              Get key from Google AI Studio <ExternalLink size={10} />
            </a>
            <div className="flex gap-2">
              {hasStoredKey && (
                <button
                  onClick={clearApiKey}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
              <button
                onClick={saveApiKey}
                disabled={loading || !apiKey.trim()}
                className="buffer-button-primary text-xs py-1.5 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={12} /> Save</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How-to */}
      <div className="buffer-card">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Setup Guide</h3>
        </div>
        <div className="p-4">
          <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-2">
            {[
              "Visit Google AI Studio",
              "Sign in with your Google account",
              "Click \"Create API Key\"",
              "Paste the key above and hit Save"
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center flex-shrink-0 text-xs font-medium">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <Shield size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Your key is encrypted locally with AES-256-GCM and never leaves your browser.
        </p>
      </div>
    </div>
  );
}