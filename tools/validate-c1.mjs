#!/usr/bin/env node
/**
 * validate-c1.mjs — structural + content invariants for the C1 Advanced exam pages.
 *
 * Run:  node tools/validate-c1.mjs        (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN-level issues never fail the build.
 *
 * This encodes the rules that kept biting us during the C1 audit work:
 *  - Use of English: gap counts, valid MC answer indices, KWT answers 3-6 words with the key
 *    word INSIDE the gap, single-word open-cloze answers, no word-formation answer reused across
 *    sets, all {1}-{8} placeholders present.
 *  - Reading: Part 5/6/7/8 shapes, Part 7 = 6 keys + 7 options + exactly one unused, and every
 *    in-context Part 5 vocab item's `lineWord` actually appears in its passage.
 *  - Writing: three quoted opinions + the rubric line per essay, no B2 framing, models 220-260.
 *  - Speaking: 72 Part 1 questions, two-aspect Part 2 prompts, 5-option Part 3 tasks, 1:1 Part 4.
 *  - Every page: no em dash (— / &mdash;) and no spaced en dash, per John's house rule.
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
const P = (level, file) => `images/picture-discussion/${level}/${file}`;
function evalArray(src, name) {
  // eslint-disable-next-line no-new-func
  return Function('P', 'return (' + arrayLiteral(src, name) + ');')(P);
}

// Cambridge counts a contraction as its full expanded form (e.g. "didn't" = two words, "needn't" =
// "need not"). Expand before counting/matching so KWT word-counts and key-word checks use the same
// rule a human marker would.
const expandContractions = (s) => s.replace(/n't\b/gi, ' not');
const words = (s) => expandContractions(s).trim().split(/\s+/).filter(Boolean);
const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');

/** Em dash and spaced en dash are banned. Unspaced en dash inside a number range is allowed. */
function dashScan(file, src) {
  if (/—|&mdash;/.test(src)) ERR(file, 'contains an em dash (— or &mdash;)');
  if (/ – | &ndash; /.test(src)) ERR(file, 'contains a spaced en dash used as punctuation');
}

/* passage line model (mirrors renderP5 in the reading page) */
function splitPassageLines(text, maxChars) {
  const ws = text.split(/\s+/).filter(Boolean);
  const lines = []; let cur = '';
  for (const w of ws) {
    if (cur && (cur.length + 1 + w.length) > maxChars) { lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}
function lineOf(paras, phrase) {
  const strip = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const first = strip(phrase.split(/\s+/)[0]);
  let no = 0;
  for (const para of paras) for (const line of splitPassageLines(para, 64)) {
    no++;
    if (line.split(/\s+/).some((w) => strip(w) === first || strip(w).startsWith(first))) return no;
  }
  return null;
}

/* ------------------------------------------------------------------ Use of English */
function checkUoE() {
  const F = 'uoe-c1-content.html';
  const src = read(F);
  dashScan(F, src);
  const T = evalArray(src, 'TESTS');       // Part 1
  const OC = evalArray(src, 'OC_TESTS');   // Part 2
  const WF = evalArray(src, 'WF_TESTS');   // Part 3
  const KWT = evalArray(src, 'KWT_TESTS'); // Part 4

  const joinText = (t) => Array.isArray(t) ? t.join('') : t;
  const placeholders = (t) => { const s = joinText(t); return Array.from({length: 8}, (_, k) => s.includes('{' + (k + 1) + '}')); };

  if (T.length !== 20) ERR(F, `Part 1 has ${T.length} sets, expected 20`);
  T.forEach((s, i) => {
    const tag = `Part 1 "${s.title}" (set ${i + 1})`;
    if (s.gaps.length !== 8) ERR(F, `${tag}: ${s.gaps.length} gaps, expected 8`);
    placeholders(s.text).forEach((present, k) => { if (!present) ERR(F, `${tag}: missing {${k + 1}} in text`); });
    s.gaps.forEach((g) => {
      if (!Array.isArray(g.options) || g.options.length !== 4) ERR(F, `${tag} gap ${g.num}: needs 4 options`);
      if (!(g.correct >= 0 && g.correct < g.options.length)) ERR(F, `${tag} gap ${g.num}: correct index ${g.correct} out of range`);
      if (!g.exp || !g.exp.trim()) WARN(F, `${tag} gap ${g.num}: empty explanation`);
    });
  });

  if (OC.length !== 20) ERR(F, `Part 2 has ${OC.length} sets, expected 20`);
  OC.forEach((s, i) => {
    const tag = `Part 2 "${s.title}" (set ${i + 1})`;
    if (s.gaps.length !== 8) ERR(F, `${tag}: ${s.gaps.length} gaps, expected 8`);
    placeholders(s.text).forEach((present, k) => { if (!present) ERR(F, `${tag}: missing {${k + 1}} in text`); });
    s.gaps.forEach((g) => {
      if (!g.answer || /\s/.test(g.answer.trim())) ERR(F, `${tag} gap ${g.num}: open-cloze answer must be a single word ("${g.answer}")`);
    });
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
      if (a) { (wfSeen.get(a) || wfSeen.set(a, []).get(a)).push(i + 1); }
    });
  });
  for (const [ans, sets] of wfSeen) if (sets.length > 1) ERR(F, `Part 3 answer "${ans}" is reused across sets ${sets.join(', ')} (word-formation answers must be unique)`);

  if (KWT.length !== 20) ERR(F, `Part 4 has ${KWT.length} sets, expected 20`);
  KWT.forEach((s, i) => {
    const tag = `Part 4 (set ${i + 1})`;
    if (s.items.length !== 6) ERR(F, `${tag}: ${s.items.length} items, expected 6`);
    s.items.forEach((it, k) => {
      const wc = words(it.answer).length;
      if (wc < 3 || wc > 6) ERR(F, `${tag} item ${k + 1} (${it.key}): answer "${it.answer}" is ${wc} words, must be 3-6`);
      const keyRe = new RegExp('\\b' + it.key.replace(/[^A-Za-z]/g, '') + '\\b', 'i');
      if (!keyRe.test(expandContractions(it.answer))) ERR(F, `${tag} item ${k + 1}: key word "${it.key}" not inside the answer "${it.answer}"`);
      // Accepted alternatives must obey the same rules: 3-6 words, key word present and unchanged.
      (it.alts || []).forEach((alt) => {
        const awc = words(alt).length;
        if (awc < 3 || awc > 6) ERR(F, `${tag} item ${k + 1} (${it.key}): alt "${alt}" is ${awc} words, must be 3-6`);
        if (!keyRe.test(expandContractions(alt))) ERR(F, `${tag} item ${k + 1} (${it.key}): alt "${alt}" is missing the unchanged key word`);
      });
      if (!/_{3,}|\.{3,}/.test(it.gapped)) WARN(F, `${tag} item ${k + 1}: gapped sentence has no visible blank`);
    });
  });
}

