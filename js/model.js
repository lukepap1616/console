// Works out what today looks like. No screen code here.

const ms = (s) => Date.parse(s);

export function sameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function viewState(rundown, now) {
  if (!rundown) return 'empty';
  return sameLocalDay(new Date(rundown.updated), now) ? 'fresh' : 'stale';
}

function dayBounds(now) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  return { start, end };
}

export function todaysEvents(events, now) {
  const { start, end } = dayBounds(now);
  return events
    .filter((e) => ms(e.start) < end && ms(e.end) > start)
    .sort((a, b) => (b.allDay - a.allDay) || (ms(a.start) - ms(b.start)));
}

export function isFinished(event, now) {
  return !event.allDay && ms(event.end) <= now.getTime();
}

export function startedBeforeToday(event, now) {
  return !event.allDay && ms(event.start) < dayBounds(now).start;
}

const minutesUntil = (time, now) => Math.ceil((time - now.getTime()) / 60000);

export function nextUp(events, now) {
  const next = events
    .filter((e) => !e.allDay && !isFinished(e, now))
    .sort((a, b) => ms(a.start) - ms(b.start))[0];
  if (!next) return null;

  const running = ms(next.start) <= now.getTime();
  return {
    title: next.title,
    phase: running ? 'now' : 'upcoming',
    minutes: minutesUntil(running ? ms(next.end) : ms(next.start), now),
  };
}

function duration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function countdownText(next) {
  return next.phase === 'now'
    ? `now, ends in ${duration(next.minutes)}`
    : `in ${duration(next.minutes)}`;
}

export function localDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Dates are compared as text so a time zone can never shift a due date.
export function isOverdue(task, now) {
  return task.when !== null && task.when < localDateKey(now);
}

export function sortTasks(tasks, now) {
  return [...tasks].sort((a, b) => {
    if (a.when === null) return b.when === null ? 0 : 1;
    if (b.when === null) return -1;
    return a.when.localeCompare(b.when);
  });
}

export function sortReminders(reminders, now) {
  return [...reminders].sort((a, b) => {
    if (a.due === null) return b.due === null ? 0 : 1;
    if (b.due === null) return -1;
    return ms(a.due) - ms(b.due);
  });
}
