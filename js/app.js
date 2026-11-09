import { DECKS, DECK_BY_ID } from './decks/index.js';
import {
  allItems, pickItems, buildQuestion, checkTyped, updateProgress, itemKey, MAX_BOX,
} from './quiz.js';
import { loadSettings, saveSettings, loadProgress, saveProgress, resetDeckProgress } from './storage.js';
import { LANGUAGES, t as translate, tr } from './i18n.js';
import { speak, canSpeak, configure as configureSpeech, danishVoices, onVoices, pickVoice } from './speech.js';

const app = document.getElementById('app');
const SPEECH_TEST = 'Hej! Jeg lærer dansk.';

const LEVELS = [
  { id: 1, icon: '👀' },
  { id: 2, icon: '👆' },
  { id: 3, icon: '✍️' },
];

const state = {
  screen: 'home',        // home | quiz | result | table
  settings: loadSettings(),
  progress: loadProgress(),
  session: null,
  sheet: false,          // Sprach-/Einstellungs-Sheet offen?
};

configureSpeech({ voiceURI: state.settings.voiceURI, speechRate: state.settings.speechRate });

// ---------- Helfer ----------

const lang = () => state.settings.lang;
const t = (key, params) => translate(lang(), key, params);
const L = (obj) => tr(obj, lang());
const deck = () => DECK_BY_ID[state.settings.area];
const deckSettings = () => state.settings.decks[deck().id];
const dt = (key, params) => t(`${deck().id}.${key}`, params);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const markForms = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
const quote = (s) => (lang() === 'de' ? `„${esc(s)}“` : `“${esc(s)}”`);
const stripMarks = (s) => s.replace(/[[\]]/g, '');
const speakBtn = (text, extra = '') =>
  canSpeak() ? `<button class="speak ${extra}" data-action="speak" data-text="${esc(text)}" aria-label="${t('speak')}">🔊</button>` : '';

function selectedItems(d = deck()) {
  const s = state.settings.decks[d.id];
  return allItems(d, { groups: s.groups, forms: s.forms });
}

function masteryStats(d = deck()) {
  const items = allItems(d);
  const sure = items.filter((it) => (state.progress[itemKey(d, it)]?.box ?? 0) >= 3).length;
  return { sure, total: items.length };
}

function entryMastery(d, entry) {
  const forms = Object.keys(entry.da);
  const sum = forms.reduce((s, f) => s + (state.progress[itemKey(d, { entryId: entry.id, form: f })]?.box ?? 0), 0);
  return sum / (forms.length * MAX_BOX);
}

// ---------- Aussprache ----------

let toastTimer;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
}

/** Spricht und zeigt am angetippten Element, dass gerade gesprochen wird. */
function say(text, el) {
  document.querySelectorAll('.speaking').forEach((x) => x.classList.remove('speaking'));
  el?.classList.add('speaking');
  speak(text, {
    onend: () => el?.classList.remove('speaking'),
    onfail: (reason) => {
      el?.classList.remove('speaking');
      if (reason === 'unsupported') toast(t('speech.unsupported'));
      else if (!danishVoices().length) toast(t('speech.noVoice'));
      else toast(t('speech.failed'));
    },
  });
}

function applyLang() {
  document.documentElement.lang = lang();
  document.title = `${t('appTitle')} · Dansk`;
}

function go(screen) {
  state.screen = screen;
  render();
  window.scrollTo(0, 0);
}

// ---------- Session ----------

function startSession(level, items) {
  const d = deck();
  const chosen = items ?? pickItems(d, selectedItems(), state.settings.count, state.progress);
  if (!chosen.length) return;
  state.session = {
    deckId: d.id,
    level,
    queue: chosen.map((it) => ({ q: buildQuestion(d, it, level, lang()), retry: false })),
    index: 0,
    results: [],
    answered: null,
  };
  go('quiz');
}

const sessionDeck = () => DECK_BY_ID[state.session.deckId];
const currentEntry = () => state.session.queue[state.session.index];

