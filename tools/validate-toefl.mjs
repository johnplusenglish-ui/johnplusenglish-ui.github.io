#!/usr/bin/env node
/**
 * validate-toefl.mjs — structural + answer-key invariants for the four TOEFL pages
 * (toefl-reading-content.html, toefl-listening-content.html, toefl-writing-content.html,
 * toefl-speaking-content.html).
 *
 * Run:  node tools/validate-toefl.mjs      (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN never fails the run.
 *
 * These are the site's OWN TOEFL practice resources (not a reproduction of a fixed official
 * spec), so the load-bearing checks are: (1) each page's data array still exists and evals — the
 * failure mode that let b2fs-reading ship blank; (2) every multiple-choice item has exactly 4
 * options and a correct index that really points at one of them (the "unfair to a student" bug);
 * (3) the word-order writing task's answer and shuffle-pool hold the same tokens. Per-set question
 * counts are WARN, not ERROR, so adding or trimming practice sets never hard-fails a commit.
 *
 * Every page uses the same top-level shape: `const SETS = [...]` plus `const GUIDE = [...]`.
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

/** Every MCQ across TOEFL pages is `{ q, options:[4], correct:int, explanation }`. */
function checkMCQ(F, tag, q) {
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    ERR(F, `${tag}: expected 4 options, found ${q.options ? q.options.length : 'none'}`);
    return;
  }
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) {
    ERR(F, `${tag}: correct index ${q.correct} is out of range (0-${q.options.length - 1})`);
  }
  // Most MCQs carry the stem in `q`; listening "response" items use `line` instead.
  const stem = q.q || q.line;
  if (!stem || !String(stem).trim()) WARN(F, `${tag}: empty question stem`);
  if (!q.explanation || !String(q.explanation).trim()) WARN(F, `${tag}: no explanation`);
}

/** GUIDE entries: { label, title, desc, tips[], facts?, example? }. */
function checkGuide(F, expectedLen) {
  const src = read(F);
  const G = evalArray(src, 'GUIDE');
  if (G.length !== expectedLen) WARN(F, `GUIDE has ${G.length} entries, expected ${expectedLen}`);
  G.forEach((g, i) => {
    if (!g.title || !g.desc) ERR(F, `GUIDE entry ${i + 1}: missing title/desc`);
    if (!Array.isArray(g.tips) || g.tips.length === 0) WARN(F, `GUIDE entry ${i + 1} (${g.title || '?'}): no tips`);
  });
}

function checkReading() {
  const F = 'toefl-reading-content.html';
  const src = read(F); dashScan(F, src);
  const SETS = evalArray(src, 'SETS');
  if (SETS.length < 1) ERR(F, 'SETS is empty');
  SETS.forEach((s, si) => {
    const st = `Set ${si + 1}`;
    // Vocabulary gap items: answer strings, not scored MCQs.
    (s.words || []).forEach((w, wi) => {
      if (!w.missing || !w.full) ERR(F, `${st} vocab ${wi + 1}: missing "missing"/"full" answer`);
    });
    if (!Array.isArray(s.daily) || s.daily.length === 0) ERR(F, `${st}: no "daily" passages`);
    (s.daily || []).forEach((d, di) => {
      if (!Array.isArray(d.questions) || d.questions.length === 0) ERR(F, `${st} daily ${di + 1}: no questions`);
      (d.questions || []).forEach((q, qi) => checkMCQ(F, `${st} daily ${di + 1} Q${qi + 1}`, q));
    });
    if (!s.academic || !Array.isArray(s.academic.questions)) ERR(F, `${st}: missing academic passage/questions`);
    else s.academic.questions.forEach((q, qi) => checkMCQ(F, `${st} academic Q${qi + 1}`, q));
  });
  checkGuide(F, 4);
}

function checkListening() {
  const F = 'toefl-listening-content.html';
  const src = read(F); dashScan(F, src);
  const SETS = evalArray(src, 'SETS');
  if (SETS.length < 1) ERR(F, 'SETS is empty');
  SETS.forEach((s, si) => {
    const st = `Set ${si + 1}`;
    (s.responses || []).forEach((q, qi) => checkMCQ(F, `${st} response ${qi + 1}`, q));
    ['conversation', 'announcement', 'talk'].forEach((k) => {
      const sec = s[k];
      if (!sec || !Array.isArray(sec.questions) || sec.questions.length === 0) { ERR(F, `${st}: "${k}" has no questions`); return; }
      sec.questions.forEach((q, qi) => checkMCQ(F, `${st} ${k} Q${qi + 1}`, q));
    });
  });
  checkGuide(F, 5);
}

function checkWriting() {
  const F = 'toefl-writing-content.html';
  const src = read(F); dashScan(F, src);
  const SETS = evalArray(src, 'SETS');
  if (SETS.length < 1) ERR(F, 'SETS is empty');
  SETS.forEach((s, si) => {
    const st = `Set ${si + 1}`;
    // Word-order task: the answer sequence and the shuffle pool must hold the same tokens.
    (s.sentences || []).forEach((it, i) => {
      if (!Array.isArray(it.answer) || !Array.isArray(it.words)) { ERR(F, `${st} sentence ${i + 1}: answer/words not arrays`); return; }
      if (it.answer.length !== it.words.length)
        ERR(F, `${st} sentence ${i + 1}: answer has ${it.answer.length} tokens but the shuffle pool has ${it.words.length}`);
      const a = [...it.answer].sort().join('|'), w = [...it.words].sort().join('|');
      if (a !== w) ERR(F, `${st} sentence ${i + 1}: answer tokens and shuffle-pool tokens differ`);
    });
    if (!s.email || !Array.isArray(s.email.bullets) || !s.email.model) ERR(F, `${st}: email prompt missing bullets/model`);
    if (!s.discussion || !s.discussion.prompt || !s.discussion.model) ERR(F, `${st}: discussion prompt missing prompt/model`);
  });
  checkGuide(F, 4);
}

function checkSpeaking() {
  const F = 'toefl-speaking-content.html';
  const src = read(F); dashScan(F, src);
  const SETS = evalArray(src, 'SETS');
  if (SETS.length < 1) ERR(F, 'SETS is empty');
  SETS.forEach((s, si) => {
    const st = `Set ${si + 1}`;
    (s.repeat || []).forEach((r, i) => {
      if (!r.text || !String(r.text).trim()) ERR(F, `${st} repeat ${i + 1}: empty text`);
      if (!Number.isFinite(r.time) || r.time <= 0) WARN(F, `${st} repeat ${i + 1}: odd time "${r.time}"`);
    });
    if (!Array.isArray(s.interview) || s.interview.length === 0) ERR(F, `${st}: no interview questions`);
  });
  checkGuide(F, 3);
}

const suites = [
  ['Reading', checkReading],
  ['Listening', checkListening],
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
if (!findings.length) console.log('All TOEFL checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
