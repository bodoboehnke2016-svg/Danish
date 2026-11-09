// Deck „Vokabeln“ – Grundwortschatz A2 (Substantive mit en/et + Formen, Adjektive mit Endungen)
import { t } from '../i18n.js';

export const FORMS = [
  { id: 'base', da: 'Grundform', tr: { de: 'unbestimmt', en: 'indefinite' } },
  { id: 'def', da: 'Bestemt', tr: { de: 'bestimmt', en: 'definite' } },
  { id: 'plural', da: 'Flertal', tr: { de: 'Mehrzahl', en: 'plural' } },
  { id: 'adjT', da: 't-form', tr: { de: 'Adjektiv bei et-Wort', en: 'adjective with et-word' } },
  { id: 'adjE', da: 'e-form', tr: { de: 'Adjektiv: Mehrzahl/bestimmt', en: 'adjective: plural/definite' } },
];

export const GROUPS = [
  {
    id: 'family', color: 'pink', sub: 'Familie og mennesker',
    name: { de: 'Familie & Menschen', en: 'Family & people' },
    tip: {
      de: 'Viele Familienwörter haben eine unregelmäßige Mehrzahl: mor → mødre, bror → brødre, barn → børn.',
      en: 'Many family words have irregular plurals: mor → mødre, bror → brødre, barn → børn.',
    },
  },
  {
    id: 'home', color: 'orange', sub: 'Bolig',
    name: { de: 'Wohnen', en: 'Home' },
    tip: {
      de: 'Bestimmte Form = Endung: en-Wörter auf -en (stuen, døren), et-Wörter auf -et (huset, bordet).',
      en: 'Definite form = ending: en-words take -en (stuen, døren), et-words take -et (huset, bordet).',
    },
  },
  {
    id: 'food', color: 'green', sub: 'Mad og drikke',
    name: { de: 'Essen & Trinken', en: 'Food & drink' },
    tip: {
      de: 'Manche Wörter bleiben in der Mehrzahl gleich: et brød → brød, et glas → glas, en fisk → fisk, et æg → æg.',
      en: 'Some words do not change in the plural: et brød → brød, et glas → glas, en fisk → fisk, et æg → æg.',
    },
  },
  {
    id: 'work', color: 'blue', sub: 'Arbejde og studie',
    name: { de: 'Arbeit & Studium', en: 'Work & study' },
    tip: {
      de: 'Endet ein Wort auf -er (lærer, computer), hängt man in der Mehrzahl nur -e an: lærere, computere.',
      en: 'If a word ends in -er (lærer, computer), the plural just adds -e: lærere, computere.',
    },
  },
  {
    id: 'city', color: 'teal', sub: 'By og trafik',
    name: { de: 'Stadt & Verkehr', en: 'Town & transport' },
    tip: {
      de: 'Nach kurzem Vokal wird der Konsonant verdoppelt: bus → bussen, butik → butikken.',
      en: 'After a short vowel the consonant is doubled: bus → bussen, butik → butikken.',
    },
  },
  {
    id: 'time', color: 'indigo', sub: 'Tid',
    name: { de: 'Zeit', en: 'Time' },
    tip: {
      de: 'Zeitwörter stehen oft nach Zahlen: to timer, tre uger, fem år (år bleibt gleich!).',
      en: 'Time words often follow numbers: to timer, tre uger, fem år (år does not change!).',
    },
  },
  {
    id: 'adj', color: 'purple', sub: 'Adjektiver',
    name: { de: 'Adjektive', en: 'Adjectives' },
    tip: {
      de: 'Grundform bei en-Wörtern (en stor bil), -t bei et-Wörtern (et stort hus), -e in Mehrzahl & bestimmt (store huse). Ohne -t: Adjektive auf -sk (dansk) und z. B. glad.',
      en: 'Basic form with en-words (en stor bil), -t with et-words (et stort hus), -e in plural & definite (store huse). No -t: adjectives in -sk (dansk) and e.g. glad.',
    },
  },
];