/* ------------------------------------------------------------------ Reading */
function checkReading() {
  const F = 'c1-reading-test-content.html';
  const src = read(F);
  dashScan(F, src);
  const T = evalArray(src, 'TESTS');
  if (T.length !== 5) ERR(F, `expected 5 tests, found ${T.length}`);
  T.forEach((t, i) => {
    const tag = `Test ${i + 1}`;
    // Part 5
    if (!t.P5 || t.P5.questions.length !== 6) ERR(F, `${tag} Part 5: expected 6 questions`);
    t.P5.questions.forEach((q, qi) => {
      if (q.opts.length !== 4) ERR(F, `${tag} Part 5 Q${qi + 1}: needs 4 options`);
      if (!(q.correct >= 0 && q.correct < 4)) ERR(F, `${tag} Part 5 Q${qi + 1}: correct index ${q.correct} out of range`);
      if (q.lineWord) {
        if (!/\{line\}/.test(q.stem)) ERR(F, `${tag} Part 5 Q${qi + 1}: has lineWord but no {line} placeholder in stem`);
        if (lineOf(t.P5.passage, q.lineWord) == null) ERR(F, `${tag} Part 5 Q${qi + 1}: lineWord "${q.lineWord}" not found in passage`);
      }
    });
    // Part 6
    if (!t.P6 || t.P6.questions.length !== 4) ERR(F, `${tag} Part 6: expected 4 questions`);
    // Part 7
    const p7 = t.P7;
    const keys = Object.values(p7.correct);
    if (keys.length !== 6) ERR(F, `${tag} Part 7: expected 6 keys, found ${keys.length}`);
    if (p7.options.length !== 7) ERR(F, `${tag} Part 7: expected 7 paragraph options, found ${p7.options.length}`);
    if (new Set(keys).size !== keys.length) ERR(F, `${tag} Part 7: duplicate key letters ${keys.join(',')}`);
    const letters = p7.options.map((o) => o.letter);
    const unused = letters.filter((l) => !keys.includes(l));
    if (unused.length !== 1) ERR(F, `${tag} Part 7: exactly one option should be unused, found ${unused.length} (${unused.join(',')})`);
    keys.forEach((k) => { if (!letters.includes(k)) ERR(F, `${tag} Part 7: key "${k}" is not an available option`); });
    // Part 8
    if (!t.P8 || t.P8.questions.length !== 10) ERR(F, `${tag} Part 8: expected 10 questions, found ${t.P8 ? t.P8.questions.length : 'none'}`);
  });
}

