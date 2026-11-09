// Deck „Verben“ – Kapitel 1: Verben & Konjugation (A2)
import { t } from '../i18n.js';

export const FORMS = [
  { id: 'inf', da: 'Infinitiv', tr: { de: 'Grundform', en: 'Infinitive' } },
  { id: 'nutid', da: 'Nutid', tr: { de: 'Präsens', en: 'Present' } },
  { id: 'datid', da: 'Datid', tr: { de: 'Präteritum', en: 'Past' } },
  { id: 'fornutid', da: 'Førnutid', tr: { de: 'Perfekt', en: 'Present perfect' } },
  { id: 'imperativ', da: 'Imperativ', tr: { de: 'Befehlsform', en: 'Imperative' } },
];

export const GROUPS = [
  {
    id: 'g1', color: 'yellow', sub: 'Regelmæssige (-ede)',
    name: { de: 'Gruppe 1', en: 'Group 1' },
    tip: {
      de: 'Regelmäßig: Datid = Stamm + -ede, Førnutid = har + Stamm + -et.',
      en: 'Regular: past = stem + -ede, present perfect = har + stem + -et.',
    },
  },
  {
    id: 'g2', color: 'blue', sub: 'Regelmæssige (-te)',
    name: { de: 'Gruppe 2', en: 'Group 2' },
    tip: {
      de: 'Regelmäßig: Datid = Stamm + -te, Førnutid = har + Stamm + -t.',
      en: 'Regular: past = stem + -te, present perfect = har + stem + -t.',
    },
  },
  {
    id: 'g3', color: 'red', sub: 'Uregelmæssige',
    name: { de: 'Gruppe 3', en: 'Group 3' },
    tip: {
      de: 'Unregelmäßig – auswendig lernen! Bewegungsverben (gå, komme) bilden Førnutid mit „er“.',
      en: 'Irregular – learn by heart! Verbs of motion (gå, komme) form the present perfect with “er”.',
    },
  },
  {
    id: 'modal', color: 'purple', sub: 'kunne · skulle · ville · måtte',
    name: { de: 'Modalverben', en: 'Modal verbs' },
    tip: {
      de: 'Modalverb: Nutid ohne -r (kan, skal, vil, må), Datid = Infinitiv ohne „at“, kein Imperativ.',
      en: 'Modal verb: present without -r (kan, skal, vil, må), past = infinitive without “at”, no imperative.',
    },
  },
];

const KEYS = FORMS.map((f) => f.id);

function v(group, labels, daForms, deForms, enForms) {
  const [de, en] = labels.split('|');
  const entry = { group, type: 'verb', tr: { de, en }, da: {}, trForms: { de: {}, en: {} } };
  const da = daForms.split('|');
  const dd = deForms.split('|');
  const ee = enForms.split('|');
  KEYS.forEach((k, i) => {
    if (da[i] !== undefined) {
      entry.da[k] = da[i];
      entry.trForms.de[k] = dd[i];
      entry.trForms.en[k] = ee[i];
    }
  });
  entry.id = entry.da.inf.replace(/^at /, '');
  return entry;
}

