import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERBS, VERB_BY_ID } from '../js/data.js';
import {
  allItems, pickItems, buildQuestion, checkTyped, wrongForms, updateProgress, itemKey,
} from '../js/quiz.js';

// deterministischer Zufall
function seeded(seed = 42) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

test('Datenbasis: 28 Verben, 136 Items', () => {
  assert.equal(VERBS.length, 28);
  assert.equal(allItems().length, 28 * 5 - 4);
  assert.equal(VERB_BY_ID['gå'].da.fornutid, 'er gået');
  assert.equal(VERB_BY_ID['kunne'].da.imperativ, undefined);
});

test('Filter nach Gruppe und Zeitform', () => {
  const items = allItems({ groups: ['modal'], tenses: ['imperativ'] });
  assert.equal(items.length, 0);
  assert.equal(allItems({ groups: ['g2'], tenses: ['datid'] }).length, 7);
});

test('pickItems liefert gewünschte Anzahl ohne Duplikate pro Durchlauf', () => {
  const items = allItems({ groups: ['g1'] });
  const picked = pickItems(items, 10, {}, seeded());
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked.map(itemKey)).size, 10);
  // mehr Fragen als Items → wiederholt
  assert.equal(pickItems(items.slice(0, 3), 7, {}, seeded()).length, 7);
});

test('Stufe 1 & 2: genau eine richtige Option, 4 eindeutige Optionen', () => {
  const rng = seeded(7);
  for (const item of allItems()) {
    for (const level of [1, 2]) {
      const q = buildQuestion(item, level, rng);
      assert.equal(q.options.length, 4, `${itemKey(item)} L${level}`);
      assert.equal(q.options.filter((o) => o.correct).length, 1);
      assert.equal(new Set(q.options.map((o) => o.label)).size, 4, `${itemKey(item)} L${level} doppelt`);
    }
  }
});

test('Stufe 1: mehrdeutige Form (kom = Datid & Imperativ) nie als Distraktor', () => {
  for (let i = 0; i < 30; i++) {
    const q = buildQuestion({ verbId: 'komme', tense: 'datid' }, 1, seeded(i));
    assert.ok(!q.options.some((o) => !o.correct && o.label === 'kommen · Imperativ'));
    assert.equal(q.alsoCorrect.length, 1);
  }
});

test('Stufe 2: richtige Antwort nie als falsche Option', () => {
  const rng = seeded(3);
  for (const item of allItems()) {
    const q = buildQuestion(item, 2, rng);
    const answer = VERB_BY_ID[item.verbId].da[item.tense];
    assert.ok(q.options.filter((o) => o.label === answer).every((o) => o.correct));
  }
});

test('Fehlformen nach falscher Regel', () => {
  assert.ok(wrongForms(VERB_BY_ID.spise, 'datid').includes('spisede'));
  assert.ok(wrongForms(VERB_BY_ID.danse, 'datid').includes('danste'));
  assert.ok(wrongForms(VERB_BY_ID.spise, 'fornutid').includes('er spist'));
  assert.ok(wrongForms(VERB_BY_ID['gå'], 'fornutid').includes('har gået'));
});

test('checkTyped: tolerant bei Schreibweise', () => {
  const spise = VERB_BY_ID.spise;
  assert.equal(checkTyped(' Spiste ', spise, 'datid').correct, true);
  assert.equal(checkTyped('jeg spiste', spise, 'datid').correct, true);
  assert.equal(checkTyped('spise', spise, 'inf').correct, true);
  assert.equal(checkTyped('at spise', spise, 'inf').correct, true);
  assert.equal(checkTyped('spis!', spise, 'imperativ').correct, true);
  const r = checkTyped('laeste', VERB_BY_ID['læse'], 'datid');
  assert.equal(r.correct, true);
  assert.match(r.hint, /læste/);
  assert.equal(checkTyped('boede', VERB_BY_ID.bo, 'datid').correct, true);
});

test('checkTyped: gezielte Hinweise', () => {
  assert.match(checkTyped('spist', VERB_BY_ID.spise, 'fornutid').hint, /Hilfsverb fehlt/);
  assert.match(checkTyped('har gået', VERB_BY_ID['gå'], 'fornutid').hint, /er/);
  assert.match(checkTyped('spiser', VERB_BY_ID.spise, 'datid').hint, /Nutid/);
  assert.match(checkTyped('spisede', VERB_BY_ID.spise, 'datid').hint, /-te/);
  assert.match(checkTyped('danste', VERB_BY_ID.danse, 'datid').hint, /-ede/);
  assert.equal(checkTyped('xyz', VERB_BY_ID.spise, 'datid').correct, false);
});

test('updateProgress: Box steigt bei richtig, fällt auf 0 bei falsch', () => {
  const p = {};
  const it = { verbId: 'spise', tense: 'datid' };
  updateProgress(p, it, true);
  updateProgress(p, it, true);
  assert.equal(p['spise:datid'].box, 2);
  updateProgress(p, it, false);
  assert.equal(p['spise:datid'].box, 0);
  assert.equal(p['spise:datid'].seen, 3);
});
