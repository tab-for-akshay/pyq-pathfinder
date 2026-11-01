const test = require('node:test'); const assert = require('node:assert'); const fs = require('node:fs'); const path = require('node:path');
const S = path.join(__dirname, '..', 'site'); const html = fs.readFileSync(path.join(S, 'index.html'), 'utf8');
test('page basics', () => {
  assert.match(html, /<title>PYQ Pathfinder/); assert.match(html, /name="viewport" content="width=device-width/);
  assert.match(html, /Built by Tab \(AI assistant\) for Akshay Wagh/);
  for (const ref of [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1])) assert.ok(fs.existsSync(path.join(S, ref)), 'missing ' + ref);
  assert.doesNotMatch(html, /TODO|lorem|XXX/i);
});
const P_ = JSON.parse(fs.readFileSync(path.join(S, 'data/pareto.json'))); const p_themes = q => P_.pareto[q.subject].themes.some(t => t.theme === q.theme);
test('data integrity', () => {
  const mcq = JSON.parse(fs.readFileSync(path.join(S, 'data/mcq.json')));
  assert.ok(mcq.length >= 50); assert.ok(mcq.some(q => q.subject === 'Agriculture')); for (const q of mcq) { assert.ok(q.subject && q.theme && q.asked); assert.ok(p_themes(q)); }
  for (const q of mcq) { assert.equal(q.options.length, 4); q.options.forEach(o => assert.ok(o.length > 0, q.id)); assert.ok(q.answer >= 0 && q.answer < 4); assert.ok(q.level >= 1 && q.level <= 6); }
  const p = JSON.parse(fs.readFileSync(path.join(S, 'data/pareto.json')));
  assert.equal(p.meta.rows, 5794);
  for (const s of ['Botany', 'Agriculture']) { const sum = p.pareto[s].themes.reduce((a, t) => a + t.share, 0); assert.ok(Math.abs(sum - 100) < 0.5, s + ' shares ' + sum); }
  const pyq = JSON.parse(fs.readFileSync(path.join(S, 'data/pyq.json'))); assert.equal(pyq.length, 5794);
});
test('service worker caches every core file', () => {
  const sw = fs.readFileSync(path.join(S, 'sw.js'), 'utf8');
  for (const f of ['index.html', 'styles.css', 'script.js', 'data/mcq.json', 'data/pareto.json', 'data/pyq.json']) { assert.ok(sw.includes(f)); assert.ok(fs.existsSync(path.join(S, f))); }
});
test('coverage and gaps are published', () => {
  const p = JSON.parse(fs.readFileSync(path.join(S, 'data/pareto.json')));
  assert.deepEqual(p.coverage['IFoS Agriculture'].gaps, [2003, 2007, 2008]); assert.ok(p.notes.length >= 2);
  assert.match(html, /Where the AI runs/); assert.match(html, /firebase-config\.js/);
});
