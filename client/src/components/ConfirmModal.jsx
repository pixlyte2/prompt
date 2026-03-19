import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            {danger && (
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="buffer-button-secondary text-sm py-2 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`buffer-button text-sm py-2 text-white flex items-center gap-1.5 disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