/** Substantiv: 'en bil|bilen|biler', 'Auto|ein Auto|das Auto|Autos', 'car|a car|the car|cars' */
function n(group, daForms, deForms, enForms) {
  const [base, def, plural] = daForms.split('|');
  const [deLabel, ...dd] = deForms.split('|');
  const [enLabel, ...ee] = enForms.split('|');
  const [gender, ...stemParts] = base.split(' ');
  const stem = stemParts.join(' ');
  return {
    id: stem, group, type: 'noun', gender, stem,
    tr: { de: deLabel, en: enLabel },
    da: { base, def, plural },
    trForms: {
      de: { base: dd[0], def: dd[1], plural: dd[2] },
      en: { base: ee[0], def: ee[1], plural: ee[2] },
    },
  };
}

/** Adjektiv: 'stor|stort|store', 'groß', 'big' */
function a(daForms, de, en) {
  const [base, adjT, adjE] = daForms.split('|');
  const same = (w) => ({ base: w, adjT: w, adjE: w });
  return {
    id: base, group: 'adj', type: 'adj', stem: base,
    tr: { de, en },
    da: { base, adjT, adjE },
    trForms: { de: same(de), en: same(en) },
  };
}

export const ENTRIES = [
  // Familie & Menschen
  n('family', 'en mand|manden|mænd', 'Mann|ein Mann|der Mann|Männer', 'man|a man|the man|men'),
  n('family', 'en kvinde|kvinden|kvinder', 'Frau|eine Frau|die Frau|Frauen', 'woman|a woman|the woman|women'),
  n('family', 'et barn|barnet|børn', 'Kind|ein Kind|das Kind|Kinder', 'child|a child|the child|children'),
  n('family', 'en ven|vennen|venner', 'Freund|ein Freund|der Freund|Freunde', 'friend|a friend|the friend|friends'),
  n('family', 'en kæreste|kæresten|kærester', 'Partner(in)|ein(e) Partner(in)|der/die Partner(in)|Partner(innen)', 'partner|a partner|the partner|partners'),
  n('family', 'en familie|familien|familier', 'Familie|eine Familie|die Familie|Familien', 'family|a family|the family|families'),
  n('family', 'en bror|broren|brødre', 'Bruder|ein Bruder|der Bruder|Brüder', 'brother|a brother|the brother|brothers'),
  n('family', 'en søster|søsteren|søstre', 'Schwester|eine Schwester|die Schwester|Schwestern', 'sister|a sister|the sister|sisters'),
  n('family', 'en mor|moren|mødre', 'Mutter|eine Mutter|die Mutter|Mütter', 'mother|a mother|the mother|mothers'),
  n('family', 'en far|faren|fædre', 'Vater|ein Vater|der Vater|Väter', 'father|a father|the father|fathers'),

  // Wohnen
  n('home', 'et hus|huset|huse', 'Haus|ein Haus|das Haus|Häuser', 'house|a house|the house|houses'),
  n('home', 'en lejlighed|lejligheden|lejligheder', 'Wohnung|eine Wohnung|die Wohnung|Wohnungen', 'apartment|an apartment|the apartment|apartments'),
  n('home', 'et værelse|værelset|værelser', 'Zimmer|ein Zimmer|das Zimmer|Zimmer', 'room|a room|the room|rooms'),
  n('home', 'et køkken|køkkenet|køkkener', 'Küche|eine Küche|die Küche|Küchen', 'kitchen|a kitchen|the kitchen|kitchens'),
  n('home', 'en stue|stuen|stuer', 'Wohnzimmer|ein Wohnzimmer|das Wohnzimmer|Wohnzimmer', 'living room|a living room|the living room|living rooms'),
  n('home', 'et bord|bordet|borde', 'Tisch|ein Tisch|der Tisch|Tische', 'table|a table|the table|tables'),
  n('home', 'en stol|stolen|stole', 'Stuhl|ein Stuhl|der Stuhl|Stühle', 'chair|a chair|the chair|chairs'),
  n('home', 'en seng|sengen|senge', 'Bett|ein Bett|das Bett|Betten', 'bed|a bed|the bed|beds'),
  n('home', 'en dør|døren|døre', 'Tür|eine Tür|die Tür|Türen', 'door|a door|the door|doors'),
  n('home', 'et vindue|vinduet|vinduer', 'Fenster|ein Fenster|das Fenster|Fenster', 'window|a window|the window|windows'),

  // Essen & Trinken
  n('food', 'et æble|æblet|æbler', 'Apfel|ein Apfel|der Apfel|Äpfel', 'apple|an apple|the apple|apples'),
  n('food', 'et brød|brødet|brød', 'Brot|ein Brot|das Brot|Brote', 'bread|a loaf of bread|the bread|loaves of bread'),
  n('food', 'en kop|koppen|kopper', 'Tasse|eine Tasse|die Tasse|Tassen', 'cup|a cup|the cup|cups'),
  n('food', 'et glas|glasset|glas', 'Glas|ein Glas|das Glas|Gläser', 'glass|a glass|the glass|glasses'),
  n('food', 'en restaurant|restauranten|restauranter', 'Restaurant|ein Restaurant|das Restaurant|Restaurants', 'restaurant|a restaurant|the restaurant|restaurants'),
  n('food', 'en fisk|fisken|fisk', 'Fisch|ein Fisch|der Fisch|Fische', 'fish|a fish|the fish|fish'),
  n('food', 'et æg|ægget|æg', 'Ei|ein Ei|das Ei|Eier', 'egg|an egg|the egg|eggs'),
  n('food', 'en kartoffel|kartoflen|kartofler', 'Kartoffel|eine Kartoffel|die Kartoffel|Kartoffeln', 'potato|a potato|the potato|potatoes'),

  // Arbeit & Studium
  n('work', 'et job|jobbet|job', 'Job|ein Job|der Job|Jobs', 'job|a job|the job|jobs'),
  n('work', 'et firma|firmaet|firmaer', 'Firma|eine Firma|die Firma|Firmen', 'company|a company|the company|companies'),
  n('work', 'en bank|banken|banker', 'Bank|eine Bank|die Bank|Banken', 'bank|a bank|the bank|banks'),
  n('work', 'et universitet|universitetet|universiteter', 'Universität|eine Universität|die Universität|Universitäten', 'university|a university|the university|universities'),
  n('work', 'en lærer|læreren|lærere', 'Lehrer(in)|ein(e) Lehrer(in)|der/die Lehrer(in)|Lehrer(innen)', 'teacher|a teacher|the teacher|teachers'),
  n('work', 'en læge|lægen|læger', 'Arzt|ein Arzt|der Arzt|Ärzte', 'doctor|a doctor|the doctor|doctors'),
  n('work', 'en kollega|kollegaen|kollegaer', 'Kollege|ein Kollege|der Kollege|Kollegen', 'colleague|a colleague|the colleague|colleagues'),
  n('work', 'en computer|computeren|computere', 'Computer|ein Computer|der Computer|Computer', 'computer|a computer|the computer|computers'),
  n('work', 'en bog|bogen|bøger', 'Buch|ein Buch|das Buch|Bücher', 'book|a book|the book|books'),

  // Stadt & Verkehr
  n('city', 'en by|byen|byer', 'Stadt|eine Stadt|die Stadt|Städte', 'town|a town|the town|towns'),
  n('city', 'en bil|bilen|biler', 'Auto|ein Auto|das Auto|Autos', 'car|a car|the car|cars'),
  n('city', 'en cykel|cyklen|cykler', 'Fahrrad|ein Fahrrad|das Fahrrad|Fahrräder', 'bike|a bike|the bike|bikes'),
  n('city', 'et tog|toget|tog', 'Zug|ein Zug|der Zug|Züge', 'train|a train|the train|trains'),
  n('city', 'en bus|bussen|busser', 'Bus|ein Bus|der Bus|Busse', 'bus|a bus|the bus|buses'),
  n('city', 'en gade|gaden|gader', 'Straße|eine Straße|die Straße|Straßen', 'street|a street|the street|streets'),
  n('city', 'et land|landet|lande', 'Land|ein Land|das Land|Länder', 'country|a country|the country|countries'),
  n('city', 'en butik|butikken|butikker', 'Geschäft|ein Geschäft|das Geschäft|Geschäfte', 'shop|a shop|the shop|shops'),
  n('city', 'en station|stationen|stationer', 'Bahnhof|ein Bahnhof|der Bahnhof|Bahnhöfe', 'station|a station|the station|stations'),

  // Zeit
  n('time', 'en dag|dagen|dage', 'Tag|ein Tag|der Tag|Tage', 'day|a day|the day|days'),
  n('time', 'en uge|ugen|uger', 'Woche|eine Woche|die Woche|Wochen', 'week|a week|the week|weeks'),
  n('time', 'en måned|måneden|måneder', 'Monat|ein Monat|der Monat|Monate', 'month|a month|the month|months'),
  n('time', 'et år|året|år', 'Jahr|ein Jahr|das Jahr|Jahre', 'year|a year|the year|years'),
  n('time', 'en time|timen|timer', 'Stunde|eine Stunde|die Stunde|Stunden', 'hour|an hour|the hour|hours'),
  n('time', 'et minut|minuttet|minutter', 'Minute|eine Minute|die Minute|Minuten', 'minute|a minute|the minute|minutes'),
  n('time', 'en sommer|sommeren|somre', 'Sommer|ein Sommer|der Sommer|Sommer', 'summer|a summer|the summer|summers'),
  n('time', 'en vinter|vinteren|vintre', 'Winter|ein Winter|der Winter|Winter', 'winter|a winter|the winter|winters'),

  // Adjektive
  a('stor|stort|store', 'groß', 'big'),
  a('god|godt|gode', 'gut', 'good'),
  a('ny|nyt|nye', 'neu', 'new'),
  a('gammel|gammelt|gamle', 'alt', 'old'),
  a('dyr|dyrt|dyre', 'teuer', 'expensive'),
  a('billig|billigt|billige', 'billig', 'cheap'),
  a('dansk|dansk|danske', 'dänisch', 'Danish'),
  a('glad|glad|glade', 'froh', 'happy'),
  a('smuk|smukt|smukke', 'schön', 'beautiful'),
  a('varm|varmt|varme', 'warm', 'warm'),
  a('kold|koldt|kolde', 'kalt', 'cold'),
  a('lang|langt|lange', 'lang', 'long'),
];

