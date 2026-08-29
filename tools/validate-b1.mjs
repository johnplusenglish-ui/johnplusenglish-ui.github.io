#!/usr/bin/env node
/**
 * validate-b1.mjs - structural + content invariants for the B1 Preliminary exam pages.
 *
 * Run:  node tools/validate-b1.mjs        (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN-level issues never fail the build.
 *
 * B1 Preliminary (PET) format differs from B2 First / C1 Advanced (confirmed against the official
 * Cambridge B1 Preliminary 2022 sample papers) - do NOT copy higher-level assumptions here:
 *  - Reading has SIX parts: P1 = 5 signs/notices (3-option MC), P2 = match 5 people to 8 short
 *    texts (letters A-H, three unused), P3 = 5 four-option MC on one long text, P4 = 5 sentences
 *    removed from a text with 8 options (three unused), P5 = 6 four-option MC cloze (vocabulary),
 *    P6 = 6 open-cloze gaps (one word each, the mark scheme may accept alternatives).
 *  - Writing has TWO tasks: Part 1 a compulsory email reply (~100 words) responding to a friend's
 *    email and notes; Part 2 a choice of an ARTICLE or a STORY (~100 words). No essay/report/
 *    review/letter/transformation (those are higher levels). Target is ~100 words, not 140-190.
 *  - Speaking Part 2 is a solo DESCRIBE-one-photograph long turn (not comparing two photos - that
 *    is B2); Part 3 is a collaborative discussion of a situation with picture prompts; Part 4 is a
 *    related discussion. Everything is intermediate, simple, personal language.
 *  - There is no Use of English paper at B1; the site's "grammar" page is a supplementary
 *    resource and is not validated for exam structure here (only the dash check applies to it).
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

/** Pull the balanced [...] array literal that follows `const NAME =` (top-level, first match). */
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
// Some literals reference the P() image-path helper; stub it so eval works on data only.
const P = (level, file) => `images/${level}/${file}`;
function evalArray(src, name) {
  // eslint-disable-next-line no-new-func
  return Function('P', 'return (' + arrayLiteral(src, name) + ');')(P);
}

const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/** Em dash and spaced en dash are banned. Unspaced en dash inside a number range is allowed. */
function dashScan(file, src) {
  if (/—|&mdash;/.test(src)) ERR(file, 'contains an em dash (— or &mdash;)');
  if (/ – | &ndash; /.test(src)) ERR(file, 'contains a spaced en dash used as punctuation');
}

const LETTERS = 'ABCDEFGH';

/* ------------------------------------------------------------------ Reading (Parts 1-6) */
function checkReading() {
  const F = 'b1-reading-test-content.html';
  const src = read(F);
  dashScan(F, src);
  const TESTS = evalArray(src, 'TESTS');   // Parts 1-4
  const T5 = evalArray(src, 'TESTS5');     // Part 5 (MC cloze)
  const T6 = evalArray(src, 'TESTS6');     // Part 6 (open cloze)

  if (TESTS.length !== 5) WARN(F, `Reading has ${TESTS.length} tests (expected 5)`);
  TESTS.forEach((t, ti) => {
    const tag = `Test ${ti + 1}`;
    // Part 1: 5 signs, 3 options each
    if (!Array.isArray(t.P1) || t.P1.length !== 5) ERR(F, `${tag} Part 1: ${t.P1 && t.P1.length} items, expected 5`);
    (t.P1 || []).forEach((it, k) => {
      if (!Array.isArray(it.opts) || it.opts.length !== 3) ERR(F, `${tag} Part 1 Q${k + 1}: needs 3 options`);
      if (!(it.correct >= 0 && it.correct < (it.opts || []).length)) ERR(F, `${tag} Part 1 Q${k + 1}: correct index out of range`);
    });
    // Part 2: 8 texts, 5 people, unique letter matches
    if (t.P2.texts.length !== 8) ERR(F, `${tag} Part 2: ${t.P2.texts.length} texts, expected 8`);
    if (t.P2.questions.length !== 5) ERR(F, `${tag} Part 2: ${t.P2.questions.length} people, expected 5`);
    const p2keys = t.P2.questions.map((q) => q.correct);
    p2keys.forEach((c, k) => { if (!LETTERS.slice(0, 8).includes(c)) ERR(F, `${tag} Part 2 person ${k + 1}: bad match letter "${c}"`); });
    if (new Set(p2keys).size !== p2keys.length) ERR(F, `${tag} Part 2: matched letters not unique (${p2keys.join(',')})`);
    // Part 3: 5 four-option MC
    if (t.P3.questions.length !== 5) ERR(F, `${tag} Part 3: ${t.P3.questions.length} questions, expected 5`);
    t.P3.questions.forEach((q, k) => {
      if (!Array.isArray(q.opts) || q.opts.length !== 4) ERR(F, `${tag} Part 3 Q${k + 1}: needs 4 options`);
      if (!(q.correct >= 0 && q.correct < (q.opts || []).length)) ERR(F, `${tag} Part 3 Q${k + 1}: correct index out of range`);
    });
    // Part 4: 8 options, 5 gaps keyed, 3 unused
    if (t.P4.options.length !== 8) ERR(F, `${tag} Part 4: ${t.P4.options.length} options, expected 8`);
    const p4vals = Object.values(t.P4.correct);
    if (p4vals.length !== 5) ERR(F, `${tag} Part 4: ${p4vals.length} gaps keyed, expected 5`);
    p4vals.forEach((c) => { if (!LETTERS.slice(0, 8).includes(c)) ERR(F, `${tag} Part 4: bad option letter "${c}"`); });
    if (new Set(p4vals).size !== p4vals.length) ERR(F, `${tag} Part 4: keyed letters not unique (${p4vals.join(',')})`);
  });

  const clozeSuite = (arr, name, part) => {
    if (arr.length !== 5) WARN(F, `${name} has ${arr.length} tests (expected 5)`);
    arr.forEach((t, ti) => {
      const tag = `Test ${ti + 1} ${part}`;
      if (!Array.isArray(t.blanks) || t.blanks.length !== 6) ERR(F, `${tag}: ${t.blanks && t.blanks.length} gaps, expected 6`);
      (t.blanks || []).forEach((b, k) => {
        if (part === 'Part 5') {
          if (!Array.isArray(b.opts) || b.opts.length !== 4) ERR(F, `${tag} gap ${k + 1}: needs 4 options`);
          if (!(b.correct >= 0 && b.correct < (b.opts || []).length)) ERR(F, `${tag} gap ${k + 1}: correct index out of range`);
        } else {
          if (!Array.isArray(b.correct) || b.correct.length === 0) ERR(F, `${tag} gap ${k + 1}: needs a non-empty accepted-answer array`);
          (b.correct || []).forEach((w) => { if (/\s/.test((w || '').trim())) ERR(F, `${tag} gap ${k + 1}: open-cloze answer "${w}" must be a single word`); });
        }
      });
    });
  };
  clozeSuite(T5, 'TESTS5', 'Part 5');
  clozeSuite(T6, 'TESTS6', 'Part 6');
}

