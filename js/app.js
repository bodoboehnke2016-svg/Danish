import { VERBS, GROUPS, GROUP_BY_ID, TENSES, TENSE_BY_ID, EXAMPLES } from './data.js';
import {
  allItems, pickItems, buildQuestion, checkTyped, updateProgress, itemKey, blankFor, MAX_BOX,
} from './quiz.js';
import { loadSettings, saveSettings, loadProgress, saveProgress, resetProgress } from './storage.js';
import { speak, canSpeak } from './speech.js';

const app = document.getElementById('app');

const LEVELS = [
  { id: 1, title: 'Erkennen', desc: 'Dänische Form sehen → deutsche Bedeutung & Zeitform wählen', icon: '👀' },
  { id: 2, title: 'Auswählen', desc: 'Deutsch & Zeitform sehen → richtige dänische Form wählen', icon: '👆' },
  { id: 3, title: 'Schreiben', desc: 'Deutsch & Zeitform sehen → dänische Form selbst tippen', icon: '✍️' },
];

const state = {
  screen: 'home',
  settings: loadSettings(),
  progress: loadProgress(),
  session: null,
};

// ---------- Helfer ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const markForms = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
const groupColor = (verb) => GROUP_BY_ID[verb.group].color;
const speakBtn = (text, extra = '') =>
  canSpeak() ? `<button class="speak ${extra}" data-action="speak" data-text="${esc(text)}" aria-label="Vorlesen">🔊</button>` : '';

function selectedItems() {
  return allItems({ groups: state.settings.groups, tenses: state.settings.tenses });
}

function masteryStats() {
  const items = allItems();
  const sure = items.filter((it) => (state.progress[itemKey(it)]?.box ?? 0) >= 3).length;
  return { sure, total: items.length };
}

function verbMastery(verb) {
  const keys = Object.keys(verb.da).map((t) => `${verb.id}:${t}`);
  const sum = keys.reduce((s, k) => s + (state.progress[k]?.box ?? 0), 0);
  return sum / (keys.length * MAX_BOX);
}

function go(screen) {
  state.screen = screen;
  render();
  window.scrollTo(0, 0);
}

// ---------- Session ----------

function startSession(level, items) {
  const chosen = items ?? pickItems(selectedItems(), state.settings.count, state.progress);
  if (!chosen.length) return;
  state.session = {
    level,
    queue: chosen.map((it) => ({ q: buildQuestion(it, level), retry: false })),
    index: 0,
    firstTotal: chosen.length,
    results: [],
    answered: null,
  };
  go('quiz');
}

function currentEntry() {
  const s = state.session;
  return s.queue[s.index];
}

