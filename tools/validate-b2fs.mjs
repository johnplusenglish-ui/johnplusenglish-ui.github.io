#!/usr/bin/env node
/**
 * validate-b2fs.mjs — structural + content invariants for the B2 First FOR SCHOOLS pages.
 *
 * Run:  node tools/validate-b2fs.mjs      (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN-level issues never fail the build.
 *
 * B2 First for Schools is the SAME EXAM FORMAT as B2 First (same paper structure, same word
 * counts, same 2-5-word Key Word Transformations, same three-part Reading, same two-photo
 * Speaking Part 2) — only the topics are youth-oriented, and Writing Part 2 additionally allows
 * a STORY (a task type B2 First proper does not use). So most rules mirror validate-b2.mjs.
 *
 * The site's b2fs pages are a deliberately SMALLER resource than the full B2 First pages, and the
 * counts below reflect what was actually built (confirmed 2026-09-09), not the number of sets a
 * live sitting would draw from:
 *  - Use of English: 5 sets per part (B2 First proper carries 20).
 *  - Reading: 5 tests (same as B2 First).
 *  - Speaking: 72 Part 1 questions / 12 categories (same as B2 First), but 20 Part 2 photo sets
 *    (B2 First proper carries 10) — the Schools page doubles up the photo-comparison practice.
 *  - Writing: 5 essays, each 2 notes + the candidate's own third idea, models 140-190 words.
 *
 * This validator exists because b2fs-reading-test-content.html once shipped fully broken (its whole
 * engine + guide data missing) with no check to catch it — see the 2026-09-08 audit. Keep the
 * b2fs family under the same kind of guard the other exam levels already have.
 *
 * To extend: add a check inside the relevant section. ERROR = "this is wrong / unfair to a
 * student"; WARN = "worth a look but not a hard failure".
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

// Cambridge counts a contraction as its full expanded form (e.g. "didn't" = two words). Expand
// before counting/matching so KWT word-counts and key-word checks use a human marker's rule.
const expandContractions = (s) => s.replace(/n't\b/gi, ' not');
const words = (s) => expandContractions(s).trim().split(/\s+/).filter(Boolean);
const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');

/** Em dash and spaced en dash are banned. Unspaced en dash inside a number range is allowed. */
function dashScan(file, src) {
  if (/—|&mdash;/.test(src)) ERR(file, 'contains an em dash (— or &mdash;)');
  if (/ – | &ndash; /.test(src)) ERR(file, 'contains a spaced en dash used as punctuation');
}

// The Schools resource carries fewer sets than a live sitting draws from; these are what was built.
const UOE_SETS = 5;      // sets per Use of English part
const READING_TESTS = 5; // full reading tests
const SPEAKING_P2 = 20;  // Part 2 photo-comparison sets

