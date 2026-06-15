import axios from "axios";
import api, { httpClient } from "../services/api";

/** Keep in sync with server/middleware/voiceOverUpload.js */
export const VOICE_OVER_MAX_BYTES = 40 * 1024 * 1024;

/** Assume ~256 Kbps upload — timeout scales with file size for slow connections */
const MIN_UPLOAD_BYTES_PER_SEC = 32 * 1024;
const UPLOAD_TIMEOUT_BASE_MS = 60_000;
const UPLOAD_TIMEOUT_MIN_MS = 120_000;
const UPLOAD_TIMEOUT_MAX_MS = 900_000;
const UPLOAD_MAX_RETRIES = 3;
const UPLOAD_RETRY_BASE_MS = 1500;

/**
 * @param {number} fileSizeBytes
 * @returns {number}
 */
export function voiceOverUploadTimeoutMs(fileSizeBytes) {
  const size = Math.min(Math.max(fileSizeBytes, 0), VOICE_OVER_MAX_BYTES);
  const transferMs = (size / MIN_UPLOAD_BYTES_PER_SEC) * 1000;
  return Math.min(
    UPLOAD_TIMEOUT_MAX_MS,
    Math.max(UPLOAD_TIMEOUT_MIN_MS, UPLOAD_TIMEOUT_BASE_MS + transferMs),
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isRetryableUploadError(err) {
  if (!err || typeof err !== "object") return false;
  if (axios.isCancel?.(err) || err.code === "ERR_CANCELED" || err.name === "CanceledError") {
    return false;
  }
  const status = err.response?.status;
  if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }
  if (err.code === "ECONNABORTED" || err.code === "ERR_NETWORK" || !err.response) {
    return true;
  }
  return status >= 500 || status === 408 || status === 429;
}

/**
 * @param {unknown} err
 * @returns {string}
 */
function uploadErrorMessage(err) {
  if (!err || typeof err !== "object") return "Upload failed";
  if (err.code === "ECONNABORTED" || String(err.message || "").includes("timeout")) {
    return "Upload timed out on a slow connection. Please wait and try again, or use a smaller file.";
  }
  if (err.code === "ERR_NETWORK" || !err.response) {
    return "Network error during upload. Check your connection and try again.";
  }
  const msg = err.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  return err.message || "Upload failed";
}

/**
 * Download task voice-over audio (authenticated). Throws on error.
 * @param {{ _id: string, voiceOverOriginalName?: string, voiceOverStoredName?: string }} task
 */
export async function downloadVoiceOverFile(task) {
  try {
    const res = await httpClient.get(`/video-tasks/${task._id}/voice-over`, {
      responseType: "blob",
      timeout: 120_000,
    });
    const blob = res.data;
    const ct = (res.headers["content-type"] || "").toLowerCase();
    if (ct.includes("application/json")) {
      const text = await blob.text();
      const j = JSON.parse(text);
      throw new Error(j.message || "Download failed");
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fallback =
      (() => {
        const stored = String(task.voiceOverStoredName || "");
        const m = stored.match(/(\.[a-z0-9]+)$/i);
        return m ? `voice-over${m[1]}` : "voice-over";
      })();
    a.download = String(task.voiceOverOriginalName || fallback).replace(/[/\\]/g, "_");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    const er = e.response;
    if (er?.data instanceof Blob && String(er.headers?.["content-type"] || "").toLowerCase().includes("json")) {
      let j;
      try {
        j = JSON.parse(await er.data.text());
      } catch {
        throw new Error("Download failed");
      }
      throw new Error(j.message || "Download failed");
    }
    const msg = er?.data?.message;
    throw new Error(typeof msg === "string" ? msg : e.message || "Download failed");
  }
}

/**
 * @param {string} taskId
 * @param {File} file
 * @param {function(number): void} [onProgress]
 */
export async function uploadVoiceOverFile(taskId, file, onProgress) {
  const timeout = voiceOverUploadTimeoutMs(file.size);
  const fd = new FormData();
  fd.append("file", file);

  let lastError;
  for (let attempt = 0; attempt < UPLOAD_MAX_RETRIES; attempt += 1) {
    if (attempt > 0) {
      const delayMs = UPLOAD_RETRY_BASE_MS * 2 ** (attempt - 1);
      await sleep(delayMs);
    }

    try {
      await api.post(`/video-tasks/${taskId}/voice-over`, fd, {
        timeout,
        onUploadProgress: (progressEvent) => {
          if (!onProgress) return;
          const total = progressEvent.total || file.size;
          if (!total) return;
          const percent = Math.min(99, Math.round((progressEvent.loaded * 100) / total));
          onProgress(percent);
        },
      });
      return;
    } catch (e) {
      lastError = e;
      if (!isRetryableUploadError(e) || attempt >= UPLOAD_MAX_RETRIES - 1) {
        break;
      }
    }
  }

  throw new Error(uploadErrorMessage(lastError));
}
