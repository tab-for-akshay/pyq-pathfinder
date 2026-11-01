'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE = 'pp-progress-v2', QUEUE = 'pp-grade-queue-v1';
let MCQ = [], PARETO = null, PYQ = null;

/* ---------- Tabs ---------- */
const tabs = [...document.querySelectorAll('[role=tab]')];
function selectTab(t) {
  tabs.forEach(b => { const on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
    document.getElementById(b.getAttribute('aria-controls')).hidden = !on; });
  if (t.id === 'tab-search') loadPYQ();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); selectTab(n); }
  });
});

/* ---------- Hybrid AI: Firebase AI Logic (on-device Gemini Nano + cloud Gemini), or Chrome's Prompt API alone ---------- */
const AI = { fb: null, fbCloudFirst: null, deviceState: 'none', chrome: null, deviceInit: false };
async function detectAI() {
  try {
    if (self.LanguageModel && LanguageModel.availability) { AI.chrome = 'lm'; AI.deviceState = await LanguageModel.availability(); }
    else if (self.ai && self.ai.languageModel) { AI.chrome = 'legacy'; const c = await self.ai.languageModel.capabilities(); AI.deviceState = c.available === 'readily' ? 'available' : c.available; }
  } catch (e) { AI.deviceState = 'none'; }
  const cfg = self.PP_FIREBASE_CONFIG;
  if (cfg) {
    try {
      const V = '13.1.0';
      const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
      const { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-ai.js`);
      const app = initializeApp(cfg);
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      AI.fb = getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE });
      AI.fbCloudFirst = getGenerativeModel(ai, { mode: InferenceMode.PREFER_IN_CLOUD });
    } catch (e) { AI.fb = null; console.warn('Firebase AI Logic not loaded', e); }
  }
  renderAIStatus();
}
const deviceOK = () => ['available','downloadable','downloading','after-download'].includes(AI.deviceState);
const aiUsable = () => !!AI.fb || deviceOK();
function renderAIStatus() {
  const pill = $('#ai-status'), ws = $('#where-status');
  let t, on = true;
  if (AI.fb && deviceOK()) t = 'Hybrid AI: on device + cloud';
  else if (AI.fb) t = navigator.onLine ? 'AI: cloud (no on-device model here)' : 'Offline: cloud AI queued';
  else if (deviceOK()) t = 'AI: on device (Gemini Nano)';
  else { t = 'AI not available in this browser: verified keys only'; on = false; }
  pill.textContent = t; pill.classList.toggle('on', on);
  if (ws) ws.textContent = 'This browser: on-device model ' + (deviceOK() ? AI.deviceState : 'not available') + ' · cloud ' + (AI.fb ? (navigator.onLine ? 'ready' : 'offline (queued)') : 'not configured in this build') + '.';
}
addEventListener('online', () => { renderAIStatus(); drainQueue(); });
addEventListener('offline', renderAIStatus);

// returns { text, where: 'on_device' | 'in_cloud' }
async function aiRun(system, text, onChunk, preferCloud) {
  if (AI.fb) {
    const model = preferCloud ? AI.fbCloudFirst : AI.fb;
    if (!AI.deviceInit && model.initializeDeviceModel) { AI.deviceInit = true; try { model.initializeDeviceModel(() => {}); } catch (e) {} }
    const res = await model.generateContent(system + '\n\n' + text);
    const out = res.response.text(); onChunk && onChunk(out);
    return { text: out, where: res.response.inferenceSource || 'in_cloud' };
  }
  if (!deviceOK()) throw new Error('no AI available in this browser');
  let s;
  if (AI.chrome === 'lm') s = await LanguageModel.create({ initialPrompts: [{ role: 'system', content: system }], expectedOutputs: [{ type: 'text', languages: ['en'] }] });
  else s = await self.ai.languageModel.create({ systemPrompt: system });
  try {
    let acc = '';
    if (s.promptStreaming && onChunk) { for await (const ch of s.promptStreaming(text)) { acc = ch.startsWith(acc) ? ch : acc + ch; onChunk(acc); } }
    else { acc = await s.prompt(text); onChunk && onChunk(acc); }
    return { text: acc, where: 'on_device' };
  } finally { s.destroy && s.destroy(); }
}
const whereBadge = w => w === 'on_device' ? '<span class="badge dev">Ran on device · Gemini Nano</span>' : '<span class="badge cloud">Ran in cloud · Gemini via Firebase</span>';

/* ---------- Progress ---------- */
const blank = () => ({ level: 1, seen: [], answers: [], theme: {}, subj: '' });
let P = blank();
try { P = Object.assign(blank(), JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(P)); } catch (e) {} };
const tkey = q => q.subject + '|' + q.theme;
function themeWeight(subject, theme) {
  if (!PARETO) return 1;
  const t = PARETO.pareto[subject].themes.find(x => x.theme === theme);
  return t ? t.share : 2;
}
function pickNext() {
  const pool0 = MCQ.filter(q => !P.subj || q.subject === P.subj);
  const unseen = pool0.filter(q => !P.seen.includes(q.id));
  const pool = unseen.length ? unseen : pool0;
  let best = null, bestScore = -1;
  for (const q of pool) {
    const st = P.theme[tkey(q)] || { right: 0, wrong: 0 };
    const score = (themeWeight(q.subject, q.theme) * (1 + 1.5 * st.wrong)) / (1 + 3 * Math.abs(q.level - P.level)) + Math.random() * 0.5;
    if (score > bestScore) { bestScore = score; best = q; }
  }
  return best;
}
let cur = null, answered = false;
function render(q) {
  cur = q; answered = false;
  $('#q-level').textContent = 'Level ' + q.level;
  $('#q-theme').textContent = q.subject + ' · ' + q.theme;
  $('#q-asked').textContent = 'Theme asked in: ' + q.asked;
  $('#q-text').textContent = q.q;
  const ol = $('#q-opts'); ol.innerHTML = '';
  q.options.forEach((o, i) => {
    const li = document.createElement('li'); const b = document.createElement('button');
    b.type = 'button'; b.innerHTML = '<span class="k">' + 'abcd'[i] + ')</span><span>' + esc(o) + '</span>';
    b.addEventListener('click', () => answer(i)); li.appendChild(b); ol.appendChild(li);
  });
  $('#q-feedback').hidden = true; $('#btn-next').hidden = true; $('#btn-explain').hidden = true;
  const out = $('#ai-out'); out.hidden = true; out.textContent = '';
}
function answer(i) {
  if (answered) return; answered = true;
  const q = cur, ok = i === q.answer;
  [...document.querySelectorAll('#q-opts button')].forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
  const st = P.theme[tkey(q)] || (P.theme[tkey(q)] = { right: 0, wrong: 0 });
  ok ? st.right++ : st.wrong++;
  P.answers.push({ id: q.id, ok, level: q.level, t: Date.now() });
  if (!P.seen.includes(q.id)) P.seen.push(q.id);
  const before = P.level; if (ok) P.level = Math.min(6, P.level + 1);
  save();
  const fb = $('#q-feedback'); fb.hidden = false; fb.className = 'feedback ' + (ok ? 'ok' : 'no');
  fb.innerHTML = (ok ? '<strong>Right.</strong> ' + (before < 6 ? 'Up to level ' + P.level + '.' : 'Top level.') : '<strong>Not quite.</strong> Answer: ' + 'abcd'[q.answer] + '). You stay at level ' + P.level + '; this theme comes back sooner.')
    + (q.explain ? '<br>' + esc(q.explain) : '');
  $('#btn-next').hidden = false; $('#btn-next').focus();
  $('#btn-explain').hidden = !aiUsable();
  renderStats();
}
$('#btn-next').addEventListener('click', () => render(pickNext()));
$('#q-subj').addEventListener('change', e => { P.subj = e.target.value; save(); renderStats(); render(pickNext()); });
$('#btn-explain').addEventListener('click', async () => {
  const q = cur, out = $('#ai-out'); out.hidden = false;
  out.innerHTML = '<span class="lbl">AI explanation · unchecked, the key above is the ground truth</span><span class="where-b"></span><span class="ai-txt">Thinking…</span>';
  const sys = 'You are a concise UPSC ' + q.subject + ' tutor. The answer key you are given is verified and correct; never contradict it. Explain in at most 120 words, plain text, no markdown: why the correct option is right, why each other option is wrong, and one memory hook.';
  const prompt = 'Question: ' + q.q + '\nOptions: ' + q.options.map((o, i) => 'abcd'[i] + ') ' + o).join(' | ') + '\nVerified answer: ' + 'abcd'[q.answer] + ') ' + q.options[q.answer] + '\nVerified note: ' + q.explain;
  try { const r = await aiRun(sys, prompt, t => { out.querySelector('.ai-txt').textContent = t; }); out.querySelector('.where-b').innerHTML = whereBadge(r.where); }
  catch (e) { out.querySelector('.ai-txt').textContent = 'AI could not run here (' + e.message + '). The verified explanation above still stands.'; }
});
$('#btn-reset').addEventListener('click', () => { if (confirm('Reset your level and history on this device?')) { P = blank(); save(); $('#q-subj').value = ''; renderStats(); render(pickNext()); } });

function renderStats() {
  $('#k-level').textContent = P.level;
  const n = P.answers.length, r = P.answers.filter(a => a.ok).length;
  $('#k-acc').textContent = n ? Math.round(100 * r / n) + '%' : '–';
  const keys = [...new Map(MCQ.filter(q => !P.subj || q.subject === P.subj).map(q => [tkey(q), q])).values()];
  let wsum = 0, ready = 0;
  const ul = $('#theme-stats'); ul.innerHTML = '';
  keys.map(q => ({ q, w: themeWeight(q.subject, q.theme) })).sort((a, b) => b.w - a.w).forEach(({ q, w }) => {
    const st = P.theme[tkey(q)] || { right: 0, wrong: 0 }, tot = st.right + st.wrong, acc = tot ? st.right / tot : 0;
    wsum += w; ready += w * acc;
    const li = document.createElement('li');
    li.innerHTML = '<div class="tl-top"><span>' + esc(q.theme) + ' <span class="sub">' + q.subject.slice(0, 3) + '</span>' + (st.wrong > st.right ? ' <span class="weak">· weak</span>' : '') + '</span><span>' + w.toFixed(1) + '% · ' + (tot ? Math.round(acc * 100) + '%' : 'not tried') + '</span></div><div class="meter" aria-hidden="true"><span style="width:' + Math.round(acc * 100) + '%"></span></div>';
    ul.appendChild(li);
  });
  $('#k-ready').textContent = wsum ? Math.round(100 * ready / wsum) + '%' : '0%';
}

/* ---------- Pattern map ---------- */
function renderMap(subj) {
  const p = PARETO.pareto[subj];
  let k = 0; while (k < p.themes.length && p.themes[k].cum < 50) k++;
  const top = p.themes[k], n50 = k + 1, pct = top.cum;
  $('#headline').innerHTML = '<span class="big">' + n50 + ' of ' + p.themes.length + '</span> themes carry <span class="big">' + Math.round(pct) + '%</span> of ' + subj + ' marks'
    + '<svg viewBox="0 0 100 30" class="curve" role="img" aria-label="Cumulative share of marks by theme"><polyline fill="none" stroke="#2f8f5b" stroke-width="1.5" points="' + p.themes.map((t, i) => (i / (p.themes.length - 1) * 100).toFixed(1) + ',' + (30 - t.cum * 0.3).toFixed(1)).join(' ') + '"/><line x1="0" x2="100" y1="15" y2="15" stroke="#f2b705" stroke-dasharray="2 2" stroke-width=".8"/></svg>';
  $('#map-sub').textContent = p.n.toLocaleString('en-IN') + ' question parts, ' + Math.round(p.total_marks).toLocaleString('en-IN') + ' marks, IFoS + CSE Mains ' + PARETO.meta.years.join('–') + '. Gold bars: the themes that together carry the first half of the marks.';
  const max = p.themes[0].share, ol = $('#bars'); ol.innerHTML = '';
  p.themes.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="name">' + esc(t.theme) + '</span><span class="num">' + t.share.toFixed(1) + '% · ' + t.n + ' Qs · ' + t.years + ' yrs</span>'
      + '<div class="track' + (i <= k ? ' pareto' : '') + '" role="img" aria-label="' + t.share.toFixed(1) + ' percent of marks"><span style="width:' + Math.max(2, 100 * t.share / max) + '%"></span></div>'
      + (t.top.length ? '<details><summary>Most repeated sub-topics</summary><ul>' + t.top.map(s => '<li>' + esc(s.s) + ': asked in ' + s.years + ' different years, last ' + s.last + '</li>').join('') + '</ul></details>' : '');
    ol.appendChild(li);
  });
}
function renderCoverage() {
  const c = PARETO.coverage, yrs = Object.keys(Object.values(c)[0].years);
  const tb = $('#cov');
  tb.innerHTML += '<thead><tr><th scope="col">Paper</th>' + yrs.map(y => '<th scope="col">' + y.slice(2) + '</th>').join('') + '</tr></thead><tbody>' +
    Object.entries(c).map(([k, v]) => '<tr><th scope="row">' + esc(k) + '</th>' + yrs.map(y => '<td class="' + (v.years[y] ? 'have' : 'gap') + '" title="' + k + ' ' + y + ': ' + v.years[y] + ' parts">' + (v.years[y] || '–') + '</td>').join('') + '</tr>').join('') + '</tbody>';
  $('#cov-notes').innerHTML = PARETO.notes.map(n => '<li>' + esc(n) + '</li>').join('');
}
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.seg button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
  renderMap(b.dataset.subj);
}));

/* ---------- PYQ search + answer writing ---------- */
async function loadPYQ() {
  if (PYQ) return; $('#s-count').textContent = 'Loading the question bank…';
  PYQ = await (await fetch('data/pyq.json')).json(); doSearch();
}
const STOP = new Set('the a an of and or in on to for with by is are be as at from its their what how why which explain discuss describe give write short notes note role importance brief briefly about between into this that these those suitable examples example significance present various different also used using give account comment mention'.split(' '));
function keyTerms(text, theme, sub) {
  const words = (text + ' ' + sub).toLowerCase().match(/[a-z][a-z-]{3,}/g) || [];
  return [...new Set(words.filter(w => !STOP.has(w)))].slice(0, 12);
}
function localCheck(r, ans) {
  const marks = r[5], target = Math.round(marks * 15), wc = (ans.trim().match(/\S+/g) || []).length;
  const terms = keyTerms(r[6], r[7], r[8]), low = ans.toLowerCase(), hit = terms.filter(t => low.includes(t));
  const lenMsg = wc < target * 0.6 ? 'short' : wc > target * 1.25 ? 'long' : 'on target';
  return '<span class="badge dev">Checked on device · no AI</span>'
    + '<p>Words: <strong>' + wc + '</strong> (aim about ' + target + ' for ' + marks + ' marks: ' + lenMsg + '). Key terms from the question used: <strong>' + hit.length + ' of ' + terms.length + '</strong>' + (terms.length - hit.length ? ' · missing: ' + terms.filter(t => !hit.includes(t)).slice(0, 6).map(esc).join(', ') : '') + '.</p>';
}
const loadQ = () => { try { return JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch (e) { return []; } };
const saveQ = q => { try { localStorage.setItem(QUEUE, JSON.stringify(q)); } catch (e) {} };
async function aiGrade(r, ans) {
  const sys = 'You are a strict UPSC Mains examiner for ' + r[1] + '. Grade the candidate answer out of ' + r[5] + ' marks. Plain text, under 150 words: the mark, two strengths, three specific gaps (missing points, examples, diagram), and one line on structure. Do not invent facts; if unsure say "check".';
  return aiRun(sys, 'Question (' + r[0] + ' ' + r[3] + ', ' + r[5] + ' marks): ' + r[6] + '\n\nCandidate answer:\n' + ans, null, true);
}
async function drainQueue() {
  if (!AI.fb || !navigator.onLine) return;
  const q = loadQ(); if (!q.length) return;
  const rest = [];
  for (const item of q) {
    try { const res = await aiGrade(item.r, item.ans); const box = document.querySelector('[data-grade="' + item.id + '"]'); if (box) box.innerHTML = whereBadge(res.where) + '<p class="pre">' + esc(res.text) + '</p>'; }
    catch (e) { rest.push(item); }
  }
  saveQ(rest);
}
function doSearch() {
  if (!PYQ) return;
  const q = $('#s-q').value.trim().toLowerCase(), subj = $('#s-subj').value, exam = $('#s-exam').value;
  const words = q.split(/\s+/).filter(Boolean);
  const hits = PYQ.filter(r => (!subj || r[1] === subj) && (!exam || r[0] === exam) && words.every(w => (r[6] + ' ' + r[7] + ' ' + r[8]).toLowerCase().includes(w))).sort((a, b) => b[3] - a[3]);
  $('#s-count').textContent = hits.length.toLocaleString('en-IN') + ' question part' + (hits.length === 1 ? '' : 's') + (hits.length > 40 ? ', newest 40 shown' : '') + (words.length ? '' : ' (type to filter)');
  const ul = $('#s-results'); ul.innerHTML = '';
  const re = words.length ? new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi') : null;
  hits.slice(0, 40).forEach((r, idx) => {
    const li = document.createElement('li'), txt = esc(r[6]);
    li.innerHTML = '<div class="meta"><strong>' + r[0] + ' ' + r[3] + '</strong><span>' + r[1] + ' Paper ' + esc(r[2]) + ', Q' + esc(r[4]) + '</span><span>' + r[5] + ' marks</span><span>' + esc(r[7]) + '</span>' + (r[9] ? '<span class="flag">reconstructed topic</span>' : '') + '</div><p class="txt">' + (re ? txt.replace(re, '<mark>$1</mark>') : txt) + '</p>';
    const row = document.createElement('div'); row.className = 'row-btns';
    const id = r[0] + r[3] + r[1] + r[2] + r[4];
    const wb = document.createElement('button'); wb.className = 'btn ghost small'; wb.type = 'button'; wb.textContent = 'Write & check an answer';
    const panel = document.createElement('div'); panel.className = 'write'; panel.hidden = true;
    panel.innerHTML = '<label class="sr" for="w-' + idx + '">Your answer</label><textarea id="w-' + idx + '" rows="6" placeholder="Write your answer as in the exam hall…"></textarea><button class="btn small" type="button">Check it</button><div class="grade-local"></div><div class="grade-ai" data-grade="' + esc(id) + '"></div>';
    wb.addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) panel.querySelector('textarea').focus(); });
    panel.querySelector('button').addEventListener('click', async () => {
      const ans = panel.querySelector('textarea').value; if (!ans.trim()) return;
      panel.querySelector('.grade-local').innerHTML = localCheck(r, ans);
      const box = panel.querySelector('.grade-ai');
      if (!aiUsable()) { box.innerHTML = '<p class="hint">AI feedback needs Chrome with Gemini Nano or the cloud build.</p>'; return; }
      if (AI.fb && !navigator.onLine && !deviceOK()) { const qq = loadQ(); qq.push({ id, r, ans }); saveQ(qq); box.innerHTML = '<span class="badge cloud">Queued for cloud grading</span><p class="hint">You are offline. It will grade as soon as you reconnect.</p>'; return; }
      box.innerHTML = '<p class="hint">Grading…</p>';
      try { const res = await aiGrade(r, ans); box.innerHTML = whereBadge(res.where) + '<p class="pre">' + esc(res.text) + '</p>'; }
      catch (e) { box.innerHTML = '<p class="hint">AI could not grade here (' + esc(e.message) + ').</p>'; }
    });
    row.appendChild(wb);
    if (aiUsable()) {
      const b = document.createElement('button'); b.className = 'btn ghost small'; b.type = 'button'; b.textContent = 'Outline an answer (AI)';
      const out = document.createElement('div'); out.className = 'ai-out'; out.hidden = true;
      b.addEventListener('click', async () => {
        out.hidden = false; out.innerHTML = '<span class="lbl">AI outline · unchecked, verify facts before using</span><span class="where-b"></span><span class="t">Thinking…</span>';
        const sys = 'You are a UPSC Mains Botany and Agriculture examiner. Give a plain-text answer outline (no markdown): a one-line intro, 5 to 7 key points with Indian examples where natural, a suggested diagram, a one-line conclusion. Stay within about ' + Math.round(r[5] * 15) + ' words. If unsure of a fact, say "check".';
        try { const res = await aiRun(sys, r[0] + ' ' + r[3] + ' ' + r[1] + ' Paper ' + r[2] + ', ' + r[5] + ' marks: ' + r[6], t => { out.querySelector('.t').textContent = t; }); out.querySelector('.where-b').innerHTML = whereBadge(res.where); }
        catch (e) { out.querySelector('.t').textContent = 'AI could not run here (' + e.message + ').'; }
      });
      row.appendChild(b); li.appendChild(row); li.appendChild(out);
    } else li.appendChild(row);
    li.appendChild(panel);
    ul.appendChild(li);
  });
}
let tmr; $('#s-q').addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(doSearch, 180); });
$('#s-subj').addEventListener('change', doSearch); $('#s-exam').addEventListener('change', doSearch);
$('#search-form').addEventListener('submit', e => { e.preventDefault(); doSearch(); });

/* ---------- Boot ---------- */
(async () => {
  const aiReady = detectAI();
  [MCQ, PARETO] = await Promise.all([fetch('data/mcq.json').then(r => r.json()), fetch('data/pareto.json').then(r => r.json())]);
  $('#q-subj').value = P.subj || '';
  renderMap('Botany'); renderCoverage(); renderStats(); render(pickNext());
  await aiReady; if (cur) $('#btn-explain').hidden = !(answered && aiUsable());
  drainQueue();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
