# Architektur – „Dansk Verber“ (A2)

Mobile Web App (PWA) zum Lernen dänischer Verben **Deutsch ⇄ Dänisch** mit
Schwerpunkt auf der **Konjugation** (Infinitiv, Nutid, Datid, Førnutid, Imperativ).
Datengrundlage: *Kapitel 1 – Verben & Konjugation* (28 Verben in 4 Gruppen + Beispielsätze).

## 1. Ziele & Rahmenbedingungen

| Ziel | Entscheidung |
|---|---|
| Läuft auf dem iPhone wie eine App | PWA: `manifest.webmanifest`, `apple-mobile-web-app-*` Meta-Tags, Apple-Touch-Icon (PNG), Safe-Area-Insets, `100dvh` |
| Offline lernen (U-Bahn, Flugzeug) | Service Worker mit Cache-First-Strategie für alle Assets |
| Kein Server, kein Login | Statische Dateien, Fortschritt in `localStorage` |
| Einfach zu hosten & zu warten | Vanilla JS (ES-Module), kein Build-Schritt, kein Framework → läuft direkt auf GitHub Pages / Netlify |
| Konjugation steht im Fokus | Jede Lernkarte ist ein **(Verb × Zeitform)**-Paar, nicht nur ein Verb |

## 2. Lernmodell

### Lerneinheit („Item“)
`item = verb × zeitform` → z. B. `spise:datid` = *essen, Präteritum → spiste*.
28 Verben × 4–5 Zeitformen = **136 Items** (Modalverben haben keinen Imperativ).

### Drei Schwierigkeitsstufen

| Stufe | Frage | Antwort | Lernziel |
|---|---|---|---|
| **1 – Erkennen** | dänische Form, z. B. **„spiste“** 🔊 | 4 Optionen auf Deutsch: *essen · Datid (ich aß)* | Form erkennen & Zeitform zuordnen |
| **2 – Auswählen** | *essen · Datid* (ich aß) → „jeg ___“ | 4 dänische Formen | richtige Form von typischen Fehlern unterscheiden |
| **3 – Schreiben** | *essen · Datid* (ich aß) → „jeg ___“ | freie Eingabe (+ Tasten æ ø å) | aktive Produktion |

**Distraktoren (falsche Antworten) sind didaktisch gewählt:**
- Stufe 1: gleiches Verb in anderer Zeitform + andere Verben in gleicher Zeitform.
- Stufe 2: andere Formen desselben Verbs **und künstlich erzeugte Fehlformen**
  nach der falschen Regel (z. B. *spisede* statt *spiste*, *er spist* statt *har spist*,
  *gåede* statt *gik*). So wird genau der typische A2-Fehler trainiert (-ede vs. -te, har vs. er).
- Mehrdeutige Formen (z. B. *kom* = Datid **und** Imperativ von *komme*) werden erkannt:
  alle passenden Antworten zählen als richtig, und sie tauchen nie als Distraktor auf.

### Toleranz bei Stufe 3
- Groß/Kleinschreibung, Leerzeichen, abschließendes „!“ egal.
- Infinitiv mit oder ohne „at“.
- „ae/oe/aa“ statt „æ/ø/å“ wird als richtig gewertet, mit Hinweis.
- Førnutid ohne oder mit falschem Hilfsverb (har/er) → falsch, mit gezieltem Hinweis.

### Wiederholung (Spaced Repetition, Leitner-light)
- Jedes Item hat eine Box 0–5 (localStorage).
- Richtig → Box +1, falsch → Box 0.
- Fragen werden gewichtet gezogen: Gewicht = `6 − box` → schwache Items kommen öfter.
- Falsch beantwortete Items werden am Ende der Runde einmal wiederholt.
- Ergebnisbildschirm: „Fehler wiederholen“ startet eine Runde nur mit den Fehlern.

## 3. Modulstruktur

