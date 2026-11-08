import { resolveStartup, loadRundown, loadSaid } from './store.js';
import { render } from './render.js';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const root = document.getElementById('console');
const storage = getStorage();
let state = { rundown: null, said: null, unreadable: false };

function draw() {
  render(root, { now: new Date(), ...state });
}

function readLink() {
  const result = resolveStartup(location.hash, storage);
  state = { rundown: result.rundown, said: result.said, unreadable: result.unreadable };
  if (result.clearHash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  draw();
}

// Another tab saved something newer, usually the tab a new rundown just opened.
function readSaved() {
  state = { rundown: loadRundown(storage), said: loadSaid(storage), unreadable: false };
  draw();
}

readLink();

window.addEventListener('hashchange', readLink);
window.addEventListener('storage', readSaved);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) readSaved();
});
// iPad Safari can suspend background tabs and miss the storage event.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') readSaved();
});

let lastMinute = Math.floor(Date.now() / 60000);
setInterval(() => {
  const minute = Math.floor(Date.now() / 60000);
  if (minute !== lastMinute) {
    lastMinute = minute;
    draw();
  }
}, 1000);
