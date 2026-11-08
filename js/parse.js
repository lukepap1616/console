// Reads the plain text a Shortcut sends after the # in the link.

const LIMIT = 30;

function readEncoded(hash, prefix) {
  if (!hash.startsWith(prefix)) return { kind: 'none' };
  try {
    return { kind: 'text', text: decodeURIComponent(hash.slice(prefix.length)) };
  } catch {
    return { kind: 'bad' };
  }
}

export function readFragment(hash) {
  return readEncoded(hash, '#d=');
}

export function readSaid(hash) {
  return readEncoded(hash, '#s=');
}

// Splits on the first `count` separators only, so the last field may contain |.
function splitFields(rest, count) {
  const fields = [];
  let remaining = rest;
  for (let i = 0; i < count; i++) {
    const at = remaining.indexOf('|');
    if (at === -1) return null;
    fields.push(remaining.slice(0, at));
    remaining = remaining.slice(at + 1);
  }
  fields.push(remaining);
  return fields;
}

const validDate = (s) => !Number.isNaN(Date.parse(s));

function readEvent(rest) {
  const f = splitFields(rest, 3);
  if (!f) return null;
  const [start, end, allDay, title] = f;
  if (!validDate(start) || !validDate(end) || !title) return null;
  return { start, end, allDay: /^(true|yes|1)$/i.test(allDay), title };
}

function readReminder(rest) {
  const f = splitFields(rest, 1);
  if (!f) return null;
  const [due, title] = f;
  if (!title || (due && !validDate(due))) return null;
  return { due: due || null, title };
}

function readTask(rest) {
  const f = splitFields(rest, 1);
  if (!f) return null;
  const [when, title] = f;
  if (!title || (when && !/^\d{4}-\d{2}-\d{2}$/.test(when))) return null;
  return { when: when || null, title };
}

function readWeather(rest) {
  const f = splitFields(rest, 1);
  if (!f) return null;
  return { condition: f[0], temp: f[1] };
}

export function parsePayload(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== 'v1') return null;

  const rundown = { updated: null, weather: null, events: [], reminders: [], tasks: [], away: null };

  for (const line of lines.slice(1)) {
    const at = line.indexOf('|');
    if (at === -1) continue;
    const type = line.slice(0, at);
    const rest = line.slice(at + 1);

    if (type === 'updated' && validDate(rest)) {
      rundown.updated = rest;
    } else if (type === 'weather') {
      rundown.weather = readWeather(rest) ?? rundown.weather;
    } else if (type === 'event' && rundown.events.length < LIMIT) {
      const event = readEvent(rest);
      if (event) rundown.events.push(event);
    } else if (type === 'reminder' && rundown.reminders.length < LIMIT) {
      const reminder = readReminder(rest);
      if (reminder) rundown.reminders.push(reminder);
    } else if (type === 'task' && rundown.tasks.length < LIMIT) {
      const task = readTask(rest);
      if (task) rundown.tasks.push(task);
    } else if (type === 'away' && rest.trim()) {
      rundown.away = rest;
    }
  }

  return rundown.updated ? rundown : null;
}

export function parseSaid(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== 'said1') return null;

  const valueOf = (prefix) => lines.find((l) => l.startsWith(prefix))?.slice(prefix.length);
  const at = valueOf('at|');
  const you = valueOf('you|');
  const answerLine = lines.findIndex((l) => l.startsWith('jarvis|'));

  if (!at || !validDate(at) || you === undefined || answerLine === -1) return null;

  // The answer is everything from jarvis| to the end, including new lines.
  const jarvis = lines.slice(answerLine).join('\n').slice('jarvis|'.length);
  return { at, you, jarvis };
}