/* ------------------------------------------------------------------ Speaking (Parts 1-4) */
function checkSpeaking() {
  const F = 'b1-speaking-content.html';
  const src = read(F);
  dashScan(F, src);
  const Q1 = evalArray(src, 'P1_QUESTIONS');
  const P3 = evalArray(src, 'PART3_TOPICS');
  const P4 = evalArray(src, 'PART4_TOPICS');

  // Part 1: personal questions, no exact duplicates
  const seen = new Map();
  Q1.forEach((q) => { const k = norm(q.question); if (seen.has(k)) ERR(F, `Part 1 duplicate question: "${q.question}"`); else seen.set(k, true); });
  // Part 2 must be describe-ONE-photo, never "compare" (that is B2). Guard against B2 language.
  if (/compare the (two )?photograph/i.test(src)) ERR(F, 'Speaking text mentions comparing photographs - B1 Part 2 is describing ONE photo, not comparing two');

  // Part 3 topics each carry picture-prompt options
  P3.forEach((t, i) => { if (!Array.isArray(t.options) || t.options.length < 2) WARN(F, `Part 3 topic ${i + 1} ("${t.topic}") has too few options`); });
  // Part 4 topics should map onto Part 3 topics
  const p3topics = new Set(P3.map((t) => norm(t.topic)));
  P4.forEach((t, i) => { if (!p3topics.has(norm(t.topic))) WARN(F, `Part 4 topic "${t.topic}" has no matching Part 3 topic`); });
}

/* ------------------------------------------------------------------ Writing */
function checkWriting() {
  const F = 'b1-writing-content.html';
  const src = read(F);
  dashScan(F, src);
  // Model answers: each "Word count: N" should sit near 100 and match the real (stripped) count.
  const modelRe = /model:\s*`([\s\S]*?)`,\s*\n?\s*note:\s*"Word count:\s*(\d+)/g;
  let m, n = 0;
  while ((m = modelRe.exec(src)) !== null) {
    n++;
    const real = words(stripTags(m[1])).length;
    const stated = Number(m[2]);
    if (real < 80 || real > 130) ERR(F, `A model answer is ${real} words (label ${stated}); B1 target is about 100 (80-130)`);
    else if (Math.abs(real - stated) > 4) WARN(F, `A model answer's label says ${stated} but it is really ${real} words`);
  }
  if (n < 3) WARN(F, `only ${n} model answers found (expected 3: email, article, story)`);
}

/* ------------------------------------------------------------------ Grammar (dash check only) */
function checkGrammar() {
  const F = 'b1-grammar-content.html';
  dashScan(F, read(F));
}

/* ------------------------------------------------------------------ run */
const suites = [
  ['Reading', checkReading],
  ['Speaking', checkSpeaking],
  ['Writing', checkWriting],
  ['Grammar', checkGrammar],
];
for (const [name, fn] of suites) {
  try { fn(); } catch (e) { ERR(name, `check crashed: ${e.message}`); }
}

const errors = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');
const line = (f) => `  ${f.level === 'ERROR' ? '✗' : '!'} [${f.file}] ${f.msg}`;
if (errors.length) { console.log('\nERRORS:'); errors.forEach((f) => console.log(line(f))); }
if (warns.length) { console.log('\nWARNINGS:'); warns.forEach((f) => console.log(line(f))); }
if (!findings.length) console.log('All B1 checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