function submitAnswer(correct, given, hint) {
  const s = state.session;
  const entry = currentEntry();
  if (s.answered) return;
  updateProgress(state.progress, entry.q.item, correct);
  saveProgress(state.progress);
  s.answered = { correct, given, hint };
  s.results.push({ item: entry.q.item, correct, retry: entry.retry, given });
  if (!correct && !entry.retry) {
    s.queue.push({ q: buildQuestion(entry.q.item, s.level), retry: true });
  }
  if (state.settings.autoSpeak) speak(entry.q.answer);
  render();
  requestAnimationFrame(() => document.querySelector('.feedback')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
}

function nextQuestion() {
  const s = state.session;
  s.index += 1;
  s.answered = null;
  if (s.index >= s.queue.length) go('result');
  else {
    render();
    window.scrollTo(0, 0);
  }
}

// ---------- Screens ----------

function renderTabbar() {
  const tab = (id, icon, label) =>
    `<button class="tab ${state.screen === id ? 'active' : ''}" data-action="go" data-screen="${id}"><span>${icon}</span>${label}</button>`;
  return `<nav class="tabbar">${tab('home', '🎯', 'Üben')}${tab('table', '📖', 'Verbtabelle')}</nav>`;
}

function renderHome() {
  const { sure, total } = masteryStats();
  const items = selectedItems();
  const st = state.settings;
  const chip = (kind, id, label, on, cls = '') =>
    `<button class="chip ${on ? 'on' : ''} ${cls}" data-action="toggle" data-kind="${kind}" data-id="${id}" aria-pressed="${on}">${label}</button>`;

  return `
  <main class="screen home">
    <header class="hero">
      <div class="flag" aria-hidden="true"></div>
      <div>
        <h1>Dansk Verber</h1>
        <p class="muted">A2 · Kapitel 1 · Konjugation</p>
      </div>
    </header>

    <section class="card progress-card">
      <div class="row between"><strong>Lernstand</strong><span class="muted">${sure} / ${total} Formen sicher</span></div>
      <div class="bar"><div style="width:${(sure / total) * 100}%"></div></div>
    </section>

    <h2>Schwierigkeitsstufe</h2>
    <section class="levels">
      ${LEVELS.map((l) => `
        <button class="level card" data-action="start" data-level="${l.id}" ${items.length ? '' : 'disabled'}>
          <span class="level-num">${l.id}</span>
          <span class="level-text"><strong>${l.icon} ${l.title}</strong><span class="muted">${l.desc}</span></span>
          <span class="chev">›</span>
        </button>`).join('')}
    </section>

    <h2>Was möchtest du üben?</h2>
    <section class="card settings">
      <div class="label">Verbgruppen</div>
      <div class="chips">${GROUPS.map((g) => chip('groups', g.id, `${g.name}<small>${g.sub}</small>`, st.groups.includes(g.id), `c-${g.color}`)).join('')}</div>
      <div class="label">Zeitformen</div>
      <div class="chips">${TENSES.map((t) => chip('tenses', t.id, `${t.da}<small>${t.de}</small>`, st.tenses.includes(t.id))).join('')}</div>
      <div class="label">Fragen pro Runde</div>
      <div class="segmented">${[10, 20, 30].map((n) => `<button class="${st.count === n ? 'on' : ''}" data-action="count" data-n="${n}">${n}</button>`).join('')}</div>
      <label class="switch-row">
        <span>Antwort automatisch vorlesen 🔊</span>
        <input type="checkbox" data-action="autospeak" ${st.autoSpeak ? 'checked' : ''}>
      </label>
      <p class="muted small">${items.length ? `${items.length} Formen ausgewählt` : '⚠️ Bitte mindestens eine Gruppe und Zeitform wählen (Modalverben haben keinen Imperativ).'}</p>
    </section>

    <button class="link danger" data-action="reset">Lernstand zurücksetzen</button>
  </main>
  ${renderTabbar()}`;
}

function renderConjugation(verb, highlight) {
  return `
    <div class="conj">
      ${TENSES.filter((t) => verb.da[t.id] !== undefined).map((t) => `
        <button class="conj-cell ${t.id === highlight ? 'hl' : ''}" data-action="speak" data-text="${esc(verb.da[t.id])}">
          <small>${t.da}</small><span>${esc(verb.da[t.id])}</span>
        </button>`).join('')}
    </div>`;
}

function renderQuestionHead(q) {
  const t = TENSE_BY_ID[q.tense];
  const color = groupColor(q.verb);
  if (q.level === 1) {
    return `
      <div class="prompt">
        <span class="badge c-${color}">${GROUP_BY_ID[q.verb.group].name}</span>
        <p class="muted">Was bedeutet diese Form?</p>
        <div class="big-word">${esc(q.answer)} ${speakBtn(q.answer)}</div>
      </div>`;
  }
  return `
    <div class="prompt">
      <span class="badge c-${color}">${GROUP_BY_ID[q.verb.group].name}</span>
      <p class="muted">Wie heißt es auf Dänisch?</p>
      <div class="big-word de">${esc(q.verb.de)}</div>
      <div class="tense-pill"><strong>${t.da}</strong> · ${t.de}</div>
      ${q.tense !== 'inf' ? `<div class="de-form">„${esc(q.verb.deForms[q.tense])}“</div>` : ''}
      <div class="blank">${esc(blankFor(q.tense))}</div>
    </div>`;
}

function renderOptions(q, answered) {
  return `
    <div class="options">
      ${q.options.map((o, i) => {
        let cls = '';
        if (answered) {
          if (o.correct) cls = 'right';
          else if (answered.given === i) cls = 'wrong';
          else cls = 'dim';
        }
        return `<button class="option ${cls}" data-action="choose" data-i="${i}" ${answered ? 'disabled' : ''}>
          <span class="opt-label">${esc(o.label)}</span>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}
        </button>`;
      }).join('')}
    </div>`;
}

function renderTyping(answered) {
  const cls = answered ? (answered.correct ? 'right' : 'wrong') : '';
  return `
    <form class="typing" data-action="check" autocomplete="off">
      <input id="answer" class="${cls}" type="text" inputmode="text" enterkeyhint="done"
        autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Dänische Form …"
        value="${answered ? esc(answered.given) : ''}" ${answered ? 'disabled' : ''} aria-label="Antwort">
      ${answered ? '' : `
        <div class="special-keys">
          ${['æ', 'ø', 'å'].map((ch) => `<button type="button" class="key" data-char="${ch}">${ch}</button>`).join('')}
        </div>
        <div class="row gap">
          <button type="button" class="btn secondary" data-action="giveup">Weiß nicht</button>
          <button type="submit" class="btn primary">Prüfen</button>
        </div>`}
    </form>`;
}

