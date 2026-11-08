// Saves the latest rundown on the iPad and decides what to draw at startup.

import { readFragment, parsePayload, readSaid, parseSaid } from './parse.js';

const RUNDOWN_KEY = 'jarvis-console-rundown';
const SAID_KEY = 'jarvis-console-said';

function loadJson(storage, key) {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(key));
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function saveJson(storage, key, value) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked. The screen still draws from the link.
  }
}

export function loadRundown(storage) {
  return loadJson(storage, RUNDOWN_KEY);
}

export function saveRundown(rundown, storage) {
  saveJson(storage, RUNDOWN_KEY, rundown);
}

export function loadSaid(storage) {
  return loadJson(storage, SAID_KEY);
}

export function saveSaid(said, storage) {
  saveJson(storage, SAID_KEY, said);
}

const isOlder = (a, b) => Date.parse(a.updated) < Date.parse(b.updated);
const isOlderSaid = (a, b) => Date.parse(a.at) < Date.parse(b.at);

export function resolveStartup(hash, storage) {
  const saved = loadRundown(storage);
  const savedSaid = loadSaid(storage);

  const saidLink = readSaid(hash);
  if (saidLink.kind !== 'none') {
    const incoming = saidLink.kind === 'text' ? parseSaid(saidLink.text) : null;
    if (!incoming) {
      return { rundown: saved, said: savedSaid, unreadable: true, clearHash: true };
    }
    if (savedSaid && isOlderSaid(incoming, savedSaid)) {
      return { rundown: saved, said: savedSaid, unreadable: false, clearHash: true };
    }
    saveSaid(incoming, storage);
    return { rundown: saved, said: incoming, unreadable: false, clearHash: true };
  }

  const fragment = readFragment(hash);
  if (fragment.kind === 'none') {
    return { rundown: saved, said: savedSaid, unreadable: false, clearHash: false };
  }

  const incoming = fragment.kind === 'text' ? parsePayload(fragment.text) : null;
  if (!incoming) {
    return { rundown: saved, said: savedSaid, unreadable: true, clearHash: true };
  }

  if (saved && isOlder(incoming, saved)) {
    return { rundown: saved, said: savedSaid, unreadable: false, clearHash: true };
  }

  saveRundown(incoming, storage);
  return { rundown: incoming, said: savedSaid, unreadable: false, clearHash: true };
}
