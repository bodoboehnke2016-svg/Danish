// Fortschritt & Einstellungen in localStorage (fehlertolerant, z. B. im privaten Modus).
import { DECKS } from './decks/index.js';
import { detectLang, isLang } from './i18n.js';

const PROGRESS_KEY = 'dansk-verber:progress:v1';
const SETTINGS_KEY = 'dansk-verber:settings:v1';
const memory = {};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return memory[key] ?? fallback;
  }
}

function write(key, value) {
  memory[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher nicht verfügbar – im Arbeitsspeicher behalten */
  }
}

const deckDefaults = (deck) => ({ groups: deck.groups.map((g) => g.id), forms: deck.forms.map((f) => f.id) });

export function defaultSettings() {
  return {
    lang: detectLang(),
    area: 'verbs',
    count: 10,
    autoSpeak: false,
    decks: Object.fromEntries(DECKS.map((d) => [d.id, deckDefaults(d)])),
  };
}

export function loadSettings() {
  const saved = read(SETTINGS_KEY, {});
  const s = defaultSettings();
  if (isLang(saved.lang)) s.lang = saved.lang;
  if (DECKS.some((d) => d.id === saved.area)) s.area = saved.area;
  if (saved.count) s.count = saved.count;
  if (typeof saved.autoSpeak === 'boolean') s.autoSpeak = saved.autoSpeak;
  // Migration aus Version 1 (nur Verben, Felder groups/tenses auf oberster Ebene)
  if (Array.isArray(saved.groups) || Array.isArray(saved.tenses)) {
    s.decks.verbs = { groups: saved.groups ?? s.decks.verbs.groups, forms: saved.tenses ?? s.decks.verbs.forms };
  }
  for (const d of DECKS) {
    const sd = saved.decks?.[d.id];
    if (sd) s.decks[d.id] = { ...s.decks[d.id], ...sd };
  }
  return s;
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, settings);
}

export function loadProgress() {
  return read(PROGRESS_KEY, {});
}

export function saveProgress(progress) {
  write(PROGRESS_KEY, progress);
}

/** Löscht den Lernstand eines Decks (Schlüssel mit dessen Präfix). */
export function resetDeckProgress(progress, deck) {
  const others = DECKS.filter((d) => d !== deck && d.keyPrefix);
  for (const key of Object.keys(progress)) {
    const belongs = deck.keyPrefix
      ? key.startsWith(deck.keyPrefix)
      : !others.some((d) => key.startsWith(d.keyPrefix));
    if (belongs) delete progress[key];
  }
  saveProgress(progress);
}