// ---------- Deck-spezifische Regeln ----------

const otherGender = (g) => (g === 'en' ? 'et' : 'en');

function wrongForms(e, form) {
  const s = e.stem;
  if (e.type === 'adj') {
    switch (form) {
      case 'base': return [`${s}t`, `${s}e`];
      case 'adjT': return [`${s}e`, `${s}et`, s];
      case 'adjE': return [s, `${s}t`, `${s}er`];
      default: return [];
    }
  }
  const g = e.gender;
  switch (form) {
    case 'base': return [`${otherGender(g)} ${s}`, `${g} ${e.da.def}`, `${g} ${e.da.plural}`];
    case 'def': {
      const pl = e.da.plural;
      return [`${s}${otherGender(g)}`, pl.endsWith('e') ? `${pl}ne` : `${pl}ene`, e.da.base, `${s}${g}`];
    }
    case 'plural': return [`${s}e`, `${s}er`, s, e.da.def];
    default: return [];
  }
}

function accepted(e, form) {
  return [e.da[form]];
}

/** Eingabe vorbereiten: „to biler“ → „biler“; bei Adjektiven „et stort“ → „stort“. */
function clean(form, given, e) {
  if (e?.type === 'noun' && form === 'plural') return given.replace(/^(to|de) /, '');
  if (e?.type === 'adj') return given.replace(/^(en|et|de|den|det) /, '');
  return given;
}

function hint(e, form, given, lang) {
  if (e.type !== 'noun') return null;
  if (form === 'base') {
    if (given === e.stem) return t(lang, 'hint.articleMissing', { w: e.da.base });
    if (given === `${otherGender(e.gender)} ${e.stem}`) return t(lang, 'hint.wrongGender', { g: e.gender, w: e.da.base });
  }
  if (form === 'def' && given === `${e.stem}${otherGender(e.gender)}`) {
    return t(lang, 'hint.wrongGender', { g: e.gender, w: e.da.def });
  }
  return null;
}

function blank(e, form) {
  if (e.type === 'adj') return { base: 'en ___ …', adjT: 'et ___ …', adjE: 'de ___ …' }[form];
  return { base: 'en/et ___', def: '___', plural: 'to ___' }[form];
}

export const vocabDeck = {
  id: 'vocab',
  keyPrefix: 'vocab/',
  icon: '📚',
  forms: FORMS,
  groups: GROUPS,
  entries: ENTRIES,
  examples: [],
  tableForms: ['def', 'plural', 'adjT', 'adjE'],
  headForm: 'base',
  wrongForms,
  accepted,
  clean,
  hint,
  fallbackHint: () => null,
  blank,
};
