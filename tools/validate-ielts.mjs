#!/usr/bin/env node
/**
 * validate-ielts.mjs — structural + answer-key invariants for the IELTS pages that carry data
 * (ielts-reading-content.html, ielts-writing-content.html, ielts-speaking-content.html).
 * ielts-listening-content.html is guide-only — the site-wide dash net in validate-common.mjs is
 * all it needs, so it is not handled here.
 *
 * Run:  node tools/validate-ielts.mjs      (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN never fails the run.
 *
 * Reading is the scored page and is the whole point of this validator. Each test (Academic
 * TESTS_A, General Training TESTS_G) is an object whose values are three part objects, and each
 * part mixes several IELTS task types, each with its OWN answer encoding:
 *   - c3            True/False/Not Given or Yes/No/Not Given — `correct` is a string enum
 *   - mc            4-option multiple choice — `correct` is a 0-based index into `opts`
 *   - matchInfo     "which paragraph…" — `correct` is a paragraph letter (must be a real `paras` letter)
 *   - matchEndings  sentence endings — `correct` is a letter in `endingsOptions`
 *   - headingCorrect heading matching — an object map paraLetter -> heading id (value must be a real heading)
 *   - matchClasses  category matching — `correct` is a letter in `classes`
 *   - fillBlanks / shortAnswer — `answers` is a non-empty array of accepted strings
 * The load-bearing checks are that every keyed answer really points at a live option/letter/heading
 * (the "unfair to a student" bug), and that the data evals at all (the failure mode that let
 * b2fs-reading ship blank). The 40-questions-per-test total is a WARN so a task mix can shift.
 *
 * Speaking is productive (no answer keys); only FULL_TESTS and TEST_GROUPS are static literals —
 * ORDERED_TESTS and PART2_TOPICS are assembled at runtime via .push(), so they can't be eval'd
 * statically and are not checked here. Writing is guidance/prompts only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];
const ERR = (f, m) => findings.push({ level: 'ERROR', file: f, msg: m });
const WARN = (f, m) => findings.push({ level: 'WARN', file: f, msg: m });
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
const evalArray = (src, name) => Function('P', 'return (' + arrayLiteral(src, name) + ');')(P);

function dashScan(file, src) {
  if (/—|&mdash;/.test(src)) ERR(file, 'contains an em dash (— or &mdash;)');
  if (/ – | &ndash; /.test(src)) ERR(file, 'contains a spaced en dash used as punctuation');
}

const TFNG = new Set(['TRUE', 'FALSE', 'NOT GIVEN', 'YES', 'NO']);
const nonEmptyStrArray = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => String(x).trim());

/** Validate one reading part object (mixes task types); returns the scored-item count found. */
function checkPart(F, tag, part) {
  const paraLetters = new Set((part.paras || []).map((p) => p.letter));
  const classLetters = new Set((part.classes || []).map((c) => c.letter));
  let n = 0;

  (part.c3 || []).forEach((q, i) => {
    n++;
    if (!TFNG.has(q.correct)) ERR(F, `${tag} c3 #${q.n ?? i + 1}: correct "${q.correct}" is not a TRUE/FALSE/NOT GIVEN (or YES/NO) value`);
  });

  (part.mc || []).forEach((q, i) => {
    n++;
    if (!Array.isArray(q.opts) || q.opts.length === 0) { ERR(F, `${tag} mc #${q.n ?? i + 1}: no options`); return; }
    if (q.opts.length !== 4) WARN(F, `${tag} mc #${q.n ?? i + 1}: ${q.opts.length} options, IELTS MC usually has 4`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.opts.length)
      ERR(F, `${tag} mc #${q.n ?? i + 1}: correct index ${q.correct} out of range (0-${q.opts.length - 1})`);
  });

  (part.matchInfo || []).forEach((q, i) => {
    n++;
    if (!paraLetters.has(q.correct)) ERR(F, `${tag} matchInfo #${q.n ?? i + 1}: correct "${q.correct}" is not a paragraph letter (${[...paraLetters].join(',')})`);
  });

  if (part.matchEndings) {
    const eo = new Set((part.endingsOptions || []).map((e) => e.letter));
    part.matchEndings.forEach((q, i) => {
      n++;
      if (!eo.has(q.correct)) ERR(F, `${tag} matchEndings #${q.n ?? i + 1}: correct "${q.correct}" is not an ending option (${[...eo].join(',')})`);
    });
  }

  if (part.headingCorrect) {
    const headingIds = new Set((part.headings || []).map((h) => h.n));
    const keys = Object.keys(part.headingCorrect);
    keys.forEach((k) => {
      n++;
      if (!paraLetters.has(k)) ERR(F, `${tag} headingCorrect: key "${k}" is not a paragraph letter`);
      if (!headingIds.has(part.headingCorrect[k])) ERR(F, `${tag} headingCorrect[${k}]="${part.headingCorrect[k]}" is not a listed heading id`);
    });
    const expKeys = Object.keys(part.headingExp || {});
    if (expKeys.sort().join(',') !== keys.slice().sort().join(',')) WARN(F, `${tag}: headingExp keys don't match headingCorrect keys`);
  }

  (part.matchClasses || []).forEach((q, i) => {
    n++;
    if (!classLetters.has(q.correct)) ERR(F, `${tag} matchClasses #${q.n ?? i + 1}: correct "${q.correct}" is not a class letter (${[...classLetters].join(',')})`);
  });

  (part.fillBlanks || []).forEach((q, i) => {
    n++;
    if (!nonEmptyStrArray(q.answers)) ERR(F, `${tag} fillBlanks #${q.n ?? i + 1}: answers must be a non-empty array of strings`);
  });

  (part.shortAnswer || []).forEach((q, i) => {
    n++;
    if (!nonEmptyStrArray(q.answers)) ERR(F, `${tag} shortAnswer #${q.n ?? i + 1}: answers must be a non-empty array of strings`);
  });

  return n;
}

