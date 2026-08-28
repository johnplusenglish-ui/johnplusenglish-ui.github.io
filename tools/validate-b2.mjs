#!/usr/bin/env node
/**
 * validate-b2.mjs — structural + content invariants for the B2 First exam pages.
 *
 * Run:  node tools/validate-b2.mjs        (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN-level issues never fail the build.
 *
 * B2 First format differs from C1 Advanced in several load-bearing ways (confirmed against the
 * official Cambridge "First Handbook for teachers", Aug 2026) — do NOT copy C1 assumptions here:
 *  - Use of English Part 4 (KWT) answers are 2-5 words, NOT 3-6.
 *  - Reading has only THREE parts (5, 6, 7), not four: Part 6 is SENTENCE removal (6 gaps + 7
 *    single-sentence options + one unused), Part 7 is 10-question multiple matching against up
 *    to 6 short texts. There is no C1-style Part 8 or cross-text opinion-matching part.
 *  - Writing Part 1 essay is built from TWO given notes plus the candidate's OWN third idea
 *    (not three quoted opinions like C1); word target is 140-190, not 220-260.
 *  - Speaking Part 2 gives TWO photos and ONE printed question above them (not three photos and
 *    a two-aspect prompt); the partner's follow-up is still ~30 seconds.
 *  - Writing Part 2 task types are article / email / letter / review / report (no "story" — that
 *    substitution is unique to B2 First for Schools, a different exam variant).
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

/* ------------------------------------------------------------------ Use of English */
function checkUoE() {
  const F = 'uoe-b2-content.html';
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
      // B2 First: 2-5 words (C1 Advanced is 3-6 — do not copy that number here).
      if (wc < 2 || wc > 5) ERR(F, `${tag} item ${k + 1} (${it.key}): answer "${it.answer}" is ${wc} words, must be 2-5`);
      const keyRe = new RegExp('\\b' + it.key.replace(/[^A-Za-z]/g, '') + '\\b', 'i');
      if (!keyRe.test(expandContractions(it.answer))) ERR(F, `${tag} item ${k + 1}: key word "${it.key}" not inside the answer "${it.answer}"`);
      (it.alts || []).forEach((alt) => {
        const awc = words(alt).length;
        if (awc < 2 || awc > 5) ERR(F, `${tag} item ${k + 1} (${it.key}): alt "${alt}" is ${awc} words, must be 2-5`);
        if (!keyRe.test(expandContractions(alt))) ERR(F, `${tag} item ${k + 1} (${it.key}): alt "${alt}" is missing the unchanged key word`);
      });
      if (!/_{3,}|\.{3,}/.test(it.gapped)) WARN(F, `${tag} item ${k + 1}: gapped sentence has no visible blank`);
    });
  });
}

/* ------------------------------------------------------------------ Reading */
function checkReading() {
  const F = 'b2-reading-test-content.html';
  const src = read(F);
  dashScan(F, src);
  const T = evalArray(src, 'TESTS');
  if (T.length !== 5) ERR(F, `expected 5 tests, found ${T.length}`);
  T.forEach((t, i) => {
    const tag = `Test ${i + 1}`;
    // Part 5: one text, 6 four-option MCQs.
    if (!t.P5 || t.P5.questions.length !== 6) ERR(F, `${tag} Part 5: expected 6 questions`);
    t.P5.questions.forEach((q, qi) => {
      if (q.opts.length !== 4) ERR(F, `${tag} Part 5 Q${qi + 1}: needs 4 options`);
      if (!(q.correct >= 0 && q.correct < 4)) ERR(F, `${tag} Part 5 Q${qi + 1}: correct index ${q.correct} out of range`);
    });
    // Part 6: SENTENCE removal — 6 gaps, 7 single-sentence options, exactly one unused.
    const p6 = t.P6;
    if (!p6) { ERR(F, `${tag}: missing Part 6`); }
    else {
      const keys = Object.values(p6.correct || {});
      if (keys.length !== 6) ERR(F, `${tag} Part 6: expected 6 keys, found ${keys.length}`);
      if (!p6.options || p6.options.length !== 7) ERR(F, `${tag} Part 6: expected 7 sentence options, found ${p6.options ? p6.options.length : 0}`);
      if (new Set(keys).size !== keys.length) ERR(F, `${tag} Part 6: duplicate key letters ${keys.join(',')}`);
      const letters = (p6.options || []).map((o) => o.letter);
      const unused = letters.filter((l) => !keys.includes(l));
      if (unused.length !== 1) ERR(F, `${tag} Part 6: exactly one option should be unused, found ${unused.length} (${unused.join(',')})`);
      keys.forEach((k) => { if (!letters.includes(k)) ERR(F, `${tag} Part 6: key "${k}" is not an available option`); });
      // Part 6 options must be single sentences, not full paragraphs (a common copy-from-C1 mistake).
      (p6.options || []).forEach((o) => {
        const sentences = (o.text.match(/[.!?]+(\s|$)/g) || []).length;
        if (sentences > 2) WARN(F, `${tag} Part 6 option ${o.letter}: reads like a full paragraph (${sentences} sentences) — B2 Part 6 options should be one sentence`);
      });
    }
    // Part 7: 10-question multiple matching against up to 6 short texts.
    if (!t.P7 || t.P7.questions.length !== 10) ERR(F, `${tag} Part 7: expected 10 questions, found ${t.P7 ? t.P7.questions.length : 'none'}`);
    if (t.P7 && (!t.P7.texts || t.P7.texts.length < 2 || t.P7.texts.length > 6)) ERR(F, `${tag} Part 7: expected 2-6 texts, found ${t.P7.texts ? t.P7.texts.length : 0}`);
  });
}

