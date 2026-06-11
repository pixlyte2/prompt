export const VIDEO_LENGTH_MAP = {
  "40s": "40 seconds",
  "2min": "2 minutes",
  "3min": "3 minutes",
  "5min": "5 minutes",
};

export const VIDEO_AI_MODAL_LENGTH_KEY = "VIDEO_AI_MODAL_LENGTH";
export const VIDEO_AI_MODAL_PROMPT_KEY = "VIDEO_AI_MODAL_PROMPT_ID";

export function readStoredVideoLength(defaultLength = "40s") {
  try {
    const stored = localStorage.getItem(VIDEO_AI_MODAL_LENGTH_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(VIDEO_LENGTH_MAP, stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return defaultLength;
}

export function saveStoredVideoLength(value) {
  try {
    if (value && Object.prototype.hasOwnProperty.call(VIDEO_LENGTH_MAP, value)) {
      localStorage.setItem(VIDEO_AI_MODAL_LENGTH_KEY, value);
    }
  } catch {
    /* ignore */
  }
}

export function readStoredPromptId(validIds = []) {
  try {
    const stored = localStorage.getItem(VIDEO_AI_MODAL_PROMPT_KEY);
    if (!stored) return "";
    if (validIds.includes(stored)) return stored;
    localStorage.removeItem(VIDEO_AI_MODAL_PROMPT_KEY);
  } catch {
    /* ignore */
  }
  return "";
}

export function saveStoredPromptId(id) {
  try {
    if (id) localStorage.setItem(VIDEO_AI_MODAL_PROMPT_KEY, id);
    else localStorage.removeItem(VIDEO_AI_MODAL_PROMPT_KEY);
  } catch {
    /* ignore */
  }
}

export function buildFinalizedPrompt(prompt, sourceText, videoLength = "40s") {
  if (!prompt?.promptText) return "";
  return prompt.promptText
    .replace(/\[SOURCE\]/g, sourceText || "[SOURCE]")
    .replace(/\[LENGTH\]/g, VIDEO_LENGTH_MAP[videoLength] || videoLength);
}

export function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function extractYouTubeVideoId(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const directMatch = /^[a-zA-Z0-9_-]{11}$/.test(trimmed);
  if (directMatch) return trimmed;
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}