function renderFeedback(q, answered) {
  const group = GROUP_BY_ID[q.verb.group];
  const example = EXAMPLES.find((e) => e.verbs.includes(q.verb.id));
  const t = TENSE_BY_ID[q.tense];
  const also = q.alsoCorrect?.length
    ? `<p class="small muted">„${esc(q.answer)}“ ist auch: ${q.alsoCorrect.map((x) => TENSE_BY_ID[x.tense].da).join(', ')}.</p>`
    : '';
  return `
    <section class="feedback ${answered.correct ? 'ok' : 'bad'}">
      <div class="fb-title">${answered.correct ? '✓ Richtig!' : '✗ Leider falsch'}</div>
      ${answered.hint ? `<p class="hint">${esc(answered.hint)}</p>` : ''}
      <div class="solution">
        <span><small>${esc(q.verb.de)} · ${t.da}</small><strong>${esc(q.answer)}</strong></span>
        ${speakBtn(q.answer, 'lg')}
      </div>
      ${also}
      ${renderConjugation(q.verb, q.tense)}
      <p class="rule"><span class="dot c-${group.color}"></span>${esc(group.rule)}</p>
      ${example ? `<div class="example"><p>${markForms(example.da)} ${speakBtn(example.da.replace(/[[\]]/g, ''))}</p><p class="muted small">${esc(example.de)}</p></div>` : ''}
      <button class="btn primary block" data-action="next">Weiter</button>
    </section>`;
}

function renderQuiz() {
  const s = state.session;
  const { q, retry } = currentEntry();
  const done = s.index + (s.answered ? 1 : 0);
  const pct = (done / s.queue.length) * 100;
  return `
  <main class="screen quiz level-${q.level}">
    <header class="quiz-top">
      <button class="icon-btn" data-action="quit" aria-label="Beenden">✕</button>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <span class="muted small">${Math.min(s.index + 1, s.queue.length)}/${s.queue.length}</span>
    </header>
    ${retry ? '<div class="retry-tag">🔁 Wiederholung</div>' : ''}
    <section class="card question">${renderQuestionHead(q)}</section>
    ${q.level === 3 ? renderTyping(s.answered) : renderOptions(q, s.answered)}
    ${s.answered ? renderFeedback(q, s.answered) : ''}
  </main>`;
}

function renderResult() {
  const s = state.session;
  const first = s.results.filter((r) => !r.retry);
  const right = first.filter((r) => r.correct).length;
  const wrongItems = first.filter((r) => !r.correct);
  const pct = Math.round((right / first.length) * 100);
  const msg = pct === 100 ? 'Perfekt! Fantastisk! 🎉' : pct >= 80 ? 'Sehr gut! Godt klaret! 💪' : pct >= 50 ? 'Gut – weiter so! 🙂' : 'Übung macht den Meister. Bliv ved! 📚';
  return `
  <main class="screen result">
    <section class="card score">
      <div class="ring" style="--p:${pct}"><span>${right}/${first.length}</span></div>
      <h1>${msg}</h1>
      <p class="muted">Stufe ${s.level} · ${LEVELS[s.level - 1].title}</p>
    </section>
    ${wrongItems.length ? `
      <h2>Das solltest du wiederholen</h2>
      <section class="card list">
        ${wrongItems.map((r) => {
          const verb = VERBS.find((v) => v.id === r.item.verbId);
          return `<button class="list-row" data-action="speak" data-text="${esc(verb.da[r.item.tense])}">
            <span><strong>${esc(verb.de)}</strong> <small class="muted">${TENSE_BY_ID[r.item.tense].da}</small></span>
            <span class="answer">${esc(verb.da[r.item.tense])} 🔊</span>
          </button>`;
        }).join('')}
      </section>
      <button class="btn primary block" data-action="retry-mistakes">Fehler wiederholen (${wrongItems.length})</button>` : ''}
    <button class="btn ${wrongItems.length ? 'secondary' : 'primary'} block" data-action="start" data-level="${s.level}">Neue Runde</button>
    ${s.level < 3 && pct >= 80 ? `<button class="btn secondary block" data-action="start" data-level="${s.level + 1}">Nächste Stufe: ${LEVELS[s.level].title} →</button>` : ''}
    <button class="btn ghost block" data-action="go" data-screen="home">Zur Übersicht</button>
  </main>`;
}

