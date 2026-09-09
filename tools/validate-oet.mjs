#!/usr/bin/env node
/**
 * validate-oet.mjs — structural + answer-key invariants for the OET pages that carry data
 * (oet-reading-content.html, oet-speaking-content.html, oet-writing-content.html).
 * oet-listening-content.html is guide-only ("coming soon") — the site-wide dash net in
 * validate-common.mjs is the only check it needs, so it is not handled here.
 *
 * Run:  node tools/validate-oet.mjs        (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN never fails the run.
 *
 * OET Reading is the scored page and has TWO answer shapes: Part A is text-matching (each
 * question's `correct` is a LETTER that must name one of the part's four texts), while Parts B
 * and C are ordinary MCQs (`correct` is a 0-based index into that question's `opts`). The
 * load-bearing checks are that each `correct` really points at a live option/text — the
 * "unfair to a student" bug — and that the page's data still evals at all (the failure mode that
 * let b2fs-reading ship blank). Item counts are WARN so the single test can grow without a hard
 * fail. Speaking is role-play prompt content (nothing scored); Writing's task lives in guide +
 * phrase-bank arrays (nothing scored) — for those the checks are "the data is present and evals".
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

/** A numeric-index MCQ: `correct` is a 0-based index into `opts`. `wantOpts` is the expected size. */
function checkMCQ(F, tag, q, wantOpts) {
  if (!Array.isArray(q.opts) || q.opts.length === 0) { ERR(F, `${tag}: no options`); return; }
  if (wantOpts && q.opts.length !== wantOpts) WARN(F, `${tag}: ${q.opts.length} options, expected ${wantOpts}`);
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.opts.length)
    ERR(F, `${tag}: correct index ${q.correct} is out of range (0-${q.opts.length - 1})`);
  if (!q.exp || !String(q.exp).trim()) WARN(F, `${tag}: no explanation`);
}

function checkReading() {
  const F = 'oet-reading-content.html';
  const src = read(F); dashScan(F, src);
  const TESTS = evalArray(src, 'TESTS');
  if (TESTS.length < 1) { ERR(F, 'TESTS is empty'); return; }
  TESTS.forEach((t, ti) => {
    const T = `Test ${ti + 1}`;
    // Part A: text-matching. correct is a LETTER naming one of PA.texts.
    const pa = t.PA;
    if (!pa || !Array.isArray(pa.texts) || !Array.isArray(pa.questions)) ERR(F, `${T} Part A: missing texts/questions`);
    else {
      const letters = new Set(pa.texts.map((x) => x.letter));
      if (pa.questions.length !== 20) WARN(F, `${T} Part A: ${pa.questions.length} questions, expected 20`);
      pa.questions.forEach((q, qi) => {
        if (!letters.has(q.correct)) ERR(F, `${T} Part A Q${qi + 1}: correct "${q.correct}" is not one of the texts (${[...letters].join(',')})`);
      });
    }
    // Part B: 6 single-question MCQ items, 3 options each.
    const pb = t.PB;
    if (!pb || !Array.isArray(pb.items)) ERR(F, `${T} Part B: missing items`);
    else {
      if (pb.items.length !== 6) WARN(F, `${T} Part B: ${pb.items.length} items, expected 6`);
      pb.items.forEach((it, i) => {
        if (!it.q) { ERR(F, `${T} Part B item ${i + 1}: no question`); return; }
        checkMCQ(F, `${T} Part B item ${i + 1}`, it.q, 3);
      });
    }
    // Part C: long-text MCQ, 4 options each.
    const pc = t.PC;
    if (!pc || !Array.isArray(pc.texts)) ERR(F, `${T} Part C: missing texts`);
    else pc.texts.forEach((tx, xi) => {
      if (!Array.isArray(tx.questions) || tx.questions.length === 0) { ERR(F, `${T} Part C text ${xi + 1}: no questions`); return; }
      tx.questions.forEach((q, qi) => checkMCQ(F, `${T} Part C text ${xi + 1} Q${qi + 1}`, q, 4));
    });
  });
}

function checkSpeaking() {
  const F = 'oet-speaking-content.html';
  const src = read(F); dashScan(F, src);
  const RP = evalArray(src, 'ROLEPLAYS');
  if (RP.length < 1) ERR(F, 'ROLEPLAYS is empty');
  RP.forEach((r, i) => {
    const tag = `Roleplay ${i + 1} (${r.title || '?'})`;
    if (!r.title || !r.setting) ERR(F, `${tag}: missing title/setting`);
    if (!Array.isArray(r.phraseCols) || r.phraseCols.length === 0) WARN(F, `${tag}: no phrase columns`);
    ['candidate', 'interlocutor'].forEach((role) => {
      const R = r[role];
      if (!R || !R.role || !Array.isArray(R.points) || R.points.length === 0)
        ERR(F, `${tag}: ${role} missing role/points`);
    });
  });
  const WU = evalArray(src, 'WARMUP_QUESTIONS');
  if (!Array.isArray(WU) || WU.length === 0) ERR(F, 'WARMUP_QUESTIONS is empty');
}

function checkWriting() {
  const F = 'oet-writing-content.html';
  const src = read(F); dashScan(F, src);
  // Writing has no scored answer key; the task content lives in GUIDE + PHRASE_BANK. Just make
  // sure those still exist and eval (a truncation would blank the page, b2fs-style).
  const G = evalArray(src, 'GUIDE');
  if (!Array.isArray(G) || G.length === 0) ERR(F, 'GUIDE is empty');
  const PBK = evalArray(src, 'PHRASE_BANK');
  if (!Array.isArray(PBK) || PBK.length === 0) ERR(F, 'PHRASE_BANK is empty');
}

const suites = [
  ['Reading', checkReading],
  ['Speaking', checkSpeaking],
  ['Writing', checkWriting],
];
for (const [name, fn] of suites) {
  try { fn(); } catch (e) { ERR(name, `check crashed: ${e.message}`); }
}

const errors = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');
const line = (f) => `  ${f.level === 'ERROR' ? '✗' : '!'} [${f.file}] ${f.msg}`;
if (errors.length) { console.log('\nERRORS:'); errors.forEach((f) => console.log(line(f))); }
if (warns.length) { console.log('\nWARNINGS:'); warns.forEach((f) => console.log(line(f))); }
if (!findings.length) console.log('All OET checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
