# Architektur – „Dänisch lernen“ (A2)

Mobile Web App (PWA) zum Dänischlernen, optimiert für das iPhone.
**Lernsprache ist immer Dänisch** – die **Ausgangssprache** (Oberfläche, Bedeutungen, Hinweise)
ist umschaltbar: aktuell **Deutsch** und **Englisch**.

Zwei getrennte Lernbereiche mit identischem Aufbau:

| Bereich | Inhalt | „Formen“ |
|---|---|---|
| 🔤 **Verben** | Kapitel 1 – 28 Verben in 4 Gruppen + Beispielsätze | Infinitiv · Nutid · Datid · Førnutid · Imperativ |
| 📚 **Vokabeln** | A2-Grundwortschatz – 52 Substantive in 6 Themen + 12 Adjektive | Substantiv: Grundform (en/et) · Bestemt · Flertal — Adjektiv: Grundform · t-form · e-form |

## 1. Ziele & Rahmenbedingungen

| Ziel | Entscheidung |
|---|---|
| Läuft auf dem iPhone wie eine App | PWA: `manifest.webmanifest`, `apple-mobile-web-app-*` Meta-Tags, Apple-Touch-Icon, Safe-Area-Insets, `100dvh` |
| Offline lernen | Service Worker mit Cache-First-Strategie (versioniert) |
| Kein Server, kein Login | Statische Dateien, Fortschritt & Einstellungen in `localStorage` |
| Einfach zu hosten & zu warten | Vanilla JS (ES-Module), kein Build-Schritt → GitHub Pages per Workflow |
| Erweiterbar um Sprachen | Alle Texte über `i18n.js`, alle Inhalte mit `tr: {de, en}` |
| Erweiterbar um Lernbereiche | Generische Quiz-Engine + austauschbare **Decks** mit gleicher Schnittstelle |

## 2. Lernmodell (für alle Bereiche gleich)

### Lerneinheit („Item“)
`item = Eintrag × Form` → z. B. `spise:datid` (*essen, Präteritum → spiste*) oder `vocab/bil:def` (*Auto, bestimmt → bilen*).
Verben: 136 Items · Vokabeln: 192 Items.

### Drei Schwierigkeitsstufen

| Stufe | Frage | Antwort |
|---|---|---|
| **1 – Erkennen** | dänische Form, z. B. **„spiste“** / **„bilen“** 🔊 | 4 Optionen in der Ausgangssprache: *essen · Datid (ich aß)* / *Auto · Bestemt (das Auto)* |
| **2 – Auswählen** | *essen · Datid* → „jeg ___“ / *Auto · Bestemt* → „___“ | 4 dänische Formen |
| **3 – Schreiben** | wie Stufe 2 | freie Eingabe (+ Tasten æ ø å) |

**Didaktische Distraktoren** (pro Deck in `wrongForms`):
- Verben: falsche Regel (*spisede* statt *spiste*), falsches Hilfsverb (*er spist*, *har gået*).
- Substantive: falsches Geschlecht (*et bil*, *bilet*), falsche Mehrzahl (*mande* statt *mænd*), bestimmter Plural.
- Adjektive: falsche Endung (*store* statt *stort*).
- Mehrdeutige Formen (*kom* = Datid & Imperativ, *dansk* = Grundform & t-form) werden erkannt und nie als Distraktor genutzt.

**Toleranz in Stufe 3:** Groß/Klein, Leerzeichen, „!“ egal · „at“ / „jeg“ / „to“ als Präfix erlaubt ·
„ae/oe/aa“ statt „æ/ø/å“ zählt als richtig (mit Hinweis) · gezielte Hinweise (Hilfsverb fehlt, falsches
Geschlecht, Artikel fehlt, „das ist die Form für …“) – alle in der gewählten Ausgangssprache.

**Wiederholung:** Leitner-Boxen 0–5 pro Item; Gewicht `6 − box` bei der Auswahl; Fehler werden am Ende
der Runde wiederholt; „Fehler wiederholen“ im Ergebnis.

## 3. Modulstruktur

```
index.html               App-Shell, iOS-Meta-Tags, lädt js/app.js als ES-Modul
manifest.webmanifest     PWA-Manifest
sw.js                    Service Worker (Offline-Cache, CACHE_VERSION)
css/app.css              Design-Tokens (Light/Dark), iOS-Layout, Sheet, Safe Areas
icons/                   App-Icons (PNG 180/192/512)
js/
  i18n.js                Sprachen (LANGUAGES), UI-Texte (STRINGS), t(), tr()
  decks/
    index.js             Registry: DECKS = [verbsDeck, vocabDeck] + Lookup-Tabellen
    verbs.js             Deck „Verben“: Formen, Gruppen, Einträge, Beispiele, Regeln
    vocab.js             Deck „Vokabeln“: Formen, Themen, Einträge, Regeln
  quiz.js                Generische Logik (kein DOM): Items, Auswahl, Fragen, Prüfung
  storage.js             Einstellungen (inkl. Migration v1) & Fortschritt in localStorage
  speech.js              Aussprache (Web Speech API, da-DK)
  app.js                 UI: State, Screens, Events
tests/quiz.test.js       Unit-Tests (node --test): Logik, beide Decks, Vollständigkeit der Übersetzungen
.github/workflows/pages.yml   Tests + Deployment auf GitHub Pages
```

### Deck-Schnittstelle

Jeder Lernbereich ist ein Objekt mit derselben Form – die Engine (`quiz.js`) und die UI (`app.js`)
kennen keine Verben oder Vokabeln, nur Decks:

