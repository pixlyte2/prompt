export function toDateKey(d) {
  if (!d || d === "null" || d === "undefined") return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function hasScript(task) {
  return Boolean(String(task?.script ?? "").trim());
}

export function getTomorrowDateKey() {
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  return toDateKey(tmrw);
}

export function filterTomorrowScriptsReady(tasks) {
  const tomorrowKey = getTomorrowDateKey();
  return (Array.isArray(tasks) ? tasks : []).filter(
    (t) => t.scheduledDate && toDateKey(t.scheduledDate) === tomorrowKey && hasScript(t),
  );
}

export function countTomorrowScriptsReady(tasks) {
  return filterTomorrowScriptsReady(tasks).length;
}