export const ENTRIES = [
  // Gruppe 1 – Regelmæssige (-ede)
  v('g1', 'tanzen|to dance', 'at danse|danser|dansede|har danset|dans', 'tanzen|ich tanze|ich tanzte|ich habe getanzt|tanz!', 'to dance|I dance|I danced|I have danced|dance!'),
  v('g1', 'spielen|to play', 'at spille|spiller|spillede|har spillet|spil', 'spielen|ich spiele|ich spielte|ich habe gespielt|spiel!', 'to play|I play|I played|I have played|play!'),
  v('g1', 'sprechen|to talk', 'at snakke|snakker|snakkede|har snakket|snak', 'sprechen|ich spreche|ich sprach|ich habe gesprochen|sprich!', 'to talk|I talk|I talked|I have talked|talk!'),
  v('g1', 'warten|to wait', 'at vente|venter|ventede|har ventet|vent', 'warten|ich warte|ich wartete|ich habe gewartet|warte!', 'to wait|I wait|I waited|I have waited|wait!'),
  v('g1', 'machen|to make', 'at lave|laver|lavede|har lavet|lav', 'machen|ich mache|ich machte|ich habe gemacht|mach!', 'to make|I make|I made|I have made|make!'),
  v('g1', 'arbeiten|to work', 'at arbejde|arbejder|arbejdede|har arbejdet|arbejd', 'arbeiten|ich arbeite|ich arbeitete|ich habe gearbeitet|arbeite!', 'to work|I work|I worked|I have worked|work!'),
  v('g1', 'umziehen|to move', 'at flytte|flytter|flyttede|har flyttet|flyt', 'umziehen|ich ziehe um|ich zog um|ich bin umgezogen|zieh um!', 'to move|I move|I moved|I have moved|move!'),
  v('g1', 'studieren|to study', 'at studere|studerer|studerede|har studeret|studer', 'studieren|ich studiere|ich studierte|ich habe studiert|studiere!', 'to study|I study|I studied|I have studied|study!'),
  v('g1', 'starten|to start', 'at starte|starter|startede|har startet|start', 'starten|ich starte|ich startete|ich habe gestartet|starte!', 'to start|I start|I started|I have started|start!'),
  v('g1', 'wohnen|to live', 'at bo|bor|boede|har boet|bo', 'wohnen|ich wohne|ich wohnte|ich habe gewohnt|wohn!', 'to live|I live|I lived|I have lived|live!'),

  // Gruppe 2 – Regelmæssige (-te)
  v('g2', 'lesen|to read', 'at læse|læser|læste|har læst|læs', 'lesen|ich lese|ich las|ich habe gelesen|lies!', 'to read|I read|I read|I have read|read!'),
  v('g2', 'hören|to hear', 'at høre|hører|hørte|har hørt|hør', 'hören|ich höre|ich hörte|ich habe gehört|hör!', 'to hear|I hear|I heard|I have heard|listen!'),
  v('g2', 'fahren|to drive', 'at køre|kører|kørte|har kørt|kør', 'fahren|ich fahre|ich fuhr|ich bin gefahren|fahr!', 'to drive|I drive|I drove|I have driven|drive!'),
  v('g2', 'kaufen|to buy', 'at købe|køber|købte|har købt|køb', 'kaufen|ich kaufe|ich kaufte|ich habe gekauft|kauf!', 'to buy|I buy|I bought|I have bought|buy!'),
  v('g2', 'besuchen|to visit', 'at besøge|besøger|besøgte|har besøgt|besøg', 'besuchen|ich besuche|ich besuchte|ich habe besucht|besuch!', 'to visit|I visit|I visited|I have visited|visit!'),
  v('g2', 'essen|to eat', 'at spise|spiser|spiste|har spist|spis', 'essen|ich esse|ich aß|ich habe gegessen|iss!', 'to eat|I eat|I ate|I have eaten|eat!'),
  v('g2', 'beginnen|to begin', 'at begynde|begynder|begyndte|har begyndt|begynd', 'beginnen|ich beginne|ich begann|ich habe begonnen|beginn!', 'to begin|I begin|I began|I have begun|begin!'),

  // Gruppe 3 – Uregelmæssige
  v('g3', 'gehen|to go', 'at gå|går|gik|er gået|gå', 'gehen|ich gehe|ich ging|ich bin gegangen|geh!', 'to go|I go|I went|I have gone|go!'),
  v('g3', 'machen/tun|to do', 'at gøre|gør|gjorde|har gjort|gør', 'tun|ich tue|ich tat|ich habe getan|tu!', 'to do|I do|I did|I have done|do!'),
  v('g3', 'bekommen|to get', 'at få|får|fik|har fået|få', 'bekommen|ich bekomme|ich bekam|ich habe bekommen|bekomm!', 'to get|I get|I got|I have got|get!'),
  v('g3', 'sagen|to say', 'at sige|siger|sagde|har sagt|sig', 'sagen|ich sage|ich sagte|ich habe gesagt|sag!', 'to say|I say|I said|I have said|say!'),
  v('g3', 'helfen|to help', 'at hjælpe|hjælper|hjalp|har hjulpet|hjælp', 'helfen|ich helfe|ich half|ich habe geholfen|hilf!', 'to help|I help|I helped|I have helped|help!'),
  v('g3', 'kommen|to come', 'at komme|kommer|kom|er kommet|kom', 'kommen|ich komme|ich kam|ich bin gekommen|komm!', 'to come|I come|I came|I have come|come!'),
  v('g3', 'nehmen|to take', 'at tage|tager|tog|har taget|tag', 'nehmen|ich nehme|ich nahm|ich habe genommen|nimm!', 'to take|I take|I took|I have taken|take!'),

  // Modalverber (kein Imperativ)
  v('modal', 'können|can', 'at kunne|kan|kunne|har kunnet', 'können|ich kann|ich konnte|ich habe gekonnt', 'to be able to|I can|I could|I have been able to'),
  v('modal', 'sollen/müssen|shall/must', 'at skulle|skal|skulle|har skullet', 'sollen|ich soll|ich sollte|ich habe gesollt', 'to have to|I shall|I should|I have had to'),
  v('modal', 'wollen|to want', 'at ville|vil|ville|har villet', 'wollen|ich will|ich wollte|ich habe gewollt', 'to want|I want to|I wanted to|I have wanted to'),
  v('modal', 'dürfen/müssen|may/must', 'at måtte|må|måtte|har måttet', 'dürfen|ich darf|ich durfte|ich habe gedurft', 'to be allowed to|I may|I was allowed to|I have been allowed to'),
];