function checkReadingBank(F, arrName, label) {
  const src = read(F);
  const TESTS = evalArray(src, arrName);
  if (TESTS.length < 1) { ERR(F, `${arrName} is empty`); return; }
  TESTS.forEach((t, ti) => {
    const parts = Object.entries(t).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v));
    if (parts.length !== 3) WARN(F, `${label} test ${ti + 1}: ${parts.length} parts, expected 3`);
    let total = 0;
    parts.forEach(([pk, pv]) => { total += checkPart(F, `${label} test ${ti + 1} ${pk}`, pv); });
    if (total !== 40) WARN(F, `${label} test ${ti + 1}: ${total} scored items, an IELTS test normally has 40`);
  });
}

function checkBandTable(F, src, arrName) {
  const T = evalArray(src, arrName);
  if (T.length < 1) { ERR(F, `${arrName} is empty`); return; }
  let prev = Infinity;
  T.forEach((row, i) => {
    if (typeof row.min !== 'number' || typeof row.band !== 'number') ERR(F, `${arrName} row ${i + 1}: min/band must be numbers`);
    else if (row.min >= prev) WARN(F, `${arrName} row ${i + 1}: min ${row.min} not below the previous threshold ${prev} (table should descend)`);
    if (typeof row.min === 'number') prev = row.min;
  });
}

function checkReading() {
  const F = 'ielts-reading-content.html';
  const src = read(F); dashScan(F, src);
  checkReadingBank(F, 'TESTS_A', 'Academic');
  checkReadingBank(F, 'TESTS_G', 'General');
  checkBandTable(F, src, 'READING_BAND_TABLE_A');
  checkBandTable(F, src, 'READING_BAND_TABLE_G');
}

function checkWriting() {
  const F = 'ielts-writing-content.html';
  const src = read(F); dashScan(F, src);
  const tabs = evalArray(src, 'TAB_TYPES');
  if (!nonEmptyStrArray(tabs)) ERR(F, 'TAB_TYPES must be a non-empty array of tab-id strings');
  const G = evalArray(src, 'GUIDE_W');
  if (!Array.isArray(G) || G.length === 0) ERR(F, 'GUIDE_W is empty');
  else G.forEach((g, i) => { if (!g.kind || !g.title) WARN(F, `GUIDE_W entry ${i + 1}: missing kind/title`); });
}

function checkSpeaking() {
  const F = 'ielts-speaking-content.html';
  const src = read(F); dashScan(F, src);
  const FT = evalArray(src, 'FULL_TESTS');
  if (FT.length < 1) { ERR(F, 'FULL_TESTS is empty'); }
  FT.forEach((t, i) => {
    const tag = `FULL_TESTS ${i + 1} (${t.theme || '?'})`;
    if (!Array.isArray(t.p1Qs) || t.p1Qs.length === 0) ERR(F, `${tag}: no Part 1 questions`);
    else if (t.p1Qs.length !== 8) WARN(F, `${tag}: ${t.p1Qs.length} Part 1 questions, expected 8`);
    if (!Array.isArray(t.p3Qs) || t.p3Qs.length === 0) ERR(F, `${tag}: no Part 3 questions`);
    else if (t.p3Qs.length !== 6) WARN(F, `${tag}: ${t.p3Qs.length} Part 3 questions, expected 6`);
    if (!Array.isArray(t.p2Bullets) || t.p2Bullets.length === 0) ERR(F, `${tag}: no Part 2 cue-card bullets`);
    else if (t.p2Bullets.length !== 3) WARN(F, `${tag}: ${t.p2Bullets.length} cue-card bullets, expected 3`);
    if (!t.p2Topic) ERR(F, `${tag}: missing Part 2 topic`);
  });
  const TG = evalArray(src, 'TEST_GROUPS');
  if (!Array.isArray(TG) || TG.length === 0) ERR(F, 'TEST_GROUPS is empty');
  else TG.forEach((g, i) => {
    if (!Array.isArray(g) || typeof g[0] !== 'string' || !Array.isArray(g[1]))
      ERR(F, `TEST_GROUPS entry ${i + 1}: expected [groupTitle, memberTopics[]]`);
  });
}

const suites = [
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
if (!findings.length) console.log('All IELTS checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
