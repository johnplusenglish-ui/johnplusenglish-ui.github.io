#!/usr/bin/env node
/**
 * build-c1-manifest.mjs — generate c1-item-manifest.json for the analytics dashboard.
 *
 * Walks the auto-scored C1 items (Use of English Parts 1-4, Reading Parts 5-8) and
 * records, for each one, the counter key (matching item-analytics.js), its type, how
 * to score it, and a human label. Run after editing exam content:
 *
 *   node tools/build-c1-manifest.mjs
 *
 * The dashboard (c1-insights.html) reads this manifest, fetches the abacus counters for
 * each key, and flags high-miss (mis-keyed / too hard) and ambiguous (rival wrong option)
 * items. Key scheme MUST stay in sync with item-analytics.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
function arrayLiteral(src, name) {
  const i = src.indexOf('const ' + name); const b = src.indexOf('[', i); let d = 0;
  for (let j = b; j < src.length; j++) { if (src[j] === '[') d++; else if (src[j] === ']') { d--; if (d === 0) return src.slice(b, j + 1); } }
  throw new Error('unbalanced ' + name);
}
const P = (l, f) => `${l}/${f}`;
const evalArr = (src, name) => Function('P', 'return (' + arrayLiteral(src, name) + ');')(P);
const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, "'").replace(/\s+/g, ' ').trim();
const optText = (o) => clean(o).replace(/^[A-D]\s+/, '');
const L = (c) => c.charCodeAt(0) - 65;

const items = [];
const mc = (key, correctIdx, nOpts, label, correct) => items.push({ key, type: 'mc', correctIdx, nOpts, label, correct });
const typed = (key, label, answer) => items.push({ key, type: 'typed', label, answer });

/* ---- Use of English ---- */
const U = read('uoe-c1-content.html');
evalArr(U, 'TESTS').forEach((set, si) => set.gaps.forEach((g) =>
  mc(`uoe_p1_${si}_${g.num}`, g.correct, g.options.length, `UoE P1 · ${set.title} · gap ${g.num}`, optText(g.options[g.correct]))));
evalArr(U, 'OC_TESTS').forEach((set, si) => set.gaps.forEach((g) =>
  typed(`uoe_p2_${si}_${g.num}`, `UoE P2 · ${set.title} · gap ${g.num}`, g.answer)));
evalArr(U, 'WF_TESTS').forEach((set, si) => set.gaps.forEach((g) =>
  typed(`uoe_p3_${si}_${g.num}`, `UoE P3 · ${set.title} · gap ${g.num} (${g.prompt})`, g.answer)));
evalArr(U, 'KWT_TESTS').forEach((set, si) => set.items.forEach((it, i) =>
  typed(`uoe_p4_${si}_${i + 1}`, `UoE P4 · set ${si + 1} · item ${i + 1} (${it.key})`, it.answer)));

/* ---- Reading ---- */
const R = read('c1-reading-test-content.html');
evalArr(R, 'TESTS').forEach((t, ti) => {
  const test = `Test ${ti + 1}`;
  t.P5.questions.forEach((q, qi) =>
    mc(`rd_p5_${ti}_${qi + 1}`, q.correct, q.opts.length, `Reading P5 · ${test} · Q${qi + 1}`, optText(q.opts[q.correct])));
  t.P6.questions.forEach((q, qi) =>
    mc(`rd_p6_${ti}_${qi + 1}`, L(q.correct), t.P6.texts.length, `Reading P6 · ${test} · Q${qi + 1}`, q.correct));
  Object.keys(t.P7.correct).forEach((n) =>
    mc(`rd_p7_${ti}_${n}`, L(t.P7.correct[n]), t.P7.options.length, `Reading P7 · ${test} · gap ${n}`, t.P7.correct[n]));
  t.P8.questions.forEach((q, qi) =>
    mc(`rd_p8_${ti}_${qi + 1}`, L(q.correct), t.P8.texts.length, `Reading P8 · ${test} · Q${qi + 1}`, q.correct));
});

const out = { generated: 'run `node tools/build-c1-manifest.mjs` to refresh', count: items.length, items };
fs.writeFileSync(path.join(ROOT, 'c1-item-manifest.json'), JSON.stringify(out));
console.log(`Wrote c1-item-manifest.json with ${items.length} items (${items.filter((i) => i.type === 'mc').length} MC, ${items.filter((i) => i.type === 'typed').length} typed).`);