// Beispielsätze aus dem Kapitel. [eckige Klammern] markieren die Verbform.
export const EXAMPLES = [
  { entries: ['arbejde', 'flytte'], da: 'Han [arbejdede] i et firma i Bogota, før han [flyttede] til Danmark.', tr: { de: 'Er arbeitete in einer Firma in Bogotá, bevor er nach Dänemark zog.', en: 'He worked for a company in Bogotá before he moved to Denmark.' } },
  { entries: ['studere', 'starte'], da: 'Katja [studerede] russisk i Bern, før hun [startede] på Roskilde Universitet.', tr: { de: 'Katja studierte Russisch in Bern, bevor sie an der Universität Roskilde anfing.', en: 'Katja studied Russian in Bern before she started at Roskilde University.' } },
  { entries: ['lave'], da: 'Hvad [lavede] du egentlig i Athen?', tr: { de: 'Was hast du eigentlich in Athen gemacht?', en: 'What did you actually do in Athens?' } },
  { entries: ['bo'], da: 'Hvor i Seattle [bor] du?', tr: { de: 'Wo in Seattle wohnst du?', en: 'Where in Seattle do you live?' } },
  { entries: ['spille', 'flytte'], da: 'Jeg [spillede] også fodbold, før jeg [flyttede] til Århus.', tr: { de: 'Ich spielte auch Fußball, bevor ich nach Aarhus zog.', en: 'I also played football before I moved to Aarhus.' } },
  { entries: ['købe'], da: 'Vi [købte] et hus i Haderslev sidste år på grund af min kones job.', tr: { de: 'Wir kauften letztes Jahr ein Haus in Haderslev wegen des Jobs meiner Frau.', en: "We bought a house in Haderslev last year because of my wife's job." } },
  { entries: ['besøge'], da: 'De [besøgte] deres familie i Prag sidste sommer.', tr: { de: 'Sie besuchten letzten Sommer ihre Familie in Prag.', en: 'They visited their family in Prague last summer.' } },
  { entries: ['spise'], da: 'Jim og hans kæreste [spiste] på en rigtig god restaurant i tirsdags.', tr: { de: 'Jim und seine Freundin aßen am Dienstag in einem richtig guten Restaurant.', en: 'Jim and his girlfriend ate at a really good restaurant on Tuesday.' } },
  { entries: ['studere', 'bo'], da: 'Pablo [studerede] medicin, da han [boede] i Buenos Aires.', tr: { de: 'Pablo studierte Medizin, als er in Buenos Aires wohnte.', en: 'Pablo studied medicine when he lived in Buenos Aires.' } },
  { entries: ['gå', 'flytte'], da: 'Tom [gik] på universitetet, før han [flyttede] til Danmark.', tr: { de: 'Tom ging zur Universität, bevor er nach Dänemark zog.', en: 'Tom went to university before he moved to Denmark.' } },
  { entries: ['få'], da: 'Han havde ikke noget job, før han [fik] et job i Nordisk Bank.', tr: { de: 'Er hatte keinen Job, bevor er einen Job bei der Nordisk Bank bekam.', en: 'He had no job before he got a job at Nordisk Bank.' } },
  { entries: ['ville'], da: 'Hun [ville] gerne prøve at bo i et andet land.', tr: { de: 'Sie wollte gerne versuchen, in einem anderen Land zu wohnen.', en: 'She wanted to try living in another country.' } },
  { entries: ['tage'], da: 'Emil [tog] altid metroen på arbejde i Stockholm.', tr: { de: 'Emil nahm in Stockholm immer die Metro zur Arbeit.', en: 'In Stockholm, Emil always took the metro to work.' } },
];