/* ------------------------------------------------------------------ Speaking */
function checkSpeaking() {
  const F = 'c1-speaking-content.html';
  const src = read(F);
  dashScan(F, src);
  const P1 = evalArray(src, 'P1_QUESTIONS');
  const sets = evalArray(src, 'c1Sets');
  const p3 = evalArray(src, 'PART3_TOPICS');
  const p4 = evalArray(src, 'PART4_TOPICS');

  if (P1.length !== 72) ERR(F, `Part 1: expected 72 questions, found ${P1.length}`);
  const cats = new Map();
  P1.forEach((q) => cats.set(q.category, (cats.get(q.category) || 0) + 1));
  if (cats.size !== 12) ERR(F, `Part 1: expected 12 categories, found ${cats.size}`);

  if (sets.length !== 10) ERR(F, `Part 2: expected 10 photo sets, found ${sets.length}`);
  sets.forEach((s, i) => {
    if (s.photos.length !== 3) ERR(F, `Part 2 set ${i + 1} (${s.topic}): expected 3 photos`);
    const m = s.question.match(/<strong>([\s\S]*?)<\/strong>/);
    if (!m || !/\band\b/.test(m[1])) ERR(F, `Part 2 set ${i + 1} (${s.topic}): long-turn prompt must address two aspects (needs "and" inside <strong>)`);
    if (!s.followUp) ERR(F, `Part 2 set ${i + 1}: missing partner follow-up`);
  });

  if (p3.length !== 10) ERR(F, `Part 3: expected 10 sets, found ${p3.length}`);
  p3.forEach((s, i) => { if (s.options.length !== 5) ERR(F, `Part 3 set ${i + 1} (${s.topic}): expected 5 options, found ${s.options.length}`); });

  if (p4.length !== 10) ERR(F, `Part 4: expected 10 sets, found ${p4.length}`);
  if (p4.length !== p3.length) ERR(F, `Part 4 sets (${p4.length}) do not map 1:1 to Part 3 (${p3.length})`);
}

/* ------------------------------------------------------------------ Writing */
function checkWriting() {
  const F = 'c1-writing-content.html';
  const src = read(F);
  dashScan(F, src);
  // Essays: each "Some opinions expressed in the discussion:" block should carry exactly 3 quotes,
  // and the standard rubric line should appear once per essay.
  const rubric = 'You may, if you wish, make use of the opinions expressed in the discussion';
  const rubricCount = (src.match(new RegExp(rubric, 'g')) || []).length;
  const opinionBlocks = src.match(/Some opinions expressed in the discussion:[\s\S]*?<\/div>/g) || [];
  if (opinionBlocks.length && rubricCount !== opinionBlocks.length)
    ERR(F, `Essay rubric line appears ${rubricCount}x but there are ${opinionBlocks.length} opinion blocks`);
  opinionBlocks.forEach((b, i) => {
    const quotes = (b.match(/<p>[“"][^]*?[”"]<\/p>/g) || []).length;
    if (quotes !== 3) ERR(F, `Essay ${i + 1}: has ${quotes} quoted opinions, real CAE Part 1 gives 3`);
  });
  if (/teacher has asked you to write an essay based on the notes below/.test(src))
    ERR(F, 'Essay uses B2-style "teacher has asked..." framing; C1 uses "Your class has listened to / watched a discussion..."');
  // Model answers: each "Word count: N" should sit inside 220-260 and match the real (stripped) count.
  const modelRe = /model:\s*`([\s\S]*?)`,\s*\n?\s*note:\s*"Word count:\s*(\d+)/g;
  let m;
  while ((m = modelRe.exec(src)) !== null) {
    const real = words(stripTags(m[1])).length;
    const stated = Number(m[2]);
    if (real < 220 || real > 260) ERR(F, `A model answer is ${real} words (label ${stated}); must be 220-260`);
    else if (Math.abs(real - stated) > 6) WARN(F, `A model answer's label says ${stated} but it is really ${real} words`);
  }
}

/* ------------------------------------------------------------------ run */
const suites = [
  ['Use of English', checkUoE],
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
if (!findings.length) console.log('All C1 checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
