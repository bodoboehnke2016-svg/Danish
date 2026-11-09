// Reine Quiz-Logik ohne DOM – deterministisch testbar über einen injizierbaren rng.
import { VERBS, VERB_BY_ID, TENSES, TENSE_BY_ID } from './data.js';

export const MAX_BOX = 5;

export const itemKey = (item) => `${item.verbId}:${item.tense}`;

/** Alle (Verb × Zeitform)-Items, gefiltert nach Gruppen und Zeitformen. */
export function allItems({ groups, tenses } = {}) {
  const items = [];
  for (const verb of VERBS) {
    if (groups && !groups.includes(verb.group)) continue;
    for (const t of TENSES) {
      if (tenses && !tenses.includes(t.id)) continue;
      if (verb.da[t.id] === undefined) continue;
      items.push({ verbId: verb.id, tense: t.id });
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
export function pickItems(items, count, progress = {}, rng = Math.random) {
  if (!items.length) return [];
  const result = [];
  let pool = items.slice();
  while (result.length < count) {
    if (!pool.length) pool = items.slice();
    const weights = pool.map((it) => MAX_BOX + 1 - (progress[itemKey(it)]?.box ?? 0));
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

export function updateProgress(progress, item, correct) {
  const key = itemKey(item);
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

// ---------- Hilfsfunktionen ----------

const baseOf = (verb) => verb.da.inf.replace(/^at /, '');
const suffixStem = (verb) => {
  const base = baseOf(verb);
  return base.length > 2 && base.endsWith('e') ? base.slice(0, -1) : base;
};
const deWords = (verb) => new Set(verb.de.split('/'));
const sharesGerman = (a, b) => [...deWords(a)].some((w) => deWords(b).has(w));

/** Alle (Verb, Zeitform)-Paare, deren dänische Form exakt `form` ist. */
export function itemsWithForm(form) {
  const out = [];
  for (const verb of VERBS) {
    for (const [tense, f] of Object.entries(verb.da)) {
      if (f === form) out.push({ verbId: verb.id, tense });
    }
  }
  return out;
}

/** Plausible, aber falsche Formen – nach der falschen Regel gebildet. */
export function wrongForms(verb, tense) {
  const base = baseOf(verb);
  const s = suffixStem(verb);
  const correct = verb.da[tense];
  let cands = [];
  switch (tense) {
    case 'inf':
      cands = [`at ${verb.da.nutid}`, `at ${verb.da.datid}`];
      break;
    case 'nutid':
      cands = [base, `${base}r`, `${s}er`, verb.da.datid];
      break;
    case 'datid':
      cands = [`${s}ede`, `${s}te`, base, verb.da.nutid];
      break;
    case 'fornutid': {
      const [aux, ...rest] = correct.split(' ');
      const part = rest.join(' ');
      const other = aux === 'har' ? 'er' : 'har';
      cands = [`${other} ${part}`, `${aux} ${s}et`, `${aux} ${s}t`, `${aux} ${verb.da.datid}`];
      break;
    }
    case 'imperativ':
      cands = [base, verb.da.nutid, `${s}e`];
      break;
  }
  return [...new Set(cands)].filter((c) => c && c !== correct);
}

// ---------- Fragen ----------

const optionDe = (verb, tense) => ({
  label: `${verb.de} · ${TENSE_BY_ID[tense].da}`,
  sub: tense === 'inf' ? TENSE_BY_ID[tense].de : `${TENSE_BY_ID[tense].de}: ${verb.deForms[tense]}`,
});

/**
 * Baut eine Frage für eine Stufe.
 * level 1: dänische Form → deutsche Option wählen
 * level 2: deutsch + Zeitform → dänische Form wählen
 * level 3: deutsch + Zeitform → dänische Form tippen
 */
export function buildQuestion(item, level, rng = Math.random) {
  const verb = VERB_BY_ID[item.verbId];
  const tense = item.tense;
  const answer = verb.da[tense];
  const q = { item, level, verb, tense, answer };

  if (level === 1) {
    const sameForm = itemsWithForm(answer);
    const isSame = (vId, t) => sameForm.some((x) => x.verbId === vId && x.tense === t);

    const sameVerb = shuffle(
      Object.keys(verb.da).filter((t) => t !== tense && !isSame(verb.id, t)),
      rng,
    ).map((t) => ({ verb, tense: t }));

    const otherVerbs = shuffle(
      VERBS.filter(
        (o) => o.id !== verb.id && o.da[tense] !== undefined && !sharesGerman(o, verb) && !isSame(o.id, tense),
      ),
      rng,
    ).map((o) => ({ verb: o, tense }));

    const nSame = Math.min(sameVerb.length, 1 + Math.floor(rng() * 2)); // 1–2 aus gleichem Verb
    const distractors = [...sameVerb.slice(0, nSame), ...otherVerbs].slice(0, 3);

    const correctOpts = [{ verb, tense }];
    q.options = shuffle(
      [
        ...correctOpts.map((o) => ({ ...optionDe(o.verb, o.tense), correct: true })),
        ...distractors.map((o) => ({ ...optionDe(o.verb, o.tense), correct: false })),
      ],
      rng,
    );
    q.alsoCorrect = sameForm.filter((x) => !(x.verbId === verb.id && x.tense === tense));
    return q;
  }

  if (level === 2) {
    const wrong = shuffle(wrongForms(verb, tense), rng);
    const others = shuffle(
      Object.entries(verb.da)
        .filter(([t, f]) => t !== tense && f !== answer)
        .map(([, f]) => f),
      rng,
    );
    const fallback = shuffle(
      VERBS.filter((o) => o.id !== verb.id && o.da[tense] !== undefined).map((o) => o.da[tense]),
      rng,
    );
    const picked = [];
    const add = (f) => {
      if (f && f !== answer && !picked.includes(f) && picked.length < 3) picked.push(f);
    };
    wrong.slice(0, 2).forEach(add);
    others.forEach(add);
    wrong.forEach(add);
    fallback.forEach(add);
    q.options = shuffle(
      [{ label: answer, correct: true }, ...picked.map((f) => ({ label: f, correct: false }))],
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

/**
 * Prüft eine getippte Antwort.
 * @returns {{correct: boolean, hint?: string}}
 */
export function checkTyped(input, verb, tense) {
  const expected = verb.da[tense];
  let given = normalize(input);
  if (['nutid', 'datid', 'fornutid'].includes(tense)) given = given.replace(/^jeg /, '');

  const accepted = [expected];
  if (tense === 'inf') accepted.push(expected.replace(/^at /, ''));

  if (accepted.includes(given)) return { correct: true };

  if (accepted.some((a) => toAscii(a) === toAscii(given))) {
    return { correct: true, hint: `Richtig! Schreibweise mit Sonderzeichen: „${expected}“` };
  }

  if (!given) return { correct: false };

  if (tense === 'fornutid') {
    const [aux, ...rest] = expected.split(' ');
    const part = rest.join(' ');
    if (given === part) return { correct: false, hint: `Fast! Das Hilfsverb fehlt: „${aux} ${part}“` };
    const other = aux === 'har' ? 'er' : 'har';
    if (given === `${other} ${part}`) {
      return {
        correct: false,
        hint: aux === 'er'
          ? `Fast! Bewegungsverb → Hilfsverb „er“, nicht „har“.`
          : `Fast! Hilfsverb ist „har“, nicht „er“.`,
      };
    }
  }

  for (const [t, f] of Object.entries(verb.da)) {
    if (t !== tense && (f === given || f.replace(/^at /, '') === given)) {
      return { correct: false, hint: `Das ist die Form für ${TENSE_BY_ID[t].da} (${TENSE_BY_ID[t].de}).` };
    }
  }

  if (tense === 'datid' || tense === 'fornutid') {
    const s = suffixStem(verb);
    if (verb.group === 'g2' && given.endsWith(`${s}ede`)) return { correct: false, hint: 'Gruppe 2 → Datid auf -te, nicht -ede.' };
    if (verb.group === 'g1' && given.endsWith(`${s}te`)) return { correct: false, hint: 'Gruppe 1 → Datid auf -ede, nicht -te.' };
    if (verb.group === 'g3') return { correct: false, hint: 'Unregelmäßiges Verb – die Form muss man auswendig lernen.' };
  }

  return { correct: false };
}

/** Prompt-Text („jeg ___“) für Stufe 2 und 3. */
export function blankFor(tense) {
  switch (tense) {
    case 'inf': return 'at ___';
    case 'imperativ': return '___ !';
    default: return 'jeg ___';
  }
}
