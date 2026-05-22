import api, { httpClient } from "../services/api";

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
  try {
    const fd = new FormData();
    fd.append("file", file);
    await api.post(`/video-tasks/${taskId}/voice-over`, fd, {
      timeout: 120_000,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  } catch (e) {
    const msg = e.response?.data?.message;
    throw new Error(typeof msg === "string" ? msg : e.message || "Upload failed");
  }
}