/* ------------------------------------------------------------------ Use of English */
function checkUoE() {
  const F = 'uoe-b2fs-content.html';
  const src = read(F);
  dashScan(F, src);
  const T = evalArray(src, 'TESTS');       // Part 1
  const OC = evalArray(src, 'OC_TESTS');   // Part 2
  const WF = evalArray(src, 'WF_TESTS');   // Part 3
  const KWT = evalArray(src, 'KWT_TESTS'); // Part 4

  const joinText = (t) => Array.isArray(t) ? t.join('') : t;
  const placeholders = (t) => { const s = joinText(t); return Array.from({length: 8}, (_, k) => s.includes('{' + (k + 1) + '}')); };

  if (T.length !== UOE_SETS) ERR(F, `Part 1 has ${T.length} sets, expected ${UOE_SETS}`);
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

  if (OC.length !== UOE_SETS) ERR(F, `Part 2 has ${OC.length} sets, expected ${UOE_SETS}`);
  OC.forEach((s, i) => {
    const tag = `Part 2 "${s.title}" (set ${i + 1})`;
    if (s.gaps.length !== 8) ERR(F, `${tag}: ${s.gaps.length} gaps, expected 8`);
    placeholders(s.text).forEach((present, k) => { if (!present) ERR(F, `${tag}: missing {${k + 1}} in text`); });
    s.gaps.forEach((g) => {
      if (!g.answer || /\s/.test(g.answer.trim())) ERR(F, `${tag} gap ${g.num}: open-cloze answer must be a single word ("${g.answer}")`);
    });
  });

  if (WF.length !== UOE_SETS) ERR(F, `Part 3 has ${WF.length} sets, expected ${UOE_SETS}`);
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

  if (KWT.length !== UOE_SETS) ERR(F, `Part 4 has ${KWT.length} sets, expected ${UOE_SETS}`);
  KWT.forEach((s, i) => {
    const tag = `Part 4 (set ${i + 1})`;
    if (s.items.length !== 6) ERR(F, `${tag}: ${s.items.length} items, expected 6`);
    s.items.forEach((it, k) => {
      const wc = words(it.answer).length;
      // B2 First (and Schools): 2-5 words. Do NOT copy C1's 3-6.
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
  const F = 'b2fs-reading-test-content.html';
  const src = read(F);
  dashScan(F, src);
  const T = evalArray(src, 'TESTS');
  if (T.length !== READING_TESTS) ERR(F, `expected ${READING_TESTS} tests, found ${T.length}`);
  T.forEach((t, i) => {
    const tag = `Test ${i + 1}`;
    // Part 5: one text, 6 four-option MCQs.
    if (!t.P5 || t.P5.questions.length !== 6) ERR(F, `${tag} Part 5: expected 6 questions`);
    (t.P5 ? t.P5.questions : []).forEach((q, qi) => {
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
  const F = 'b2fs-speaking-content.html';
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

  // B2 (and Schools) Part 2: TWO photos, ONE printed question (not C1's three photos).
  if (sets.length !== SPEAKING_P2) ERR(F, `Part 2: expected ${SPEAKING_P2} photo sets, found ${sets.length}`);
  sets.forEach((s, i) => {
    if (s.photos.length !== 2) ERR(F, `Part 2 set ${i + 1} (${s.topic}): expected 2 photos (B2 uses two, not three)`);
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
  const F = 'b2fs-writing-content.html';
  const src = read(F);
  dashScan(F, src);
  // Essay: a "Notes - Write about:" list of exactly THREE items — TWO given content points plus a
  // "your own idea" prompt (same as B2 First; not C1-style quoted opinions).
  const noteBlocks = src.match(/Notes - Write about:<\/strong><\/p>\s*<ol[^>]*>([\s\S]*?)<\/ol>/g) || [];
  noteBlocks.forEach((b, i) => {
    const lis = (b.match(/<li>/g) || []).length;
    if (lis !== 3) ERR(F, `Essay ${i + 1}: has ${lis} notes, real B2 essays give 2 points + "your own idea" (3 total)`);
    if (!/your own idea/i.test(b)) WARN(F, `Essay ${i + 1}: notes list doesn't mention "your own idea"`);
  });
  if (/Some opinions expressed in the discussion/.test(src))
    ERR(F, 'Essay uses C1-style "quoted opinions" framing; B2 essays use two given notes + the candidate\'s own idea');
  // Model answers: each "Word count: N" should sit inside 140-190 and match the real (stripped) count.
  const modelRe = /model:\s*`([\s\S]*?)`,\s*\n?\s*note:\s*"Word count:\s*(\d+)/g;
  let m, models = 0;
  while ((m = modelRe.exec(src)) !== null) {
    models++;
    const real = words(stripTags(m[1])).length;
    const stated = Number(m[2]);
    if (real < 140 || real > 190) ERR(F, `A model answer is ${real} words (label ${stated}); B2 target is 140-190`);
    else if (Math.abs(real - stated) > 6) WARN(F, `A model answer's label says ${stated} but it is really ${real} words`);
  }
  if (models === 0) WARN(F, 'no model answers matched the expected `model: ... note: "Word count:"` shape — check the page structure');
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
if (!findings.length) console.log('All B2 First for Schools checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
