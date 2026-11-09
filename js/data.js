// Datengrundlage: Kapitel 1 – Verben & Konjugation (A2)

export const TENSES = [
  { id: 'inf', da: 'Infinitiv', de: 'Grundform' },
  { id: 'nutid', da: 'Nutid', de: 'Präsens' },
  { id: 'datid', da: 'Datid', de: 'Präteritum' },
  { id: 'fornutid', da: 'Førnutid', de: 'Perfekt' },
  { id: 'imperativ', da: 'Imperativ', de: 'Befehlsform' },
];

export const TENSE_BY_ID = Object.fromEntries(TENSES.map((t) => [t.id, t]));

export const GROUPS = [
  {
    id: 'g1',
    name: 'Gruppe 1',
    sub: 'Regelmæssige (-ede)',
    color: 'yellow',
    rule: 'Regelmäßig: Datid = Stamm + -ede, Førnutid = har + Stamm + -et.',
  },
  {
    id: 'g2',
    name: 'Gruppe 2',
    sub: 'Regelmæssige (-te)',
    color: 'blue',
    rule: 'Regelmäßig: Datid = Stamm + -te, Førnutid = har + Stamm + -t.',
  },
  {
    id: 'g3',
    name: 'Gruppe 3',
    sub: 'Uregelmæssige',
    color: 'red',
    rule: 'Unregelmäßig – auswendig lernen! Bewegungsverben (gå, komme) bilden Førnutid mit „er“.',
  },
  {
    id: 'modal',
    name: 'Modalverber',
    sub: 'kunne · skulle · ville · måtte',
    color: 'purple',
    rule: 'Modalverb: Nutid ohne -r (kan, skal, vil, må), Datid = Infinitiv ohne „at“, kein Imperativ.',
  },
];

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

const KEYS = ['inf', 'nutid', 'datid', 'fornutid', 'imperativ'];

function v(group, de, daForms, deForms) {
  const da = daForms.split('|');
  const dd = deForms.split('|');
  const verb = { group, de, da: {}, deForms: {} };
  KEYS.forEach((k, i) => {
    if (da[i] !== undefined) verb.da[k] = da[i];
    if (dd[i] !== undefined) verb.deForms[k] = dd[i];
  });
  verb.id = verb.da.inf.replace(/^at /, '');
  return verb;
}

export const VERBS = [
  // Gruppe 1 – Regelmæssige (-ede)
  v('g1', 'tanzen', 'at danse|danser|dansede|har danset|dans', 'tanzen|ich tanze|ich tanzte|ich habe getanzt|tanz!'),
  v('g1', 'spielen', 'at spille|spiller|spillede|har spillet|spil', 'spielen|ich spiele|ich spielte|ich habe gespielt|spiel!'),
  v('g1', 'sprechen', 'at snakke|snakker|snakkede|har snakket|snak', 'sprechen|ich spreche|ich sprach|ich habe gesprochen|sprich!'),
  v('g1', 'warten', 'at vente|venter|ventede|har ventet|vent', 'warten|ich warte|ich wartete|ich habe gewartet|warte!'),
  v('g1', 'machen', 'at lave|laver|lavede|har lavet|lav', 'machen|ich mache|ich machte|ich habe gemacht|mach!'),
  v('g1', 'arbeiten', 'at arbejde|arbejder|arbejdede|har arbejdet|arbejd', 'arbeiten|ich arbeite|ich arbeitete|ich habe gearbeitet|arbeite!'),
  v('g1', 'umziehen', 'at flytte|flytter|flyttede|har flyttet|flyt', 'umziehen|ich ziehe um|ich zog um|ich bin umgezogen|zieh um!'),
  v('g1', 'studieren', 'at studere|studerer|studerede|har studeret|studer', 'studieren|ich studiere|ich studierte|ich habe studiert|studiere!'),
  v('g1', 'starten', 'at starte|starter|startede|har startet|start', 'starten|ich starte|ich startete|ich habe gestartet|starte!'),
  v('g1', 'wohnen', 'at bo|bor|boede|har boet|bo', 'wohnen|ich wohne|ich wohnte|ich habe gewohnt|wohn!'),

  // Gruppe 2 – Regelmæssige (-te)
  v('g2', 'lesen', 'at læse|læser|læste|har læst|læs', 'lesen|ich lese|ich las|ich habe gelesen|lies!'),
  v('g2', 'hören', 'at høre|hører|hørte|har hørt|hør', 'hören|ich höre|ich hörte|ich habe gehört|hör!'),
  v('g2', 'fahren', 'at køre|kører|kørte|har kørt|kør', 'fahren|ich fahre|ich fuhr|ich bin gefahren|fahr!'),
  v('g2', 'kaufen', 'at købe|køber|købte|har købt|køb', 'kaufen|ich kaufe|ich kaufte|ich habe gekauft|kauf!'),
  v('g2', 'besuchen', 'at besøge|besøger|besøgte|har besøgt|besøg', 'besuchen|ich besuche|ich besuchte|ich habe besucht|besuch!'),
  v('g2', 'essen', 'at spise|spiser|spiste|har spist|spis', 'essen|ich esse|ich aß|ich habe gegessen|iss!'),
  v('g2', 'beginnen', 'at begynde|begynder|begyndte|har begyndt|begynd', 'beginnen|ich beginne|ich begann|ich habe begonnen|beginn!'),

  // Gruppe 3 – Uregelmæssige
  v('g3', 'gehen', 'at gå|går|gik|er gået|gå', 'gehen|ich gehe|ich ging|ich bin gegangen|geh!'),
  v('g3', 'machen/tun', 'at gøre|gør|gjorde|har gjort|gør', 'tun|ich tue|ich tat|ich habe getan|tu!'),
  v('g3', 'bekommen', 'at få|får|fik|har fået|få', 'bekommen|ich bekomme|ich bekam|ich habe bekommen|bekomm!'),
  v('g3', 'sagen', 'at sige|siger|sagde|har sagt|sig', 'sagen|ich sage|ich sagte|ich habe gesagt|sag!'),
  v('g3', 'helfen', 'at hjælpe|hjælper|hjalp|har hjulpet|hjælp', 'helfen|ich helfe|ich half|ich habe geholfen|hilf!'),
  v('g3', 'kommen', 'at komme|kommer|kom|er kommet|kom', 'kommen|ich komme|ich kam|ich bin gekommen|komm!'),
  v('g3', 'nehmen', 'at tage|tager|tog|har taget|tag', 'nehmen|ich nehme|ich nahm|ich habe genommen|nimm!'),

  // Modalverber (kein Imperativ)
  v('modal', 'können', 'at kunne|kan|kunne|har kunnet', 'können|ich kann|ich konnte|ich habe gekonnt'),
  v('modal', 'sollen/müssen', 'at skulle|skal|skulle|har skullet', 'sollen|ich soll|ich sollte|ich habe gesollt'),
  v('modal', 'wollen', 'at ville|vil|ville|har villet', 'wollen|ich will|ich wollte|ich habe gewollt'),
  v('modal', 'dürfen/müssen', 'at måtte|må|måtte|har måttet', 'dürfen|ich darf|ich durfte|ich habe gedurft'),
];