```
index.html              App-Shell, iOS-Meta-Tags, lädt js/app.js als ES-Modul
manifest.webmanifest    PWA-Manifest (standalone, Icons, Farben)
sw.js                   Service Worker (Offline-Cache, versioniert)
css/app.css             Design-Tokens (Light/Dark), iOS-Layout, Safe Areas
icons/                  App-Icons (PNG 180/192/512)
js/
  data.js               Reine Daten: Zeitformen, Gruppen, 28 Verben (DA + DE), Beispielsätze
  quiz.js               Reine Logik (kein DOM): Items, Fragen, Distraktoren, Antwortprüfung
  storage.js            Fortschritt & Einstellungen (localStorage, fehlertolerant)
  speech.js             Aussprache über Web Speech API (da-DK)
  app.js                UI: Screens rendern, Events, Navigation (Hash-frei, State-basiert)
tests/quiz.test.js      Unit-Tests der Quiz-Logik (node --test)
```

### Datenfluss

```
data.js ──► quiz.js ──► app.js ──► DOM
              ▲            │
              │            ▼
          storage.js ◄── Antworten (Box-Updates)
                           │
                       speech.js (🔊)
```

- **data.js** ist die einzige Stelle, an der Vokabular steht → neue Kapitel = neue Einträge.
- **quiz.js** ist zufallsgesteuert über einen injizierbaren `rng` → deterministisch testbar.
- **app.js** hält einen einfachen State (`screen`, `settings`, `session`) und rendert per Template-Strings.

### Datenmodell (Verb)

```js
{
  id: 'spise', group: 'g2', de: 'essen',
  da: { inf: 'at spise', nutid: 'spiser', datid: 'spiste', fornutid: 'har spist', imperativ: 'spis' },
  deForms: { inf: 'essen', nutid: 'ich esse', datid: 'ich aß', fornutid: 'ich habe gegessen', imperativ: 'iss!' }
}
```

## 4. Screens

1. **Start** – drei Stufen-Karten, Filter (Gruppen, Zeitformen, Fragenanzahl), Gesamtfortschritt.
2. **Quiz** – Fortschrittsbalken, Frage, Optionen bzw. Eingabefeld; danach Feedback-Panel mit
   der **kompletten Konjugationsreihe** des Verbs, Regel-Hinweis der Gruppe und ggf. Beispielsatz.
3. **Ergebnis** – Punkte, Fehlerliste, „Fehler wiederholen“ / „Neue Runde“.
4. **Verbtabelle** – alle Verben nach Gruppen, antippen = vorlesen, Lernstand pro Verb, Beispielsätze.

## 5. iOS-Optimierung

- `viewport-fit=cover` + `env(safe-area-inset-*)` für Notch / Dynamic Island / Home-Indicator.
- `apple-mobile-web-app-capable`, `status-bar-style`, Apple-Touch-Icon 180×180 PNG.
- Eingabefelder ≥ 16 px (verhindert Auto-Zoom), `autocapitalize/autocorrect/spellcheck = off`.
- Tasten **æ ø å** über dem Eingabefeld (deutsche iOS-Tastatur hat sie nicht direkt);
  `pointerdown`+`preventDefault` hält die Tastatur offen.
- Touch-Ziele ≥ 44 pt, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`.
- `100dvh`-Layout, Dark Mode über `prefers-color-scheme`, System-Font (SF Pro).
- Aussprache mit iOS-Stimme „Sara“ (da-DK) über `speechSynthesis`.

## 6. Deployment

Statisch – z. B. GitHub Pages (Settings → Pages → Branch wählen). Auf dem iPhone in Safari öffnen →
Teilen → **„Zum Home-Bildschirm“**. Beim Ändern von Assets `CACHE_VERSION` in `sw.js` erhöhen.

## 7. Erweiterbarkeit

- Weitere Kapitel: neue Verben in `data.js` (Feld `chapter`), Filter im Start-Screen.
- Lückentext-Modus aus den Beispielsätzen (Daten sind bereits mit markierten Verbformen hinterlegt).