/* ------------------------------------------------------------------ Speaking */
function checkSpeaking() {
  const F = 'b2-speaking-content.html';
  const src = read(F);
  dashScan(F, src);
  const P1 = evalArray(src, 'P1_QUESTIONS');
  const sets = evalArray(src, 'b2Sets');
  const p3 = evalArray(src, 'PART3_TOPICS');
  const p4 = evalArray(src, 'PART4_TOPICS');

  if (P1.length !== 72) ERR(F, `Part 1: expected 72 questions, found ${P1.length}`);
  const cats = new Map();
  P1.forEach((q) => cats.set(q.category, (cats.get(q.category) || 0) + 1));
  if (cats.size !== 12) ERR(F, `Part 1: expected 12 categories, found ${cats.size}`);

  // B2 Part 2: TWO photos, ONE printed question (not C1's three photos / two-aspect prompt).
  if (sets.length !== 10) ERR(F, `Part 2: expected 10 photo sets, found ${sets.length}`);
  sets.forEach((s, i) => {
    if (s.photos.length !== 2) ERR(F, `Part 2 set ${i + 1} (${s.topic}): expected 2 photos (B2 First uses two, not three)`);
    if (!s.question || !s.question.trim()) ERR(F, `Part 2 set ${i + 1} (${s.topic}): missing the long-turn question`);
    if (!s.followUp) ERR(F, `Part 2 set ${i + 1}: missing partner follow-up`);
  });

  if (p3.length !== 10) ERR(F, `Part 3: expected 10 sets, found ${p3.length}`);
  p3.forEach((s, i) => { if (s.options.length !== 5) ERR(F, `Part 3 set ${i + 1} (${s.topic}): expected 5 written prompts, found ${s.options.length}`); });

  if (p4.length !== 10) ERR(F, `Part 4: expected 10 sets, found ${p4.length}`);
  if (p4.length !== p3.length) ERR(F, `Part 4 sets (${p4.length}) do not map 1:1 to Part 3 (${p3.length})`);
}

/* ------------------------------------------------------------------ Writing */
function checkWriting() {
  const F = 'b2-writing-content.html';
  const src = read(F);
  dashScan(F, src);
  // Essay: built from a "Notes - Write about:" list of exactly THREE items — TWO given content
  // points plus a third "your own idea" prompt (B2 essays do not use C1-style quoted opinions).
  const noteBlocks = src.match(/Notes - Write about:<\/strong><\/p>\s*<ol[^>]*>([\s\S]*?)<\/ol>/g) || [];
  noteBlocks.forEach((b, i) => {
    const lis = (b.match(/<li>/g) || []).length;
    if (lis !== 3) ERR(F, `Essay ${i + 1}: has ${lis} notes, real B2 First essays give 2 points + "your own idea" (3 total)`);
    if (!/your own idea/i.test(b)) WARN(F, `Essay ${i + 1}: notes list doesn't mention "your own idea" — B2 essays require a third, candidate-supplied point`);
  });
  if (/Some opinions expressed in the discussion/.test(src))
    ERR(F, 'Essay uses C1-style "quoted opinions" framing; B2 First essays use two given notes + the candidate\'s own idea, no opinion quotes');
  // Model answers: each "Word count: N" should sit inside 140-190 and match the real (stripped) count.
  const modelRe = /model:\s*`([\s\S]*?)`,\s*\n?\s*note:\s*"Word count:\s*(\d+)/g;
  let m;
  while ((m = modelRe.exec(src)) !== null) {
    const real = words(stripTags(m[1])).length;
    const stated = Number(m[2]);
    if (real < 140 || real > 190) ERR(F, `A model answer is ${real} words (label ${stated}); B2 First target is 140-190`);
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
if (!findings.length) console.log('All B2 checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