// ---------- Deck-spezifische Regeln ----------

const baseOf = (e) => e.da.inf.replace(/^at /, '');
const suffixStem = (e) => {
  const base = baseOf(e);
  return base.length > 2 && base.endsWith('e') ? base.slice(0, -1) : base;
};

/** Plausible, aber falsche Formen – nach der falschen Regel gebildet. */
function wrongForms(e, form) {
  const base = baseOf(e);
  const s = suffixStem(e);
  const correct = e.da[form];
  switch (form) {
    case 'inf': return [`at ${e.da.nutid}`, `at ${e.da.datid}`];
    case 'nutid': return [base, `${base}r`, `${s}er`, e.da.datid];
    case 'datid': return [`${s}ede`, `${s}te`, base, e.da.nutid];
    case 'fornutid': {
      const [aux, ...rest] = correct.split(' ');
      const part = rest.join(' ');
      const other = aux === 'har' ? 'er' : 'har';
      return [`${other} ${part}`, `${aux} ${s}et`, `${aux} ${s}t`, `${aux} ${e.da.datid}`];
    }
    case 'imperativ': return [base, e.da.nutid, `${s}e`];
    default: return [];
  }
}

/** Alle als richtig akzeptierten Schreibweisen. */
function accepted(e, form) {
  const a = [e.da[form]];
  if (form === 'inf') a.push(e.da.inf.replace(/^at /, ''));
  return a;
}

/** Eingabe vorbereiten: „jeg spiste“ → „spiste“. */
function clean(form, given) {
  return ['nutid', 'datid', 'fornutid'].includes(form) ? given.replace(/^jeg /, '') : given;
}

/** Gezielte Hinweise bei falschen Antworten. */
function hint(e, form, given, lang) {
  if (form === 'fornutid') {
    const [aux, ...rest] = e.da.fornutid.split(' ');
    const part = rest.join(' ');
    if (given === part) return t(lang, 'hint.auxMissing', { w: e.da.fornutid });
    if (given === `${aux === 'har' ? 'er' : 'har'} ${part}`) return t(lang, aux === 'er' ? 'hint.auxEr' : 'hint.auxHar');
  }
  return null;
}

/** Hinweis, wenn keine andere Form passt (nach dem generischen „andere Form“-Check). */
function fallbackHint(e, form, given, lang) {
  if (form !== 'datid' && form !== 'fornutid') return null;
  const s = suffixStem(e);
  if (e.group === 'g2' && given.endsWith(`${s}ede`)) return t(lang, 'hint.g2');
  if (e.group === 'g1' && given.endsWith(`${s}te`)) return t(lang, 'hint.g1');
  if (e.group === 'g3') return t(lang, 'hint.irregular');
  return null;
}

function blank(e, form) {
  if (form === 'inf') return 'at ___';
  if (form === 'imperativ') return '___ !';
  return 'jeg ___';
}

export const verbsDeck = {
  id: 'verbs',
  keyPrefix: '',            // leer → Lernstand aus Version 1 bleibt erhalten
  icon: '🔤',
  forms: FORMS,
  groups: GROUPS,
  entries: ENTRIES,
  examples: EXAMPLES,
  tableForms: ['nutid', 'datid', 'fornutid', 'imperativ'],
  headForm: 'inf',
  wrongForms,
  accepted,
  clean,
  hint,
  fallbackHint,
  blank,
};
