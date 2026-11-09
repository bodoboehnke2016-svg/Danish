// Generische Quiz-Logik ohne DOM – funktioniert für jedes Deck (Verben, Vokabeln, …).
// Deterministisch testbar über einen injizierbaren rng.
import { t, tr } from './i18n.js';

export const MAX_BOX = 5;

/** Item = Eintrag × Form, z. B. { entryId: 'spise', form: 'datid' }. */
export const itemKey = (deck, item) => `${deck.keyPrefix}${item.entryId}:${item.form}`;

export function allItems(deck, { groups, forms } = {}) {
  const items = [];
  for (const entry of deck.entries) {
    if (groups && !groups.includes(entry.group)) continue;
    for (const f of deck.forms) {
      if (forms && !forms.includes(f.id)) continue;
      if (entry.da[f.id] === undefined) continue;
      items.push({ entryId: entry.id, form: f.id });
    }
  }
  return items;
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Gewichtete Auswahl: schwache Items (niedrige Box) kommen häufiger dran. */
export function pickItems(deck, items, count, progress = {}, rng = Math.random) {
  if (!items.length) return [];
  const result = [];
  let pool = items.slice();
  while (result.length < count) {
    if (!pool.length) pool = items.slice();
    const weights = pool.map((it) => MAX_BOX + 1 - (progress[itemKey(deck, it)]?.box ?? 0));
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rng() * total;
    let idx = 0;
    while (idx < pool.length - 1 && r >= weights[idx]) {
      r -= weights[idx];
      idx++;
    }
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export function updateProgress(deck, progress, item, correct) {
  const key = itemKey(deck, item);
  const entry = progress[key] ?? { box: 0, seen: 0, correct: 0 };
  entry.seen += 1;
  if (correct) {
    entry.correct += 1;
    entry.box = Math.min(MAX_BOX, entry.box + 1);
  } else {
    entry.box = 0;
  }
  progress[key] = entry;
  return entry;
}

// ---------- Fragen ----------

const labelWords = (entry, lang) => new Set(tr(entry.tr, lang).split('/'));
const sharesLabel = (a, b, lang) => [...labelWords(a, lang)].some((w) => labelWords(b, lang).has(w));

/** Alle (Eintrag, Form)-Paare eines Decks mit exakt dieser dänischen Form. */
export function itemsWithForm(deck, text) {
  const out = [];
  for (const entry of deck.entries) {
    for (const [form, f] of Object.entries(entry.da)) {
      if (f === text) out.push({ entryId: entry.id, form });
    }
  }
  return out;
}

/** Name einer Form in der Oberfläche, z. B. „Datid (Präteritum)“. */
export const formName = (deck, formId, lang) => {
  const f = deck.formById[formId];
  return `${f.da} (${tr(f.tr, lang)})`;
};

export function optionText(deck, entry, formId, lang) {
  const f = deck.formById[formId];
  const label = tr(entry.tr, lang);
  const translated = entry.trForms[lang]?.[formId] ?? entry.trForms.de[formId];
  return {
    label: `${label} · ${f.da}`,
    sub: translated === label ? tr(f.tr, lang) : `${tr(f.tr, lang)}: ${translated}`,
  };
}

/**
 * Baut eine Frage.
 * level 1: dänische Form → Option in Ausgangssprache wählen
 * level 2: Ausgangssprache + Form → dänische Form wählen
 * level 3: Ausgangssprache + Form → dänische Form tippen
 */
export function buildQuestion(deck, item, level, lang = 'de', rng = Math.random) {
  const entry = deck.entryById[item.entryId];
  const form = item.form;
  const answer = entry.da[form];
  const q = { item, level, entry, form, answer };

  if (level === 1) {
    const sameForm = itemsWithForm(deck, answer);
    const isSame = (id, f) => sameForm.some((x) => x.entryId === id && x.form === f);

    const sameEntry = shuffle(
      Object.keys(entry.da).filter((f) => f !== form && !isSame(entry.id, f)),
      rng,
    ).map((f) => ({ entry, form: f }));

    const others = shuffle(
      deck.entries.filter(
        (o) => o.id !== entry.id && o.da[form] !== undefined && !sharesLabel(o, entry, lang) && !isSame(o.id, form),
      ),
      rng,
    ).map((o) => ({ entry: o, form }));

    const nSame = Math.min(sameEntry.length, 1 + Math.floor(rng() * 2)); // 1–2 aus gleichem Eintrag
    const distractors = [...sameEntry.slice(0, nSame), ...others, ...sameEntry.slice(nSame)].slice(0, 3);

    q.options = shuffle(
      [
        { ...optionText(deck, entry, form, lang), correct: true },
        ...distractors.map((o) => ({ ...optionText(deck, o.entry, o.form, lang), correct: false })),
      ],
      rng,
    );
    q.alsoCorrect = sameForm.filter((x) => !(x.entryId === entry.id && x.form === form));
    return q;
  }

  if (level === 2) {
    const wrong = shuffle(deck.wrongForms(entry, form), rng);
    const otherForms = shuffle(
      Object.entries(entry.da).filter(([f, s]) => f !== form && s !== answer).map(([, s]) => s),
      rng,
    );
    const fallback = shuffle(
      deck.entries.filter((o) => o.id !== entry.id && o.da[form] !== undefined).map((o) => o.da[form]),
      rng,
    );
    const picked = [];
    const add = (s) => {
      if (s && s !== answer && !picked.includes(s) && picked.length < 3) picked.push(s);
    };
    wrong.slice(0, 2).forEach(add);
    otherForms.forEach(add);
    wrong.forEach(add);
    fallback.forEach(add);
    q.options = shuffle(
      [{ label: answer, correct: true }, ...picked.map((s) => ({ label: s, correct: false }))],
      rng,
    );
    return q;
  }

  return q; // level 3: freie Eingabe
}

// ---------- Antwortprüfung (Stufe 3) ----------

export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ /g, ' ')
    .replace(/[!.?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const toAscii = (s) => s.replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa');

/** @returns {{correct: boolean, hint?: string}} */
export function checkTyped(deck, input, entry, form, lang = 'de') {
  const given = deck.clean(form, normalize(input), entry);
  const accepted = deck.accepted(entry, form);

  if (accepted.includes(given)) return { correct: true };
  if (accepted.some((a) => toAscii(a) === toAscii(given))) {
    return { correct: true, hint: t(lang, 'hint.ascii', { w: entry.da[form] }) };
  }
  if (!given) return { correct: false };

  const special = deck.hint(entry, form, given, lang);
  if (special) return { correct: false, hint: special };

  for (const [f, s] of Object.entries(entry.da)) {
    if (f !== form && (s === given || s.replace(/^at /, '') === given)) {
      return { correct: false, hint: t(lang, 'hint.otherForm', { form: formName(deck, f, lang) }) };
    }
  }

  const fb = deck.fallbackHint(entry, form, given, lang);
  return fb ? { correct: false, hint: fb } : { correct: false };
}
