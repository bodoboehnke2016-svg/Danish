// Aussprache über die Web Speech API (iOS: z. B. Stimme „Sara“, da-DK).
//
// iOS-Besonderheiten, die hier abgefangen werden:
// - speechSynthesis.cancel() direkt vor speak() verwirft die neue Ausgabe → kurze Pause dazwischen.
// - Utterance-Objekte können vorzeitig vom Garbage Collector entfernt werden → Referenz halten.
// - Nach App-Wechsel bleibt die Synthese manchmal „pausiert“ hängen → resume().
// - Stimmen werden asynchron geladen (voiceschanged) und manchmal erst nach erneutem Abfragen.
// - Die erste Ausgabe muss in einer Nutzer-Geste passieren → unlock() beim ersten Tippen.

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined);

let voices = [];
let preferredURI = '';
let rate = 0.9;
let current = null;       // Referenz auf die laufende Utterance (GC-Schutz)
let unlocked = false;
const listeners = new Set();

export const canSpeak = () => !!synth() && typeof window.SpeechSynthesisUtterance === 'function';

const isDanish = (v) => /^da([-_]|$)/i.test(v.lang || '');

let signature = '';
function loadVoices() {
  if (!canSpeak()) return;
  const all = synth().getVoices() || [];
  voices = all.filter(isDanish);
  const sig = voices.map((v) => v.voiceURI).join('|');
  if (sig !== signature) {          // nur bei Änderung benachrichtigen
    signature = sig;
    listeners.forEach((fn) => fn(voices));
  }
}

if (canSpeak()) {
  loadVoices();
  synth().addEventListener?.('voiceschanged', loadVoices);
  // iOS meldet voiceschanged nicht immer zuverlässig → einige Male nachfragen
  let tries = 0;
  const poll = setInterval(() => {
    loadVoices();
    if (voices.length || ++tries > 10) clearInterval(poll);
  }, 500);
  // Nach Rückkehr in die App hängende Synthese lösen
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      synth().cancel();
      loadVoices();
    }
  });
  // Erste Nutzer-Geste schaltet die Sprachausgabe frei (stummes Utterance)
  const unlockOnce = (e) => {
    if (e.target?.closest?.('[data-action="speak"], [data-action="speech-test"]')) return;
    unlock();
  };
  document.addEventListener('touchend', unlockOnce, { capture: true, passive: true });
  document.addEventListener('click', unlockOnce, { capture: true });
}

export function onVoices(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const danishVoices = () => voices.slice();

export function configure({ voiceURI, speechRate } = {}) {
  if (voiceURI !== undefined) preferredURI = voiceURI || '';
  if (speechRate) rate = speechRate;
}

/** Beste dänische Stimme: gewählte → „Sara“ (erweitert vor kompakt) → da-DK → erste dänische. */
export function pickVoice() {
  if (!voices.length) return null;
  return (
    voices.find((v) => v.voiceURI === preferredURI)
    || voices.find((v) => /sara/i.test(v.name) && /enhanced|premium|erweitert/i.test(v.name + v.voiceURI))
    || voices.find((v) => /sara/i.test(v.name))
    || voices.find((v) => /da[-_]DK/i.test(v.lang) && v.localService)
    || voices.find((v) => /da[-_]DK/i.test(v.lang))
    || voices[0]
  );
}

function unlock() {
  if (unlocked || !canSpeak()) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.lang = 'da-DK';
    synth().speak(u);
  } catch { /* ignorieren */ }
}

/**
 * Spricht einen dänischen Text.
 * @param {string} text
 * @param {{onstart?: Function, onend?: Function, onfail?: Function}} cb
 *   onfail(reason) wird gerufen, wenn die Ausgabe nicht startet ('unsupported' | 'timeout' | Fehlercode).
 */
export function speak(text, cb = {}) {
  if (!text) return;
  if (!canSpeak()) {
    cb.onfail?.('unsupported');
    return;
  }
  unlocked = true;
  const s = synth();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'da-DK';
  if (!voices.length) loadVoices();
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = 1;
  u.volume = 1;

  let started = false;
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    if (current === u) current = null;
    cb.onend?.();
  };
  u.onstart = () => {
    started = true;
    cb.onstart?.();
  };
  u.onend = done;
  u.onerror = (e) => {
    const reason = e?.error || 'error';
    // „interrupted“/„canceled“ entstehen, wenn eine neue Ausgabe die alte ablöst – kein Fehler
    if (!started && reason !== 'interrupted' && reason !== 'canceled') cb.onfail?.(reason);
    done();
  };
  current = u;

  // Watchdog: startet die Ausgabe nicht, Nutzer informieren statt still zu scheitern
  const watchdog = setTimeout(() => {
    if (!started && !finished) {
      cb.onfail?.('timeout');
      done();
    }
  }, 3500);

  const go = () => {
    if (s.paused) s.resume();
    s.speak(u);
    // iOS: manchmal bleibt die Warteschlange pausiert
    setTimeout(() => s.paused && s.resume(), 100);
  };

  if (s.speaking || s.pending) {
    s.cancel();
    setTimeout(go, 120); // nicht direkt nach cancel() sprechen (iOS verwirft sonst die Ausgabe)
  } else {
    go();
  }
}
