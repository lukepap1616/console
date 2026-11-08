// Draws the console. Text from calendars, tasks and email only ever goes in as
// text nodes, so nothing in a title can run on this page.

import {
  viewState, todaysEvents, nextUp, countdownText, isFinished,
  sortReminders, sortTasks, isOverdue, localDateKey, startedBeforeToday,
} from './model.js';
import { QUOTES, pickForDay } from './quotes.js';

const LAUNCH_PAD = [
  ['Claude', 'https://claude.ai/code'],
  ['Gmail', 'https://mail.google.com'],
  ['Fiverr', 'https://www.fiverr.com'],
  ['Obsidian', 'obsidian://open'],
  ['GitHub', 'https://github.com'],
  ['Win The Day', 'https://win-the-day-founder.netlify.app'],
];

function h(tag, className, ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  for (const child of children) {
    if (child === null || child === undefined) continue;
    el.append(child);
  }
  return el;
}

function formatTime(date) {
  const hours = date.getHours() % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const shortDay = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const shortDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function panel(title, scrollKey, ...children) {
  const body = h('div', 'panel-body', ...children);
  body.dataset.scroll = scrollKey;
  return h('section', 'panel', h('h2', 'label', title), body);
}

function statusFor(state, unreadable) {
  if (unreadable) return ['ATTENTION', 'warn'];
  if (state === 'fresh') return ['ONLINE', 'live'];
  return state === 'stale' ? ['WAITING', 'idle'] : ['STANDBY', 'idle'];
}

function header(state, rundown, unreadable) {
  const [text, tone] = statusFor(state, unreadable);
  return h('header', 'top',
    h('div', 'brand',
      h('span', `light ${tone}`),
      h('h1', 'title', 'JARVIS'),
      h('span', 'label', text)),
    h('div', 'top-right',
      unreadable ? h('span', 'warn-text', 'Last update could not be read') : null,
      state === 'fresh' ? h('span', 'muted', `Updated ${formatTime(new Date(rundown.updated))}`) : null));
}

function nextUpPanel(events, now) {
  const next = nextUp(events, now);
  if (!next) return null;
  return h('section', 'next',
    h('h2', 'label', 'Next up'),
    h('p', 'next-title', next.title),
    h('p', 'accent', countdownText(next)));
}

function leftColumn(now, state, rundown, events) {
  const quote = pickForDay(QUOTES, localDateKey(now));
  const fresh = state === 'fresh';
  return h('div', 'col col-left',
    h('div', 'clock', formatTime(now)),
    h('p', 'date', formatDate(now)),
    fresh && rundown.weather
      ? h('p', 'weather', `${rundown.weather.condition}  ${rundown.weather.temp}`)
      : null,
    fresh ? nextUpPanel(events, now) : null,
    h('blockquote', 'quote', quote.text, h('cite', '', quote.author)));
}

function eventRow(event, now) {
  let when = formatTime(new Date(event.start));
  if (event.allDay) when = 'All day';
  else if (startedBeforeToday(event, now)) when = 'Ongoing';
  return h('li', isFinished(event, now) ? 'row done' : 'row',
    h('span', 'when', when), h('span', 'what', event.title));
}

function list(items, emptyText, toRow) {
  if (items.length === 0) return h('p', 'muted', emptyText);
  return h('ul', 'rows', ...items.map(toRow));
}

function reminderLabel(reminder, now) {
  if (reminder.due === null) return '';
  const due = new Date(reminder.due);
  if (localDateKey(due) === localDateKey(now)) return formatTime(due);
  return due < now ? 'Overdue' : shortDate(due);
}

function reminderRow(reminder, now) {
  const label = reminderLabel(reminder, now);
  return h('li', 'row',
    h('span', label === 'Overdue' ? 'when accent' : 'when', label),
    h('span', 'what', reminder.title));
}

function taskRow(task, now) {
  const overdue = isOverdue(task, now);
  let label = '';
  if (overdue) label = 'Overdue';
  else if (task.when) label = shortDate(new Date(`${task.when}T12:00:00`));
  return h('li', 'row',
    h('span', overdue ? 'when accent' : 'when', label),
    h('span', 'what', task.title));
}

function placeholder(state, rundown) {
  if (state === 'empty') {
    return [panel('Today', 'today', h('p', 'lead', 'Say Jarvis rundown to begin'))];
  }
  const last = new Date(rundown.updated);
  return [panel('Today', 'today',
    h('p', 'lead', 'No rundown yet today'),
    h('p', 'muted', `Last one: ${shortDay(last)} ${formatTime(last)}`))];
}

function jarvisPanel(said) {
  if (!said) {
    return panel('Jarvis', 'jarvis', h('p', 'muted', 'Say Jarvis listen to ask anything'));
  }
  return panel('Jarvis', 'jarvis',
    h('p', 'muted', said.you),
    h('p', 'answer', said.jarvis));
}

function launchPad() {
  const links = LAUNCH_PAD.map(([name, url]) => {
    const link = h('a', 'launch', name);
    link.href = url;
    if (url.startsWith('https:')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    return link;
  });
  return h('nav', 'pad', ...links);
}

// The screen is rebuilt each minute, so lists keep their scroll position.
function scrollPositions(root) {
  const positions = new Map();
  for (const el of root.querySelectorAll('[data-scroll]')) {
    positions.set(el.dataset.scroll, el.scrollTop);
  }
  return positions;
}

function restoreScroll(root, positions) {
  for (const el of root.querySelectorAll('[data-scroll]')) {
    el.scrollTop = positions.get(el.dataset.scroll) ?? 0;
  }
}

export function render(root, { now, rundown, said, unreadable }) {
  const state = viewState(rundown, now);
  const fresh = state === 'fresh';
  const events = fresh ? todaysEvents(rundown.events, now) : [];

  const middle = fresh
    ? [
      panel('Today', 'today', list(events, 'Nothing scheduled', (e) => eventRow(e, now))),
      panel('Reminders', 'reminders', list(sortReminders(rundown.reminders, now), 'No open reminders', (r) => reminderRow(r, now))),
    ]
    : placeholder(state, rundown);

  const right = [
    fresh ? panel('While you were away', 'away', h('p', 'answer', rundown.away ?? 'No summary in this rundown')) : null,
    fresh ? panel('Work', 'work', list(sortTasks(rundown.tasks ?? [], now), 'No open work tasks', (t) => taskRow(t, now))) : null,
    jarvisPanel(said),
  ];

  const positions = scrollPositions(root);
  root.replaceChildren(
    header(state, rundown, unreadable),
    h('div', 'grid',
      leftColumn(now, state, rundown, events),
      h('div', 'col', ...middle),
      h('div', 'col', ...right)),
    launchPad());
  restoreScroll(root, positions);
}
