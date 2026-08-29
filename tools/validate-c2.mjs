#!/usr/bin/env node
/**
 * validate-c2.mjs - structural + content invariants for the C2 Proficiency (CPE) exam pages.
 *
 * Run:  node tools/validate-c2.mjs        (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN-level issues never fail the build.
 *
 * C2 Proficiency format (confirmed against the official Cambridge C2 Proficiency 2020 sample
 * papers). Do NOT copy C1/B2 assumptions - C2 differs:
 *  - Reading & Use of English Part 4 (KWT) answers are THREE to EIGHT words (not 3-6 like C1).
 *  - Reading has THREE parts (5, 6, 7): Part 6 is a GAPPED TEXT with SEVEN paragraphs removed
 *    (8 paragraph options, one unused); Part 7 is 10-question multiple matching against sections
 *    A-E, and sections MAY be reused, so keyed letters are NOT required to be unique. There is no
 *    C1-style cross-text Part 6 or a Part 8.
 *  - Writing Part 1 is a compulsory essay of 240-280 words summarising/evaluating TWO input texts;
 *    Part 2 (article / letter / report / review) is 280-320 words.
 *  - Speaking has THREE parts (interview / collaborative picture task / long turn + discussion).
 *
 * To extend: add a check inside the relevant section. Keep ERROR for "this is wrong / unfair to a
 * student"; use WARN for "worth a look but not a hard failure".
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];
const add = (level, file, msg) => findings.push({ level, file, msg });
const ERR = (f, m) => add('ERROR', f, m);
const WARN = (f, m) => add('WARN', f, m);
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function arrayLiteral(src, name) {
  const i = src.indexOf('const ' + name);
  if (i < 0) throw new Error(`array "${name}" not found`);
  const b = src.indexOf('[', i);
  let depth = 0;
  for (let j = b; j < src.length; j++) {
    if (src[j] === '[') depth++;
    else if (src[j] === ']') { depth--; if (depth === 0) return src.slice(b, j + 1); }
  }
  throw new Error(`array "${name}" is unbalanced`);
}
const P = (level, file) => `images/${level}/${file}`;
function evalArray(src, name) {
  // eslint-disable-next-line no-new-func
  return Function('P', 'return (' + arrayLiteral(src, name) + ');')(P);
}

// Cambridge counts a contraction as its full expanded form (didn't = two words).
const expandContractions = (s) => s.replace(/n't\b/gi, ' not');
const words = (s) => expandContractions(s).trim().split(/\s+/).filter(Boolean);
const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');

function dashScan(file, src) {
  if (/—|&mdash;/.test(src)) ERR(file, 'contains an em dash (— or &mdash;)');
  if (/ – | &ndash; /.test(src)) ERR(file, 'contains a spaced en dash used as punctuation');
}
const LETTERS = 'ABCDEFGH';

/* --------------------------------------------------------------- Use of English (Parts 1-4) */
function checkUoE() {
  const F = 'uoe-c2-content.html';
  const src = read(F);
  dashScan(F, src);
  const T = evalArray(src, 'TESTS');
  const OC = evalArray(src, 'OC_TESTS');
  const WF = evalArray(src, 'WF_TESTS');
  const KWT = evalArray(src, 'KWT_TESTS');
  const joinText = (t) => Array.isArray(t) ? t.join('') : t;
  const placeholders = (t) => { const s = joinText(t); return Array.from({ length: 8 }, (_, k) => s.includes('{' + (k + 1) + '}')); };

  if (T.length !== 20) ERR(F, `Part 1 has ${T.length} sets, expected 20`);
  T.forEach((s, i) => {
    const tag = `Part 1 "${s.title}" (set ${i + 1})`;
    if (s.gaps.length !== 8) ERR(F, `${tag}: ${s.gaps.length} gaps, expected 8`);
    placeholders(s.text).forEach((present, k) => { if (!present) ERR(F, `${tag}: missing {${k + 1}} in text`); });
    s.gaps.forEach((g) => {
      if (!Array.isArray(g.options) || g.options.length !== 4) ERR(F, `${tag} gap ${g.num}: needs 4 options`);
      if (!(g.correct >= 0 && g.correct < g.options.length)) ERR(F, `${tag} gap ${g.num}: correct index out of range`);
    });
  });

  if (OC.length !== 20) ERR(F, `Part 2 has ${OC.length} sets, expected 20`);
  OC.forEach((s, i) => {
    const tag = `Part 2 "${s.title}" (set ${i + 1})`;
    if (s.gaps.length !== 8) ERR(F, `${tag}: ${s.gaps.length} gaps, expected 8`);
    placeholders(s.text).forEach((present, k) => { if (!present) ERR(F, `${tag}: missing {${k + 1}} in text`); });
    s.gaps.forEach((g) => { if (!g.answer || /\s/.test(g.answer.trim())) ERR(F, `${tag} gap ${g.num}: open-cloze answer must be a single word ("${g.answer}")`); });
  });

  if (WF.length !== 20) ERR(F, `Part 3 has ${WF.length} sets, expected 20`);
  const wfSeen = new Map();
  WF.forEach((s, i) => {
    const tag = `Part 3 "${s.title}" (set ${i + 1})`;
    if (s.gaps.length !== 8) ERR(F, `${tag}: ${s.gaps.length} gaps, expected 8`);
    s.gaps.forEach((g) => {
      if (!g.prompt || g.prompt !== g.prompt.toUpperCase()) WARN(F, `${tag} gap ${g.num}: stem "${g.prompt}" should be all caps`);
      if (!g.answer) ERR(F, `${tag} gap ${g.num}: missing answer`);
      const a = (g.answer || '').toLowerCase();
      if (a) (wfSeen.get(a) || wfSeen.set(a, []).get(a)).push(i + 1);
    });
  });
  // C2's bank is large and rotated one test at a time, and every reused item is individually
  // correct, so a repeated word-formation answer is a diversity nudge (WARN), not a hard failure.
  for (const [ans, sets] of wfSeen) if (sets.length > 1) WARN(F, `Part 3 answer "${ans}" reused across sets ${sets.join(', ')} (consider diversifying)`);

  if (KWT.length !== 20) ERR(F, `Part 4 has ${KWT.length} sets, expected 20`);
  KWT.forEach((s, i) => {
    const tag = `Part 4 (set ${i + 1})`;
    if (s.items.length !== 6) ERR(F, `${tag}: ${s.items.length} items, expected 6`);
    s.items.forEach((it, k) => {
      const n = words(it.answer).length;
      if (n < 3 || n > 8) ERR(F, `${tag} item ${k + 1} (${it.key}): answer "${it.answer}" is ${n} words, must be 3-8`);
      const key = (it.key || '').toLowerCase();
      const has = (a) => expandContractions((a || '').toLowerCase()).split(/\s+/).includes(key);
      if (key && !has(it.answer)) ERR(F, `${tag} item ${k + 1}: answer "${it.answer}" does not contain the key word "${it.key}"`);
      (it.alts || []).forEach((a) => {
        const an = words(a).length;
        if (an < 3 || an > 8) ERR(F, `${tag} item ${k + 1}: alt "${a}" is ${an} words, must be 3-8`);
        if (key && !has(a)) ERR(F, `${tag} item ${k + 1}: alt "${a}" does not contain the key word "${it.key}"`);
      });
    });
  });
}

