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

/** Mon–Sat; Sunday rolls forward to Monday. */
export function advanceToWorkingDay(date) {
  const d = new Date(date);
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** Today's tab date — skips Sunday when today is Sunday. */
export function getTodayTabDateKey() {
  return toDateKey(advanceToWorkingDay(new Date()));
}

/** Tomorrow's tab date — next working day after today's tab date. */
export function getTomorrowTabDateKey() {
  const todayTab = advanceToWorkingDay(new Date());
  const next = new Date(todayTab);
  next.setDate(next.getDate() + 1);
  return toDateKey(advanceToWorkingDay(next));
}

export function formatScheduleTabLabel(dateKey) {
  const calendarToday = toDateKey(new Date());
  const calendarTomorrow = getTomorrowDateKey();
  const todayTabKey = getTodayTabDateKey();
  const tomorrowTabKey = getTomorrowTabDateKey();

  if (dateKey === todayTabKey && dateKey === calendarToday) return "Today's";
  if (dateKey === tomorrowTabKey && dateKey === calendarTomorrow) return "Tomorrow's";

  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
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