function renderTable() {
  const cols = TENSES.filter((t) => t.id !== 'inf');
  return `
  <main class="screen table">
    <header class="page-head"><h1>Verbtabelle</h1><p class="muted">Antippen zum Anhören</p></header>
    ${GROUPS.map((g) => `
      <section class="group">
        <h2><span class="dot c-${g.color}"></span>${g.name} <small class="muted">${g.sub}</small></h2>
        <p class="muted small">${esc(g.rule)}</p>
        ${VERBS.filter((v) => v.group === g.id).map((v) => {
          const m = verbMastery(v);
          return `
          <article class="card verb">
            <div class="row between verb-head">
              <button class="verb-name" data-action="speak" data-text="${esc(v.da.inf)}">
                <strong>${esc(v.da.inf)}</strong> <span class="muted">${esc(v.de)}</span>
              </button>
              <span class="mastery" title="Lernstand"><span style="width:${m * 100}%"></span></span>
            </div>
            <div class="forms">
              ${cols.map((t) => v.da[t.id] !== undefined ? `
                <button class="form" data-action="speak" data-text="${esc(v.da[t.id])}">
                  <small>${t.da}</small><span>${esc(v.da[t.id])}</span>
                </button>` : `<div class="form empty"><small>${t.da}</small><span>–</span></div>`).join('')}
            </div>
          </article>`;
        }).join('')}
      </section>`).join('')}
    <section class="group">
      <h2>💬 Beispielsätze</h2>
      ${EXAMPLES.map((e) => `
        <article class="card example">
          <p>${markForms(e.da)} ${speakBtn(e.da.replace(/[[\]]/g, ''))}</p>
          <p class="muted small">${esc(e.de)}</p>
        </article>`).join('')}
    </section>
  </main>
  ${renderTabbar()}`;
}

function render() {
  const screens = { home: renderHome, quiz: renderQuiz, result: renderResult, table: renderTable };
  app.innerHTML = screens[state.screen]();
  if (state.screen === 'quiz' && state.session.level === 3 && !state.session.answered) {
    document.getElementById('answer')?.focus();
  }
}

// ---------- Events ----------

function toggleSetting(kind, id) {
  const list = state.settings[kind];
  state.settings[kind] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  saveSettings(state.settings);
  render();
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'FORM' || el.tagName === 'INPUT') return;
  const a = el.dataset.action;
  switch (a) {
    case 'go': go(el.dataset.screen); break;
    case 'start': startSession(Number(el.dataset.level)); break;
    case 'toggle': toggleSetting(el.dataset.kind, el.dataset.id); break;
    case 'count':
      state.settings.count = Number(el.dataset.n);
      saveSettings(state.settings);
      render();
      break;
    case 'speak': speak(el.dataset.text); break;
    case 'choose': {
      const q = currentEntry().q;
      const i = Number(el.dataset.i);
      submitAnswer(q.options[i].correct, i);
      break;
    }
    case 'giveup': submitAnswer(false, document.getElementById('answer')?.value ?? ''); break;
    case 'next': nextQuestion(); break;
    case 'quit':
      if (state.session.results.length === 0 || confirm('Runde beenden?')) go('home');
      break;
    case 'retry-mistakes': {
      const items = state.session.results.filter((r) => !r.retry && !r.correct).map((r) => r.item);
      startSession(state.session.level, items);
      break;
    }
    case 'reset':
      if (confirm('Gesamten Lernstand wirklich löschen?')) {
        resetProgress();
        state.progress = {};
        render();
      }
      break;
  }
});

app.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'autospeak') {
    state.settings.autoSpeak = e.target.checked;
    saveSettings(state.settings);
  }
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('answer');
  if (!input || state.session.answered) return;
  const value = input.value;
  if (!value.trim()) {
    input.focus();
    return;
  }
  const { q } = currentEntry();
  const res = checkTyped(value, q.verb, q.tense);
  submitAnswer(res.correct, value, res.hint);
});

// æ ø å einfügen, ohne dass die iOS-Tastatur zugeht
app.addEventListener('pointerdown', (e) => {
  const key = e.target.closest('.key[data-char]');
  if (!key) return;
  e.preventDefault();
  const input = document.getElementById('answer');
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + key.dataset.char + input.value.slice(end);
  input.setSelectionRange(start + 1, start + 1);
  input.focus();
});

// Enter auf der Feedback-Ansicht → weiter (praktisch mit Hardware-Tastatur)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && state.screen === 'quiz' && state.session?.answered) {
    e.preventDefault();
    nextQuestion();
  }
});

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