```js
{
  id: 'vocab', keyPrefix: 'vocab/', icon: '📚',
  forms:   [{ id: 'def', da: 'Bestemt', tr: { de: 'bestimmt', en: 'definite' } }, …],
  groups:  [{ id: 'city', color: 'teal', sub: 'By og trafik', name: {de, en}, tip: {de, en} }, …],
  entries: [{ id: 'bil', group: 'city', tr: { de: 'Auto', en: 'car' },
              da: { base: 'en bil', def: 'bilen', plural: 'biler' },
              trForms: { de: { base: 'ein Auto', … }, en: { base: 'a car', … } } }, …],
  examples: [],                      // optionale Beispielsätze
  tableForms, headForm,              // Darstellung in der Liste
  wrongForms(entry, form),           // Distraktoren für Stufe 2
  accepted(entry, form), clean(form, input, entry),   // Prüfung Stufe 3
  hint(entry, form, input, lang), fallbackHint(…),    // gezielte Hinweise
  blank(entry, form),                // Lückentext, z. B. „jeg ___“, „en/et ___“
}
```

### Datenfluss

```
          ┌──────────── i18n.js (Ausgangssprache) ───────────┐
          ▼                                                   ▼
decks/* ──► quiz.js ──────────────► app.js ──► DOM      Hinweise/Optionen
                ▲                     │
                └──── storage.js ◄────┘  (Boxen, Einstellungen)
                                      │
                                  speech.js 🔊
```

## 4. Bedienung & Screens

```
┌──────────────────────────────────────┐
│ [🔤 Verben | 📚 Vokabeln]        🌐 │  ← Topbar: Bereichsumschalter + Sprachknopf
│ Dänisch lernen                       │
│ Lernstand ▓▓▓░░░                     │
│ ① Erkennen  ② Auswählen  ③ Schreiben │
│ Filter: Gruppen/Themen · Formen · …  │
├──────────────────────────────────────┤
│   🎯 Üben          📖 Tabelle/Liste  │  ← Tabbar (bezieht sich auf den aktiven Bereich)
└──────────────────────────────────────┘
```

1. **Start** (pro Bereich) – Lernstand, drei Stufen, Filter, Fragenanzahl, Auto-Vorlesen.
2. **Quiz** – Frage, Optionen bzw. Eingabe; Feedback mit allen Formen, Regel-Tipp, ggf. Beispielsatz.
3. **Ergebnis** – Punkte, Fehlerliste, „Fehler wiederholen“ / „Neue Runde“ / „Nächste Stufe“.
4. **Verbtabelle / Wortliste** – alle Einträge nach Gruppen/Themen, antippen = vorlesen, Lernstand.

### 🌐 Einstellungen (Sprache)
- Der **Weltkugel-Knopf** oben rechts öffnet ein iOS-typisches **Bottom-Sheet**.
- Dort wird die **Ausgangssprache** gewählt (🇩🇪 Deutsch / 🇬🇧 English); Dänisch bleibt Lernsprache.
- Die Wahl wird gespeichert; beim ersten Start wird die Gerätesprache erkannt (Fallback Deutsch).
- Das Sheet ist der zentrale Ort für künftige Einstellungen (z. B. Sprechtempo, Fragenanzahl).

### Neue Ausgangssprache hinzufügen (z. B. Französisch)
1. `js/i18n.js`: Eintrag in `LANGUAGES` und Block in `STRINGS`.
2. In jedem Deck `tr.fr` / `trForms.fr` bzw. `name.fr` / `tip.fr` ergänzen.
3. `npm test` – der Vollständigkeitstest meldet jede fehlende Übersetzung.

### Neuen Lernbereich hinzufügen (z. B. Redewendungen)
1. `js/decks/phrases.js` mit obiger Schnittstelle (eigener `keyPrefix`!).
2. In `js/decks/index.js` registrieren, UI-Texte `phrases.*` in `i18n.js` ergänzen.
3. Datei in `sw.js` (`ASSETS`) aufnehmen und `CACHE_VERSION` erhöhen.

## 5. Speicherung

| Schlüssel | Inhalt |
|---|---|
| `dansk-verber:settings:v1` | `{ lang, area, count, autoSpeak, decks: { verbs: {groups, forms}, vocab: {…} } }` (alte v1-Felder `groups/tenses` werden migriert) |
| `dansk-verber:progress:v1` | `{ "spise:datid": {box, seen, correct}, "vocab/bil:def": {…} }` – Verben ohne Präfix (kompatibel zu v1), Vokabeln mit `vocab/` |

## 6. iOS-Optimierung

`viewport-fit=cover` + Safe-Area-Insets · Apple-Touch-Icon · Eingaben ≥ 16 px (kein Auto-Zoom) ·
`autocapitalize/autocorrect/spellcheck = off` · Tasten **æ ø å** (Tastatur bleibt offen) ·
Touch-Ziele ≥ 44 pt · Bottom-Sheet & Segmented Control im iOS-Stil · Dark Mode · Aussprache mit „Sara“ (da-DK).

## 7. Deployment

GitHub Actions (`.github/workflows/pages.yml`): bei jedem Push → `npm test` → Upload der statischen
Dateien → **GitHub Pages**. Einmalig im Repo: *Settings → Pages → Source: „GitHub Actions“*.
Auf dem iPhone: URL in Safari öffnen → Teilen → **„Zum Home-Bildschirm“**.
Bei geänderten Assets `CACHE_VERSION` in `sw.js` erhöhen, damit installierte Apps aktualisieren.
