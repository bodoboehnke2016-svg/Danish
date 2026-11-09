// Fortschritt & Einstellungen in localStorage (fehlertolerant, z. B. im privaten Modus).
import { GROUPS, TENSES } from './data.js';

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

export const DEFAULT_SETTINGS = {
  groups: GROUPS.map((g) => g.id),
  tenses: TENSES.map((t) => t.id),
  count: 10,
  autoSpeak: false,
};

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };
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

export function resetProgress() {
  write(PROGRESS_KEY, {});
}
