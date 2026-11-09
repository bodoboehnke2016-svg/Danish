// Registry aller Lernbereiche. Neuer Bereich = neues Deck-Modul mit derselben Schnittstelle.
import { verbsDeck } from './verbs.js';
import { vocabDeck } from './vocab.js';

export const DECKS = [verbsDeck, vocabDeck];

for (const deck of DECKS) {
  deck.formById = Object.fromEntries(deck.forms.map((f) => [f.id, f]));
  deck.groupById = Object.fromEntries(deck.groups.map((g) => [g.id, g]));
  deck.entryById = Object.fromEntries(deck.entries.map((e) => [e.id, e]));
}

export const DECK_BY_ID = Object.fromEntries(DECKS.map((d) => [d.id, d]));
export { verbsDeck, vocabDeck };
