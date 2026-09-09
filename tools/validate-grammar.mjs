#!/usr/bin/env node
/**
 * validate-grammar.mjs — structural + answer-key invariants for the five CEFR grammar pages
 * (a1-grammar, a2-grammar, b1-grammar, b2-grammar, c1-grammar). These pages are copy-pasted from
 * one template (each has its own LESSONS array + handleOpt/checkExercise/renderExercise), so a
 * defect authored into one can easily be duplicated — a single validator over all five is exactly
 * the guard that catches it.
 *
 * Run:  node tools/validate-grammar.mjs      (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN never fails the run.
 *
 * Each LESSONS entry has an `exercises` array; every exercise has a `type`, and each type keys its
 * answer differently — this validator checks that the key is real and answerable (the "unfair to a
 * student" bug), and that the data evals at all (the failure mode that let b2fs-reading ship blank):
 *   - mc        `answer` is a STRING that must be one of `opts`
 *   - gap       `answer` is the fill string (non-empty)
 *   - transform `answer` must contain the `keyword` (a Cambridge-style key-word transformation)
 *   - builder   `answer` is a re-ordering of the `words` token pool (same multiset of tokens)
 *   - tf        `answer` ∈ {True, False, Not given}
 *   - categorise/match  correctness is the item's placement / pairing — checked structurally
 *   - convo     dialogue with inline [bracketed] answers — checked for presence only
 * Counts are WARN so lessons/exercises can be added without hard-failing a commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['a1', 'a2', 'b1', 'b2', 'c1'].map((l) => `${l}-grammar-content.html`);
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
const evalArray = (src, name) => Function('return (' + arrayLiteral(src, name) + ');')();

function dashScan(file, src) {
  if (/—|&mdash;/.test(src)) ERR(file, 'contains an em dash (— or &mdash;)');
  if (/ – | &ndash; /.test(src)) ERR(file, 'contains a spaced en dash used as punctuation');
}

const TF = new Set(['true', 'false', 'not given']);
// Normalise a token for the builder multiset check: lowercase, strip leading/trailing punctuation.
const norm = (w) => String(w).toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
const multiset = (arr) => arr.map(norm).filter(Boolean).sort().join('|');

function checkExercise(F, tag, ex) {
  const items = ex.items || [];
  switch (ex.type) {
    case 'mc':
      items.forEach((it, i) => {
        if (!Array.isArray(it.opts) || it.opts.length < 2) { ERR(F, `${tag} Q${i + 1}: mc needs ≥2 options`); return; }
        // The page's matcher accepts the WHOLE answer (a combined "blank1 / blank2" option) OR any
        // single `/`-separated alternative. The answer is answerable if at least one option matches
        // either form; if none does, the correct answer can never be selected (a real mis-key).
        // Raw whole answer (matches a combined option / a padded " - " zero-article exactly), plus
        // the trimmed `/`-alternatives (matches individual either-form options).
        const whole = String(it.answer);
        const forms = [whole, ...whole.split('/').map((a) => a.trim())].filter(Boolean);
        if (forms.length === 0) { ERR(F, `${tag} Q${i + 1}: mc has no answer`); return; }
        if (!it.opts.some((o) => forms.includes(o)))
          ERR(F, `${tag} Q${i + 1}: mc answer "${it.answer}" matches no option ${JSON.stringify(it.opts)}`);
      });
      break;
    case 'gap':
      items.forEach((it, i) => { if (!it.answer || !String(it.answer).trim()) ERR(F, `${tag} Q${i + 1}: gap has no answer`); });
      break;
    case 'transform':
      items.forEach((it, i) => {
        if (!it.answer || !String(it.answer).trim()) { ERR(F, `${tag} Q${i + 1}: transform has no answer`); return; }
        if (!it.keyword || !String(it.keyword).trim()) { WARN(F, `${tag} Q${i + 1}: transform has no keyword`); return; }
        const key = String(it.keyword).toLowerCase().trim();
        if (!String(it.answer).toLowerCase().includes(key)) ERR(F, `${tag} Q${i + 1}: transform answer "${it.answer}" does not contain the keyword "${it.keyword}"`);
      });
      break;
    case 'builder':
      items.forEach((it, i) => {
        if (!Array.isArray(it.words) || it.words.length === 0) { ERR(F, `${tag} Q${i + 1}: builder has no word pool`); return; }
        if (!it.answer || !String(it.answer).trim()) { ERR(F, `${tag} Q${i + 1}: builder has no answer`); return; }
        if (multiset(it.words) !== multiset(String(it.answer).split(/\s+/)))
          ERR(F, `${tag} Q${i + 1}: builder answer is not a re-ordering of its word pool ("${it.answer}")`);
      });
      break;
    case 'tf':
      items.forEach((it, i) => {
        if (!it.answer || !TF.has(String(it.answer).toLowerCase().trim()))
          ERR(F, `${tag} Q${i + 1}: tf answer "${it.answer}" is not True / False / Not given`);
      });
      break;
    case 'categorise': {
      const cats = ex.categories || [];
      if (cats.length < 2) ERR(F, `${tag}: categorise needs ≥2 categories`);
      cats.forEach((c) => { if (!c.name || !Array.isArray(c.items) || c.items.length === 0) ERR(F, `${tag}: category "${c.name || '?'}" has no items`); });
      break;
    }
    case 'match': {
      const pairs = ex.pairs || [];
      if (pairs.length < 2) ERR(F, `${tag}: match needs ≥2 pairs`);
      pairs.forEach((p, i) => { if (!p.left || !p.right) ERR(F, `${tag} pair ${i + 1}: missing left/right`); });
      break;
    }
    case 'convo': {
      const lines = ex.lines || [];
      if (lines.length === 0) ERR(F, `${tag}: convo has no lines`);
      if (!lines.some((l) => /\[[^\]]+\]/.test(l.text || ''))) WARN(F, `${tag}: convo has no [bracketed] answers to fill`);
      break;
    }
    default:
      WARN(F, `${tag}: unrecognised exercise type "${ex.type}"`);
  }
}

for (const F of PAGES) {
  let src;
  try { src = read(F); } catch { ERR(F, 'file not found'); continue; }
  dashScan(F, src);
  let L;
  try { L = evalArray(src, 'LESSONS'); } catch (e) { ERR(F, `LESSONS did not eval: ${e.message}`); continue; }
  if (!Array.isArray(L) || L.length === 0) { ERR(F, 'LESSONS is empty'); continue; }
  const ids = new Set();
  L.forEach((les, li) => {
    if (les.id == null) WARN(F, `lesson ${li + 1} (${les.title || '?'}): no id`);
    else if (ids.has(les.id)) ERR(F, `duplicate lesson id "${les.id}"`);
    else ids.add(les.id);
    if (!les.title) WARN(F, `lesson ${li + 1}: no title`);
    const exs = les.exercises || [];
    if (exs.length === 0) WARN(F, `lesson "${les.title || les.id}": no exercises`);
    exs.forEach((ex, ei) => {
      if (!ex.type) { ERR(F, `lesson "${les.title || les.id}" exercise ${ei + 1}: no type`); return; }
      checkExercise(F, `${les.id ?? li + 1}/"${ex.title || ex.type}"`, ex);
    });
  });
}

const errors = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');
const line = (f) => `  ${f.level === 'ERROR' ? '✗' : '!'} [${f.file}] ${f.msg}`;
if (errors.length) { console.log('\nERRORS:'); errors.forEach((f) => console.log(line(f))); }
if (warns.length) { console.log('\nWARNINGS:'); warns.forEach((f) => console.log(line(f))); }
if (!findings.length) console.log('All grammar checks passed. ✓');
else console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
