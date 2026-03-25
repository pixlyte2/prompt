import { useState } from "react";
import { Loader2, X, Copy, AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { decryptData } from "../utils/encryption";

const MODELS = [
  { value: "gemini-2.5-flash", label: "Flash 2.5" },
  { value: "gemini-2.5-pro", label: "Pro 2.5" },
  { value: "gemini-2.0-flash", label: "Flash 2.0" },
];

const SEV = {
  High: { icon: AlertTriangle, text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  Medium: { icon: Info, text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  Low: { icon: CheckCircle2, text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
};

export default function ContentValidator() {
  const [content, setContent] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleValidate = async () => {
    if (!content.trim()) {
      toast.error("Paste some content first");
      return;
    }

    const storedKey = localStorage.getItem("GEMINI_API_KEY_ENC");
    if (!storedKey) {
      toast.error("Configure your Gemini API key in Settings");
      return;
    }

    let apiKey;
    try {
      apiKey = await decryptData(storedKey);
      if (!apiKey) {
        toast.error("Failed to decrypt API key");
        return;
      }
    } catch (e) {
      toast.error("Error accessing API key");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        import.meta.env.VITE_API_URL + "/ai/validate",
        { content: content, aiModel: model, apiKey: apiKey },
        {
          timeout: 120000,
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
            "Content-Type": "application/json",
          },
        }
      );
      setResult(res.data);
      setShowModal(true);
    } catch (err) {
      toast.error(
        (err.response && err.response.data && err.response.data.message) ||
          "Validation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  var issueCount = (result && result.issues && result.issues.length) || 0;
  var highCount =
    (result &&
      result.issues &&
      result.issues.filter(function (i) {
        return i.severity === "High";
      }).length) ||
    0;

  return (
    <div className="buffer-card flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Controls */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <select
            value={model}
            onChange={function (e) { setModel(e.target.value); }}
            className="buffer-input text-sm py-2 px-3 w-40"
          >
            {MODELS.map(function (m) {
              return (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              );
            })}
          </select>
          <button
            onClick={handleValidate}
            disabled={loading || !content.trim()}
            className="buffer-button-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Validate
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {content && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {wordCount} words &middot; {content.length.toLocaleString()} chars
            </span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-3 min-h-0">
        <textarea
          value={content}
          onChange={function (e) { setContent(e.target.value); }}
          placeholder="Paste your YouTube description, title, tags, or any content you want to validate..."
          className="w-full h-full border-0 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none leading-relaxed"
        />
      </div>

      {/* Results Modal */}
      {showModal && result && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={function () { setShowModal(false); }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-buffer-lg"
            onClick={function (e) { e.stopPropagation(); }}
          >
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={
                    "w-9 h-9 rounded-lg flex items-center justify-center " +
                    (issueCount > 0
                      ? "bg-amber-50 dark:bg-amber-900/30"
                      : "bg-emerald-50 dark:bg-emerald-900/30")
                  }
                >
                  {issueCount > 0 ? (
                    <AlertTriangle size={17} className="text-amber-500" />
                  ) : (
                    <CheckCircle2 size={17} className="text-emerald-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {issueCount > 0
                      ? issueCount + " issue" + (issueCount > 1 ? "s" : "") + " found"
                      : "No issues found"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {highCount > 0 ? highCount + " high severity" : "Content looks good"}
                  </p>
                </div>
              </div>
              <button
                onClick={function () { setShowModal(false); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {issueCount > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Issues
                  </h4>
                  <div className="space-y-2">
                    {result.issues.map(function (issue, i) {
                      var s = SEV[issue.severity] || SEV.Low;
                      var SevIcon = s.icon;
                      return (
                        <div
                          key={i}
                          className={s.bg + " " + s.border + " border rounded-lg px-3.5 py-3 flex gap-3"}
                        >
                          <SevIcon size={15} className={s.text + " mt-0.5 flex-shrink-0"} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className={
                                  "text-[10px] font-bold uppercase tracking-wide " +
                                  s.badge +
                                  " px-1.5 py-0.5 rounded"
                                }
                              >
                                {issue.severity}
                              </span>
                              {issue.type && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {issue.type}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {issue.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.optimizedContent && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Optimized Content
                    </h4>
                    <button
                      onClick={function () {
                        navigator.clipboard.writeText(result.optimizedContent);
                        toast.success("Copied!");
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {result.optimizedContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end flex-shrink-0">
              <button
                onClick={function () { setShowModal(false); }}
                className="buffer-button-secondary text-xs py-1.5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