/* --------------------------------------------------------------- Reading (Parts 5-7) */
function checkReading() {
  const F = 'c2-reading-test-content.html';
  const src = read(F);
  dashScan(F, src);
  const TESTS = evalArray(src, 'TESTS');
  if (TESTS.length !== 5) WARN(F, `Reading has ${TESTS.length} tests (expected 5)`);
  const L = (c) => c;
  TESTS.forEach((t, ti) => {
    const tag = `Test ${ti + 1}`;
    // Part 5: 6 four-option MC
    if (t.P5.questions.length !== 6) ERR(F, `${tag} Part 5: ${t.P5.questions.length} questions, expected 6`);
    t.P5.questions.forEach((q, k) => {
      if (!Array.isArray(q.opts) || q.opts.length !== 4) ERR(F, `${tag} Part 5 Q${k + 1}: needs 4 options`);
      if (!(q.correct >= 0 && q.correct < (q.opts || []).length)) ERR(F, `${tag} Part 5 Q${k + 1}: correct index out of range`);
    });
    // Part 6: gapped text, 8 paragraph options, 7 gaps keyed (distinct), 1 unused
    if (t.P6.options.length !== 8) ERR(F, `${tag} Part 6: ${t.P6.options.length} options, expected 8`);
    const p6 = Object.values(t.P6.correct);
    if (p6.length !== 7) ERR(F, `${tag} Part 6: ${p6.length} gaps keyed, expected 7`);
    p6.forEach((c) => { if (!LETTERS.slice(0, 8).includes(c)) ERR(F, `${tag} Part 6: bad option letter "${c}"`); });
    if (new Set(p6).size !== p6.length) ERR(F, `${tag} Part 6: keyed paragraphs not unique (${p6.join(',')})`);
    // Part 7: multiple matching, 10 questions, sections A-E reusable (no uniqueness needed)
    if (t.P7.questions.length !== 10) ERR(F, `${tag} Part 7: ${t.P7.questions.length} questions, expected 10`);
    const nSec = (t.P7.sections || []).length;
    t.P7.questions.forEach((q, k) => {
      const c = q.correct;
      if (!(typeof c === 'string' && c.length === 1 && LETTERS.indexOf(c) >= 0 && LETTERS.indexOf(c) < nSec)) ERR(F, `${tag} Part 7 Q${k + 1}: bad section letter "${c}"`);
    });
  });
}

