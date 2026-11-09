import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DECKS, verbsDeck as V, vocabDeck as W } from '../js/decks/index.js';
import { LANGUAGES, _strings, t } from '../js/i18n.js';
import {
  allItems, pickItems, buildQuestion, checkTyped, updateProgress, itemKey,
} from '../js/quiz.js';

function seeded(seed = 42) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
const E = (deck, id) => deck.entryById[id];

test('Datenbasis Verben: 28 Verben, 136 Items', () => {
  assert.equal(V.entries.length, 28);
  assert.equal(allItems(V).length, 28 * 5 - 4);
  assert.equal(E(V, 'gå').da.fornutid, 'er gået');
  assert.equal(E(V, 'kunne').da.imperativ, undefined);
});

test('Datenbasis Vokabeln: eindeutige IDs, Substantive mit en/et', () => {
  assert.ok(W.entries.length >= 60);
  assert.equal(new Set(W.entries.map((e) => e.id)).size, W.entries.length);
  for (const e of W.entries.filter((x) => x.type === 'noun')) {
    assert.match(e.da.base, /^(en|et) /, e.id);
    assert.equal(Object.keys(e.da).length, 3);
  }
});

test('Jede Sprache hat alle UI-Texte und alle Übersetzungen in den Decks', () => {
  const keys = Object.keys(_strings.de);
  for (const l of LANGUAGES) {
    for (const k of keys) assert.ok(_strings[l.id][k], `${l.id}: ${k}`);
    for (const d of DECKS) {
      for (const f of d.forms) assert.ok(f.tr[l.id], `${d.id} form ${f.id}`);
      for (const g of d.groups) assert.ok(g.name[l.id] && g.tip[l.id], `${d.id} group ${g.id}`);
      for (const e of d.entries) {
        assert.ok(e.tr[l.id], `${d.id} ${e.id}`);
        for (const f of Object.keys(e.da)) assert.ok(e.trForms[l.id][f], `${d.id} ${e.id} ${f} ${l.id}`);
      }
      for (const ex of d.examples) assert.ok(ex.tr[l.id]);
    }
  }
  assert.equal(t('en', 'check'), 'Check');
  assert.equal(t('de', 'itemsSelected', { n: 3 }), '3 Formen ausgewählt');
});

test('Filter nach Gruppe und Form', () => {
  assert.equal(allItems(V, { groups: ['modal'], forms: ['imperativ'] }).length, 0);
  assert.equal(allItems(V, { groups: ['g2'], forms: ['datid'] }).length, 7);
  assert.equal(allItems(W, { groups: ['adj'], forms: ['plural'] }).length, 0);
});

test('Lernstand-Schlüssel getrennt pro Bereich (Verben kompatibel zu v1)', () => {
  assert.equal(itemKey(V, { entryId: 'spise', form: 'datid' }), 'spise:datid');
  assert.equal(itemKey(W, { entryId: 'bil', form: 'def' }), 'vocab/bil:def');
});

test('pickItems liefert gewünschte Anzahl ohne Duplikate pro Durchlauf', () => {
  const items = allItems(V, { groups: ['g1'] });
  const picked = pickItems(V, items, 10, {}, seeded());
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked.map((i) => itemKey(V, i))).size, 10);
  assert.equal(pickItems(V, items.slice(0, 3), 7, {}, seeded()).length, 7);
});

test('Stufe 1 & 2: in allen Decks und Sprachen genau eine richtige von 4 eindeutigen Optionen', () => {
  const rng = seeded(7);
  for (const d of DECKS) {
    for (const l of LANGUAGES) {
      for (const item of allItems(d)) {
        for (const level of [1, 2]) {
          const q = buildQuestion(d, item, level, l.id, rng);
          const tag = `${d.id} ${l.id} ${itemKey(d, item)} L${level}`;
          assert.equal(q.options.length, 4, tag);
          assert.equal(q.options.filter((o) => o.correct).length, 1, tag);
          assert.equal(new Set(q.options.map((o) => o.label)).size, 4, `${tag} doppelt`);
          if (level === 2) assert.ok(q.options.filter((o) => o.label === q.answer).every((o) => o.correct), tag);
        }
      }
    }
  }
});