export const VERB_BY_ID = Object.fromEntries(VERBS.map((vb) => [vb.id, vb]));

// Beispielsätze aus dem Kapitel. [eckige Klammern] markieren die Verbform.
export const EXAMPLES = [
  { verbs: ['arbejde', 'flytte'], da: 'Han [arbejdede] i et firma i Bogota, før han [flyttede] til Danmark.', de: 'Er arbeitete in einer Firma in Bogotá, bevor er nach Dänemark zog.' },
  { verbs: ['studere', 'starte'], da: 'Katja [studerede] russisk i Bern, før hun [startede] på Roskilde Universitet.', de: 'Katja studierte Russisch in Bern, bevor sie an der Universität Roskilde anfing.' },
  { verbs: ['lave'], da: 'Hvad [lavede] du egentlig i Athen?', de: 'Was hast du eigentlich in Athen gemacht?' },
  { verbs: ['bo'], da: 'Hvor i Seattle [bor] du?', de: 'Wo in Seattle wohnst du?' },
  { verbs: ['spille', 'flytte'], da: 'Jeg [spillede] også fodbold, før jeg [flyttede] til Århus.', de: 'Ich spielte auch Fußball, bevor ich nach Aarhus zog.' },
  { verbs: ['købe'], da: 'Vi [købte] et hus i Haderslev sidste år på grund af min kones job.', de: 'Wir kauften letztes Jahr ein Haus in Haderslev wegen des Jobs meiner Frau.' },
  { verbs: ['besøge'], da: 'De [besøgte] deres familie i Prag sidste sommer.', de: 'Sie besuchten letzten Sommer ihre Familie in Prag.' },
  { verbs: ['spise'], da: 'Jim og hans kæreste [spiste] på en rigtig god restaurant i tirsdags.', de: 'Jim und seine Freundin aßen am Dienstag in einem richtig guten Restaurant.' },
  { verbs: ['studere', 'bo'], da: 'Pablo [studerede] medicin, da han [boede] i Buenos Aires.', de: 'Pablo studierte Medizin, als er in Buenos Aires wohnte.' },
  { verbs: ['gå', 'flytte'], da: 'Tom [gik] på universitetet, før han [flyttede] til Danmark.', de: 'Tom ging zur Universität, bevor er nach Dänemark zog.' },
  { verbs: ['få'], da: 'Han havde ikke noget job, før han [fik] et job i Nordisk Bank.', de: 'Er hatte keinen Job, bevor er einen Job bei der Nordisk Bank bekam.' },
  { verbs: ['ville'], da: 'Hun [ville] gerne prøve at bo i et andet land.', de: 'Sie wollte gerne versuchen, in einem anderen Land zu wohnen.' },
  { verbs: ['tage'], da: 'Emil [tog] altid metroen på arbejde i Stockholm.', de: 'Emil nahm in Stockholm immer die Metro zur Arbeit.' },
];