/* --------------------------------------------------------------- Writing */
function checkWriting() {
  const F = 'c2-writing-content.html';
  const src = read(F);
  dashScan(F, src);
  // Each model's stated "Word count: N" must sit in a C2 band and match the real (stripped) count.
  // Part 1 essay = 240-280, Part 2 = 280-320; accept the union 240-320 as the ERROR bound and
  // flag anything outside it (which part a model is can't be inferred structurally here).
  const modelRe = /model:\s*`([\s\S]*?)`,\s*\n?\s*note:\s*"Word count:\s*(\d+)/g;
  let m, n = 0;
  while ((m = modelRe.exec(src)) !== null) {
    n++;
    const real = words(stripTags(m[1])).length;
    const stated = Number(m[2]);
    if (real < 240 || real > 320) ERR(F, `A model answer is ${real} words (label ${stated}); C2 range is 240-320`);
    else if (Math.abs(real - stated) > 5) WARN(F, `A model answer's label says ${stated} but it is really ${real} words`);
  }
  if (n < 2) WARN(F, `only ${n} model answers found`);
}

/* --------------------------------------------------------------- Speaking */
function checkSpeaking() {
  const F = 'c2-speaking-content.html';
  const src = read(F);
  dashScan(F, src);
  const Q1 = evalArray(src, 'P1_QUESTIONS');
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const seen = new Map();
  Q1.forEach((q) => { const k = norm(q.question); if (seen.has(k)) ERR(F, `Part 1 duplicate question: "${q.question}"`); else seen.set(k, true); });
  // C2 Speaking has THREE parts - guard against text claiming four.
  if (/\bfour parts\b/i.test(src) || /\bpart\s*4\b/i.test(src)) WARN(F, 'Speaking text mentions a Part 4 / four parts - C2 Speaking has only three parts');
}

/* --------------------------------------------------------------- run */
const suites = [
  ['Use of English', checkUoE],
  ['Reading', checkReading],
  ['Writing', checkWriting],
  ['Speaking', checkSpeaking],
];
for (const [name, fn] of suites) {
  try { fn(); } catch (e) { ERR(name, `check crashed: ${e.message}`); }
}

const errors = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');
const line = (f) => `  ${f.level === 'ERROR' ? '✗' : '!'} [${f.file}] ${f.msg}`;
if (errors.length) { console.log('\nERRORS:'); errors.forEach((f) => console.log(line(f))); }
if (warns.length) { console.log('\nWARNINGS:'); warns.forEach((f) => console.log(line(f))); }
if (!findings.length) console.log('All C2 checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