test('Stufe 1: mehrdeutige Form nie als Distraktor (kom, dansk)', () => {
  for (let i = 0; i < 30; i++) {
    const q = buildQuestion(V, { entryId: 'komme', form: 'datid' }, 1, 'de', seeded(i));
    assert.ok(!q.options.some((o) => !o.correct && o.label === 'kommen · Imperativ'));
    const q2 = buildQuestion(W, { entryId: 'dansk', form: 'base' }, 1, 'en', seeded(i));
    assert.ok(!q2.options.some((o) => !o.correct && o.label === 'Danish · t-form'));
  }
});

test('Englische Optionen', () => {
  const q = buildQuestion(V, { entryId: 'spise', form: 'datid' }, 1, 'en', seeded(1));
  const right = q.options.find((o) => o.correct);
  assert.equal(right.label, 'to eat · Datid');
  assert.equal(right.sub, 'Past: I ate');
});

test('Fehlformen nach falscher Regel', () => {
  assert.ok(V.wrongForms(E(V, 'spise'), 'datid').includes('spisede'));
  assert.ok(V.wrongForms(E(V, 'spise'), 'fornutid').includes('er spist'));
  assert.ok(V.wrongForms(E(V, 'gå'), 'fornutid').includes('har gået'));
  assert.ok(W.wrongForms(E(W, 'hus'), 'base').includes('en hus'));
  assert.ok(W.wrongForms(E(W, 'hus'), 'def').includes('husen'));
  assert.ok(W.wrongForms(E(W, 'stor'), 'adjT').includes('store'));
});

test('checkTyped Verben: tolerant + Hinweise in beiden Sprachen', () => {
  const spise = E(V, 'spise');
  assert.equal(checkTyped(V, ' Spiste ', spise, 'datid').correct, true);
  assert.equal(checkTyped(V, 'jeg spiste', spise, 'datid').correct, true);
  assert.equal(checkTyped(V, 'spise', spise, 'inf').correct, true);
  assert.equal(checkTyped(V, 'spis!', spise, 'imperativ').correct, true);
  assert.match(checkTyped(V, 'laeste', E(V, 'læse'), 'datid').hint, /læste/);
  assert.equal(checkTyped(V, 'boede', E(V, 'bo'), 'datid').correct, true);
  assert.match(checkTyped(V, 'spist', spise, 'fornutid').hint, /Hilfsverb fehlt/);
  assert.match(checkTyped(V, 'spist', spise, 'fornutid', 'en').hint, /auxiliary/);
  assert.match(checkTyped(V, 'har gået', E(V, 'gå'), 'fornutid').hint, /er/);
  assert.match(checkTyped(V, 'spiser', spise, 'datid').hint, /Nutid/);
  assert.match(checkTyped(V, 'spisede', spise, 'datid').hint, /-te/);
  assert.match(checkTyped(V, 'danste', E(V, 'danse'), 'datid', 'en').hint, /-ede/);
  assert.equal(checkTyped(V, 'xyz', spise, 'datid').correct, false);
});

test('checkTyped Vokabeln: Artikel, Geschlecht, Mehrzahl, Adjektive', () => {
  const bil = E(W, 'bil');
  assert.equal(checkTyped(W, 'en bil', bil, 'base').correct, true);
  assert.match(checkTyped(W, 'bil', bil, 'base').hint, /Artikel fehlt/);
  assert.match(checkTyped(W, 'et bil', bil, 'base').hint, /en-Wort/);
  assert.match(checkTyped(W, 'huset', E(W, 'hus'), 'base').hint ?? '', /Bestemt|bestimmt/);
  assert.match(checkTyped(W, 'husen', E(W, 'hus'), 'def', 'en').hint, /et-word/);
  assert.equal(checkTyped(W, 'to biler', bil, 'plural').correct, true);
  assert.equal(checkTyped(W, 'boern', E(W, 'barn'), 'plural').correct, true);
  assert.equal(checkTyped(W, 'et stort', E(W, 'stor'), 'adjT').correct, true);
  assert.equal(checkTyped(W, 'stor', E(W, 'stor'), 'adjT').correct, false);
});

test('updateProgress: Box steigt bei richtig, fällt auf 0 bei falsch', () => {
  const p = {};
  const it = { entryId: 'bil', form: 'def' };
  updateProgress(W, p, it, true);
  updateProgress(W, p, it, true);
  assert.equal(p['vocab/bil:def'].box, 2);
  updateProgress(W, p, it, false);
  assert.equal(p['vocab/bil:def'].box, 0);
  assert.equal(p['vocab/bil:def'].seen, 3);
});