function submitAnswer(correct, given, hint) {
  const s = state.session;
  if (s.answered) return;
  const d = sessionDeck();
  const entry = currentEntry();
  updateProgress(d, state.progress, entry.q.item, correct);
  saveProgress(state.progress);
  s.answered = { correct, given, hint };
  s.results.push({ item: entry.q.item, correct, retry: entry.retry, given });
  if (!correct && !entry.retry) {
    s.queue.push({ q: buildQuestion(d, entry.q.item, s.level, lang()), retry: true });
  }
  if (state.settings.autoSpeak) say(entry.q.answer);
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

// ---------- Bausteine ----------

function renderTopbar() {
  return `
    <div class="topbar">
      <div class="area-switch segmented" role="tablist">
        ${DECKS.map((d) => `
          <button role="tab" class="${d.id === deck().id ? 'on' : ''}" aria-selected="${d.id === deck().id}"
            data-action="area" data-area="${d.id}">${d.icon} ${t(`area.${d.id}`)}</button>`).join('')}
      </div>
      <button class="globe" data-action="sheet" aria-label="${t('settings.open')}">🌐</button>
    </div>`;
}

function renderTabbar() {
  const tab = (id, icon, label) =>
    `<button class="tab ${state.screen === id ? 'active' : ''}" data-action="go" data-screen="${id}"><span>${icon}</span>${label}</button>`;
  return `<nav class="tabbar">${tab('home', '🎯', t('tab.practice'))}${tab('table', '📖', dt('list'))}</nav>`;
}

function renderSpeechSettings() {
  const voices = danishVoices();
  const active = pickVoice();
  let status;
  if (!canSpeak()) status = `<p class="speech-status warn">${t('speech.unsupported')}</p>`;
  else if (!voices.length) status = `<p class="speech-status warn">${t('speech.noVoice')}</p>`;
  else status = `<p class="speech-status ok">✓ ${t('speech.voicesFound', { n: voices.length, name: esc(active?.name ?? '') })}</p>`;
  return `
    <div class="label">🔊 ${t('speech.title')}</div>
    <div class="card speech-card">
      ${status}
      ${voices.length > 1 ? `
        <label class="field">
          <span>${t('speech.voice')}</span>
          <select data-action="voice">
            <option value="">${t('speech.auto')}</option>
            ${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === state.settings.voiceURI ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
          </select>
        </label>` : ''}
      <div class="field">
        <span>${t('speech.rate')}</span>
        <div class="segmented">
          ${[[0.7, 'speech.slow'], [0.9, 'speech.normal']].map(([r, k]) => `<button class="${state.settings.speechRate === r ? 'on' : ''}" data-action="rate" data-rate="${r}">${t(k)}</button>`).join('')}
        </div>
      </div>
      ${canSpeak() ? `<button class="btn secondary block" data-action="speech-test">▶︎ ${t('speech.test')} ${quote(SPEECH_TEST)}</button>` : ''}
      <p class="muted small">${t('speech.silent')}</p>
    </div>`;
}

function renderSheet() {
  if (!state.sheet) return '';
  return `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="grabber"></div>
      <h2 id="sheet-title">🌐 ${t('settings.heading')}</h2>
      <div class="label">${t('settings.title')}</div>
      <p class="muted small">${t('settings.desc')}</p>
      <div class="lang-list">
        ${LANGUAGES.map((l) => `
          <button class="lang ${l.id === lang() ? 'on' : ''}" data-action="lang" data-lang="${l.id}" aria-pressed="${l.id === lang()}">
            <span class="lang-flag">${l.flag}</span><span class="lang-name">${l.name}</span>
            <span class="check">${l.id === lang() ? '✓' : ''}</span>
          </button>`).join('')}
      </div>
      ${renderSpeechSettings()}
      <button class="btn primary block" data-action="close-sheet">${t('done')}</button>
    </section>`;
}

// ---------- Screens ----------

function renderHome() {
  const d = deck();
  const { sure, total } = masteryStats();
  const items = selectedItems();
  const st = deckSettings();
  const chip = (kind, id, label, on, cls = '') =>
    `<button class="chip ${on ? 'on' : ''} ${cls}" data-action="toggle" data-kind="${kind}" data-id="${id}" aria-pressed="${on}">${label}</button>`;

  return `
  <main class="screen home">
    ${renderTopbar()}
    <header class="hero">
      <div class="flag" aria-hidden="true"></div>
      <div>
        <h1>${t('appTitle')}</h1>
        <p class="muted">${dt('sub')}</p>
      </div>
    </header>

    <section class="card progress-card">
      <div class="row between"><strong>${t('progress')}</strong><span class="muted">${t('progressSure', { n: sure, total })}</span></div>
      <div class="bar"><div style="width:${(sure / total) * 100}%"></div></div>
    </section>

    <h2>${t('difficulty')}</h2>
    <section class="levels">
      ${LEVELS.map((l) => `
        <button class="level card" data-action="start" data-level="${l.id}" ${items.length ? '' : 'disabled'}>
          <span class="level-num">${l.id}</span>
          <span class="level-text"><strong>${l.icon} ${t(`level.${l.id}`)}</strong><span class="muted">${dt(`level.${l.id}`)}</span></span>
          <span class="chev">›</span>
        </button>`).join('')}
    </section>

    <h2>${t('whatToPractice')}</h2>
    <section class="card settings">
      <div class="label">${dt('groups')}</div>
      <div class="chips">${d.groups.map((g) => chip('groups', g.id, `${L(g.name)}<small>${g.sub}</small>`, st.groups.includes(g.id), `c-${g.color}`)).join('')}</div>
      <div class="label">${dt('forms')}</div>
      <div class="chips">${d.forms.map((f) => chip('forms', f.id, `${f.da}<small>${L(f.tr)}</small>`, st.forms.includes(f.id))).join('')}</div>
      <div class="label">${t('questionsPerRound')}</div>
      <div class="segmented">${[10, 20, 30].map((n) => `<button class="${state.settings.count === n ? 'on' : ''}" data-action="count" data-n="${n}">${n}</button>`).join('')}</div>
      <label class="switch-row">
        <span>${t('autoSpeak')}</span>
        <input type="checkbox" data-action="autospeak" ${state.settings.autoSpeak ? 'checked' : ''}>
      </label>
      <p class="muted small">${items.length ? t('itemsSelected', { n: items.length }) : t('noneSelected')}</p>
    </section>

    <button class="link danger" data-action="reset">${t('resetProgress')}</button>
  </main>
  ${renderTabbar()}`;
}

function renderForms(d, entry, highlight) {
  return `
    <div class="conj">
      ${d.forms.filter((f) => entry.da[f.id] !== undefined).map((f) => `
        <button class="conj-cell ${f.id === highlight ? 'hl' : ''}" data-action="speak" data-text="${esc(entry.da[f.id])}">
          <small>${f.da}</small><span>${esc(entry.da[f.id])}</span>
        </button>`).join('')}
    </div>`;
}

function renderQuestionHead(d, q) {
  const f = d.formById[q.form];
  const group = d.groupById[q.entry.group];
  const badge = `<span class="badge c-${group.color}">${L(group.name)}</span>`;
  if (q.level === 1) {
    return `
      <div class="prompt">
        ${badge}
        <p class="muted">${t(`${d.id}.whatMeans`)}</p>
        <div class="big-word">${esc(q.answer)} ${speakBtn(q.answer)}</div>
      </div>`;
  }
  const label = L(q.entry.tr);
  const translated = q.entry.trForms[lang()]?.[q.form];
  return `
    <div class="prompt">
      ${badge}
      <p class="muted">${t('howDanish')}</p>
      <div class="big-word de">${esc(label)}</div>
      <div class="tense-pill"><strong>${f.da}</strong> · ${esc(L(f.tr))}</div>
      ${translated && translated !== label ? `<div class="de-form">${quote(translated)}</div>` : ''}
      <div class="blank">${esc(d.blank(q.entry, q.form))}</div>
    </div>`;
}

function renderOptions(q, answered) {
  return `
    <div class="options">
      ${q.options.map((o, i) => {
        let cls = '';
        if (answered) cls = o.correct ? 'right' : answered.given === i ? 'wrong' : 'dim';
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
        autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${t('placeholder')}"
        value="${answered ? esc(answered.given) : ''}" ${answered ? 'disabled' : ''} aria-label="${t('placeholder')}">
      ${answered ? '' : `
        <div class="special-keys">
          ${['æ', 'ø', 'å'].map((ch) => `<button type="button" class="key" data-char="${ch}">${ch}</button>`).join('')}
        </div>
        <div class="row gap">
          <button type="button" class="btn secondary" data-action="giveup">${t('dontKnow')}</button>
          <button type="submit" class="btn primary">${t('check')}</button>
        </div>`}
    </form>`;
}

function renderFeedback(d, q, answered) {
  const group = d.groupById[q.entry.group];
  const example = d.examples.find((e) => e.entries.includes(q.entry.id));
  const f = d.formById[q.form];
  const also = q.alsoCorrect?.length
    ? `<p class="small muted">${t('alsoIs', { w: esc(q.answer), forms: q.alsoCorrect.map((x) => d.formById[x.form].da).join(', ') })}</p>`
    : '';
  return `
    <section class="feedback ${answered.correct ? 'ok' : 'bad'}">
      <div class="fb-title">${answered.correct ? t('correct') : t('wrong')}</div>
      ${answered.hint ? `<p class="hint">${esc(answered.hint)}</p>` : ''}
      <div class="solution">
        <span><small>${esc(L(q.entry.tr))} · ${f.da}</small><strong>${esc(q.answer)}</strong></span>
        ${speakBtn(q.answer, 'lg')}
      </div>
      ${also}
      ${renderForms(d, q.entry, q.form)}
      <p class="rule"><span class="dot c-${group.color}"></span>${esc(L(group.tip))}</p>
      ${example ? `<div class="example"><p><span>${markForms(example.da)}</span> ${speakBtn(stripMarks(example.da))}</p><p class="muted small">${esc(L(example.tr))}</p></div>` : ''}
      <button class="btn primary block" data-action="next">${t('next')}</button>
    </section>`;
}

function renderQuiz() {
  const s = state.session;
  const d = sessionDeck();
  const { q, retry } = currentEntry();
  const done = s.index + (s.answered ? 1 : 0);
  const pct = (done / s.queue.length) * 100;
  return `
  <main class="screen quiz level-${q.level}">
    <header class="quiz-top">
      <button class="icon-btn" data-action="quit" aria-label="${t('quit')}">✕</button>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <span class="muted small">${Math.min(s.index + 1, s.queue.length)}/${s.queue.length}</span>
    </header>
    ${retry ? `<div class="retry-tag">${t('retry')}</div>` : ''}
    <section class="card question">${renderQuestionHead(d, q)}</section>
    ${q.level === 3 ? renderTyping(s.answered) : renderOptions(q, s.answered)}
    ${s.answered ? renderFeedback(d, q, s.answered) : ''}
  </main>`;
}

function renderResult() {
  const s = state.session;
  const d = sessionDeck();
  const first = s.results.filter((r) => !r.retry);
  const right = first.filter((r) => r.correct).length;
  const wrongItems = first.filter((r) => !r.correct);
  const pct = Math.round((right / first.length) * 100);
  const msg = t(pct === 100 ? 'result.perfect' : pct >= 80 ? 'result.great' : pct >= 50 ? 'result.good' : 'result.low');
  return `
  <main class="screen result">
    <section class="card score">
      <div class="ring" style="--p:${pct}"><span>${right}/${first.length}</span></div>
      <h1>${msg}</h1>
      <p class="muted">${t(`area.${d.id}`)} · ${t('levelN', { n: s.level, title: t(`level.${s.level}`) })}</p>
    </section>
    ${wrongItems.length ? `
      <h2>${t('reviewThese')}</h2>
      <section class="card list">
        ${wrongItems.map((r) => {
          const entry = d.entryById[r.item.entryId];
          const text = entry.da[r.item.form];
          return `<button class="list-row" data-action="speak" data-text="${esc(text)}">
            <span><strong>${esc(L(entry.tr))}</strong> <small class="muted">${d.formById[r.item.form].da}</small></span>
            <span class="answer">${esc(text)} 🔊</span>
          </button>`;
        }).join('')}
      </section>
      <button class="btn primary block" data-action="retry-mistakes">${t('retryMistakes', { n: wrongItems.length })}</button>` : ''}
    <button class="btn ${wrongItems.length ? 'secondary' : 'primary'} block" data-action="start" data-level="${s.level}">${t('newRound')}</button>
    ${s.level < 3 && pct >= 80 ? `<button class="btn secondary block" data-action="start" data-level="${s.level + 1}">${t('nextLevel', { title: t(`level.${s.level + 1}`) })}</button>` : ''}
    <button class="btn ghost block" data-action="go" data-screen="home">${t('overview')}</button>
  </main>`;
}

function renderTable() {
  const d = deck();
  return `
  <main class="screen table">
    ${renderTopbar()}
    <header class="page-head"><h1>${dt('list')}</h1><p class="muted">${t('tableHint')}</p></header>
    ${d.groups.map((g) => `
      <section class="group">
        <h2><span class="dot c-${g.color}"></span>${L(g.name)} <small class="muted">${g.sub}</small></h2>
        <p class="muted small">${esc(L(g.tip))}</p>
        ${d.entries.filter((e) => e.group === g.id).map((e) => {
          const m = entryMastery(d, e);
          const cols = d.tableForms.filter((f) => e.da[f] !== undefined || d.id === 'verbs');
          return `
          <article class="card verb">
            <div class="row between verb-head">
              <button class="verb-name" data-action="speak" data-text="${esc(e.da[d.headForm])}">
                <strong>${esc(e.da[d.headForm])}</strong> <span class="muted">${esc(L(e.tr))}</span>
              </button>
              <span class="mastery" title="${t('progress')}"><span style="width:${m * 100}%"></span></span>
            </div>
            <div class="forms cols-${cols.length}">
              ${cols.map((fid) => {
                const f = d.formById[fid];
                return e.da[fid] !== undefined ? `
                  <button class="form" data-action="speak" data-text="${esc(e.da[fid])}">
                    <small>${f.da}</small><span>${esc(e.da[fid])}</span>
                  </button>` : `<div class="form empty"><small>${f.da}</small><span>–</span></div>`;
              }).join('')}
            </div>
          </article>`;
        }).join('')}
      </section>`).join('')}
    ${d.examples.length ? `
      <section class="group">
        <h2>💬 ${t('examples')}</h2>
        ${d.examples.map((e) => `
          <article class="card example">
            <p><span>${markForms(e.da)}</span> ${speakBtn(stripMarks(e.da))}</p>
            <p class="muted small">${esc(L(e.tr))}</p>
          </article>`).join('')}
      </section>` : ''}
  </main>
  ${renderTabbar()}`;
}

function render() {
  applyLang();
  const screens = { home: renderHome, quiz: renderQuiz, result: renderResult, table: renderTable };
  app.innerHTML = screens[state.screen]() + renderSheet();
  document.body.classList.toggle('sheet-open', state.sheet);
  if (state.screen === 'quiz' && state.session.level === 3 && !state.session.answered && !state.sheet) {
    document.getElementById('answer')?.focus();
  }
}

// ---------- Events ----------

function toggleSetting(kind, id) {
  const s = deckSettings();
  s[kind] = s[kind].includes(id) ? s[kind].filter((x) => x !== id) : [...s[kind], id];
  saveSettings(state.settings);
  render();
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'FORM' || el.tagName === 'INPUT') return;
  switch (el.dataset.action) {
    case 'go': go(el.dataset.screen); break;
    case 'area':
      state.settings.area = el.dataset.area;
      saveSettings(state.settings);
      render();
      break;
    case 'sheet': state.sheet = true; render(); break;
    case 'close-sheet': state.sheet = false; render(); break;
    case 'lang':
      state.settings.lang = el.dataset.lang;
      saveSettings(state.settings);
      render();
      break;
    case 'start': startSession(Number(el.dataset.level)); break;
    case 'toggle': toggleSetting(el.dataset.kind, el.dataset.id); break;
    case 'count':
      state.settings.count = Number(el.dataset.n);
      saveSettings(state.settings);
      render();
      break;
    case 'speak': say(el.dataset.text, el); break;
    case 'speech-test': say(SPEECH_TEST, el); break;
    case 'rate':
      state.settings.speechRate = Number(el.dataset.rate);
      configureSpeech({ speechRate: state.settings.speechRate });
      saveSettings(state.settings);
      render();
      break;
    case 'choose': {
      const q = currentEntry().q;
      const i = Number(el.dataset.i);
      submitAnswer(q.options[i].correct, i);
      break;
    }
    case 'giveup': submitAnswer(false, document.getElementById('answer')?.value ?? ''); break;
    case 'next': nextQuestion(); break;
    case 'quit':
      if (state.session.results.length === 0 || confirm(t('confirmQuit'))) go('home');
      break;
    case 'retry-mistakes': {
      const items = state.session.results.filter((r) => !r.retry && !r.correct).map((r) => r.item);
      startSession(state.session.level, items);
      break;
    }
    case 'reset':
      if (confirm(t('confirmReset'))) {
        resetDeckProgress(state.progress, deck());
        render();
      }
      break;
  }
});

app.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'voice') {
    state.settings.voiceURI = e.target.value;
    configureSpeech({ voiceURI: e.target.value });
    saveSettings(state.settings);
    say(SPEECH_TEST);
    return;
  }
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
  const res = checkTyped(sessionDeck(), value, q.entry, q.form, lang());
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.sheet) {
    state.sheet = false;
    render();
  } else if (e.key === 'Enter' && state.screen === 'quiz' && state.session?.answered && !state.sheet) {
    e.preventDefault();
    nextQuestion();
  }
});

onVoices(() => { if (state.sheet) render(); });

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  // Neue Version übernommen → einmal neu laden, damit der aktuelle Code läuft
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => reg.update()).catch(() => {});
  });
}
