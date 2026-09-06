#!/usr/bin/env node
/**
 * validate-vocab.mjs - structural + content invariants for the large vocabulary tools
 * (word formation, adjectives, idioms, phrasal verbs, collocations, fixed expressions,
 * word banks, dependent prepositions). These datasets are hand-authored and large
 * (500-1500+ records each), so mistakes that would be obvious in a 20-item exam page
 * hide easily here - this validator exists to catch the classes of defect already found
 * by hand in this codebase's QC passes (WF-001/WF-002, PV-001) so they can't recur silently.
 *
 * Run:  node tools/validate-vocab.mjs        (from the repo root)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise. WARN-level issues never fail the build.
 *
 * To extend: add a check inside the relevant section. Keep ERROR for "this is wrong / a
 * learner would be marked incorrectly or shown broken content"; use WARN for "worth a
 * human look but not a hard failure" (e.g. a plausible but unusual metadata value).
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

/** Pull the balanced [...] or {...} literal that follows `const NAME =` / `var NAME=` (first match). */
function literalAfter(src, name, openChar) {
  const re = new RegExp('(?:const|var)\\s+' + name + '\\s*=\\s*');
  const m = re.exec(src);
  if (!m) throw new Error(`"${name}" not found`);
  const closeChar = openChar === '[' ? ']' : '}';
  const b = src.indexOf(openChar, m.index);
  let depth = 0;
  for (let j = b; j < src.length; j++) {
    if (src[j] === openChar) depth++;
    else if (src[j] === closeChar) { depth--; if (depth === 0) return src.slice(b, j + 1); }
  }
  throw new Error(`"${name}" is unbalanced`);
}
function evalLiteral(src, name, openChar) {
  // eslint-disable-next-line no-new-func
  return Function('return (' + literalAfter(src, name, openChar) + ');')();
}

/** Em dash and spaced en dash are banned sitewide (existing repo-wide convention). */
function dashScan(file, src) {
  if (/—|&mdash;/.test(src)) ERR(file, 'contains an em dash (— or &mdash;)');
  if (/ – | &ndash; /.test(src)) ERR(file, 'contains a spaced en dash used as punctuation');
}

/** Strip HTML tags/entities and lowercase, for near-duplicate text comparison. */
const plainWords = (s) =>
  (s || '')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'or', 'is', 'be', 'do',
  'someone', 'something', 'somebody', 'and', 'for', 'with']);

/** Jaccard word-overlap between two definitions, ignoring stopwords - catches "same sense,
 * restated" duplicates (the PV-001 defect class) without flagging genuinely different senses. */
function defOverlap(a, b) {
  const wa = new Set(plainWords(a).filter((w) => !STOP.has(w)));
  const wb = new Set(plainWords(b).filter((w) => !STOP.has(w)));
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  wa.forEach((w) => { if (wb.has(w)) shared++; });
  return shared / new Set([...wa, ...wb]).size;
}

/* ------------------------------------------------------------------ word-formation-content.html */
function checkWordFormation() {
  const F = 'word-formation-content.html';
  const src = read(F);
  dashScan(F, src);
  const FAMILIES = evalLiteral(src, 'FAMILIES', '[');

  const ALLOWED_POS = new Set(['verb', 'noun', 'adj', 'adv', 'neg', 'prep']);
  FAMILIES.forEach((fam) => {
    const seenForms = new Set();
    fam.rows.forEach((r) => {
      if (!ALLOWED_POS.has(r.pos)) WARN(F, `${fam.id}: unrecognised pos "${r.pos}"`);
      // Keyed on pos+form, not form alone: the same spelling legitimately serves two
      // parts of speech all the time (verb "change" / noun "change", noun "consumer" /
      // adj "consumer") - that's correct English, not a duplicate row.
      const formKey = r.pos + '|' + r.form.toLowerCase();
      if (seenForms.has(formKey)) ERR(F, `${fam.id}: duplicate ${r.pos} form "${r.form}"`);
      seenForms.add(formKey);

      // Regression test for WF-001/WF-002: the same alternative-trying, gloss-stripping
      // logic buildPool() uses in word-formation-content.html itself. If this fails, a
      // practice item will be SILENTLY dropped from the pool with no visible error to
      // the learner - that silence is exactly what let WF-001/WF-002 go unnoticed.
      const alts = r.form.replace(/\s*\([^)]*\)\s*$/, '').split('/').map((s) => s.trim());
      const found = alts.some((alt) => {
        const re = new RegExp('(^|[^a-zA-Z])(' + alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-zA-Z]*)', 'i');
        return re.test(r.example);
      });
      if (!found) ERR(F, `${fam.id}/${r.form}: example does not contain the target form - "${r.example}"`);
    });
  });
}

/* ------------------------------------------------------------------ adjectives-content.html */
function checkAdjectives() {
  const F = 'adjectives-content.html';
  const src = read(F);
  dashScan(F, src);
  const ADJ_DATA = evalLiteral(src, 'ADJ_DATA', '[');

  const ALLOWED_TYPE = new Set(['gradable', 'nongrad', 'strong']);
  const ALLOWED_FREQ = new Set(['common', 'somewhat', 'less']);
  const seen = new Set();
  ADJ_DATA.forEach((a) => {
    if (!ALLOWED_TYPE.has(a.type)) WARN(F, `"${a.word}": unrecognised type "${a.type}"`);
    if (!ALLOWED_FREQ.has(a.freq)) WARN(F, `"${a.word}": unrecognised freq "${a.freq}"`);
    if (!a.def || !a.ex) ERR(F, `"${a.word}": missing def or ex`);
    const key = a.word + '|' + a.cat;
    if (seen.has(key)) ERR(F, `duplicate entry: "${a.word}" in category "${a.cat}"`);
    seen.add(key);
  });
}

/* ------------------------------------------------------------------ idioms-content.html */
function checkIdioms() {
  const F = 'idioms-content.html';
  const src = read(F);
  dashScan(F, src);
  const DATA = evalLiteral(src, 'DATA', '[');
  const ID_GROUPS = evalLiteral(src, 'ID_GROUPS', '[');
  const ALLOWED_CATS = new Set(ID_GROUPS.flatMap((g) => g.cats));
  const ALLOWED_FREQ = new Set(['verycommon', 'common', 'less']);
  const ALLOWED_TIER = new Set([1, 2, 3]);

  const seen = new Set();
  DATA.forEach((it) => {
    if (seen.has(it.i)) ERR(F, `duplicate idiom: "${it.i}"`);
    seen.add(it.i);
    if (!ALLOWED_FREQ.has(it.freq)) WARN(F, `"${it.i}": unrecognised freq "${it.freq}"`);
    if (!ALLOWED_TIER.has(it.t)) WARN(F, `"${it.i}": unrecognised tier "${it.t}"`);
    if (!it.d || !it.e) ERR(F, `"${it.i}": missing def or example`);
    (it.c || []).forEach((c) => {
      if (!ALLOWED_CATS.has(c)) ERR(F, `"${it.i}": category "${c}" is not registered in ID_GROUPS (won't be browsable)`);
    });
  });
}

/* ------------------------------------------------------------------ phrasal-verbs-content.html */
function checkPhrasalVerbs() {
  const F = 'phrasal-verbs-content.html';
  const src = read(F);
  dashScan(F, src);
  const pvData = evalLiteral(src, 'pvData', '[');
  const ALLOWED_FREQ = new Set(['common', 'somewhat', 'less']);

  const byPv = new Map();
  pvData.forEach((cat) => {
    cat.entries.forEach((e) => {
      if (!ALLOWED_FREQ.has(e.freq)) WARN(F, `"${e.pv}" (${cat.name}): unrecognised freq "${e.freq}"`);
      if (!e.def || !e.ex) ERR(F, `"${e.pv}" (${cat.name}): missing def or ex`);
      if (!byPv.has(e.pv)) byPv.set(e.pv, []);
      byPv.get(e.pv).push({ cat: cat.name, ...e });
    });
  });

  // Regression test for PV-001: a headword repeated across categories is fine (real
  // polysemy, e.g. "take off") UNLESS two of its senses are basically the same
  // definition restated - that's a duplicate record, not a distinct sense.
  byPv.forEach((entries, pv) => {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const overlap = defOverlap(entries[i].def, entries[j].def);
        if (overlap >= 0.6) {
          // WARN, not ERR: this is a fuzzy heuristic (word-overlap), not a hard fact -
          // some genuinely distinct senses will share most of their wording by chance.
          // A human should read the flagged pair and decide, same as the PV-001 pass did.
          WARN(F, `"${pv}": possible duplicate sense between "${entries[i].cat}" and "${entries[j].cat}" ` +
            `(defs: "${entries[i].def}" / "${entries[j].def}")`);
        }
      }
    }
  });
}

/* ------------------------------------------------------------------ collocations-content.html */
function checkCollocations() {
  const F = 'collocations-content.html';
  const src = read(F);
  dashScan(F, src);
  const DATA = evalLiteral(src, 'DATA', '[');
  const ALLOWED_FREQ = new Set(['common', 'somewhat', 'less']);

  const seen = new Set();
  DATA.forEach((it) => {
    if (!ALLOWED_FREQ.has(it.freq)) WARN(F, `"${it.c}": unrecognised freq "${it.freq}"`);
    if (!it.d || !it.e) ERR(F, `"${it.c}": missing def or example`);
    const key = it.c + '|' + it.cat;
    if (seen.has(key)) ERR(F, `duplicate entry: "${it.c}" in category "${it.cat}"`);
    seen.add(key);
  });
}

/* ------------------------------------------------------------------ fixed-expressions-content.html */
function checkFixedExpressions() {
  const F = 'fixed-expressions-content.html';
  const src = read(F);
  dashScan(F, src);
  const CATS = evalLiteral(src, 'CATS', '[');
  const ALLOWED_REG = new Set(['formal', 'informal', 'neutral']);
  const ALLOWED_LEVEL = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

  CATS.forEach((cat) => {
    const seen = new Set();
    (cat.items || []).forEach((it) => {
      if (!ALLOWED_REG.has(it.reg)) WARN(F, `"${it.expr}" (${cat.label}): unrecognised register "${it.reg}"`);
      if (!ALLOWED_LEVEL.has(it.level)) WARN(F, `"${it.expr}" (${cat.label}): unrecognised level "${it.level}"`);
      if (!it.def || !it.ex) ERR(F, `"${it.expr}" (${cat.label}): missing def or example`);
      if (seen.has(it.expr)) ERR(F, `duplicate expression "${it.expr}" in category "${cat.label}"`);
      seen.add(it.expr);
    });
  });
}

/* ------------------------------------------------------------------ word-banks-content.html */
function checkWordBanks() {
  const F = 'word-banks-content.html';
  const src = read(F);
  dashScan(F, src);
  const m = /<script id="topicsData"[^>]*>([\s\S]*?)<\/script>/.exec(src);
  if (!m) { ERR(F, 'topicsData script block not found'); return; }
  const topics = JSON.parse(m[1]);
  const ALLOWED_POS = new Set(evalLiteral(src, 'POS_ORDER', '['));

  Object.entries(topics).forEach(([bankId, bank]) => {
    Object.entries(bank.DATA || {}).forEach(([tier, rows]) => {
      const seen = new Set();
      rows.forEach((row) => {
        if (row.length !== 4) {
          ERR(F, `${bankId}/${tier}: row has ${row.length} fields, expected 4 [word, pos, def, example] - ${JSON.stringify(row)}`);
          return;
        }
        const [word, pos, def, example] = row;
        if (!ALLOWED_POS.has(pos)) WARN(F, `${bankId}/${tier}/"${word}": unrecognised pos "${pos}"`);
        if (!def || !example) ERR(F, `${bankId}/${tier}/"${word}": missing def or example`);
        if (seen.has(word)) ERR(F, `${bankId}/${tier}: duplicate word "${word}"`);
        seen.add(word);
      });
    });
  });
}

/* ------------------------------------------------------------------ prepositions-content.html */
function checkPrepositions() {
  const F = 'prepositions-content.html';
  const src = read(F);
  dashScan(F, src);
  const dep_D = evalLiteral(src, 'dep_D', '{');

  Object.entries(dep_D).forEach(([cat, rows]) => {
    const seen = new Set();
    rows.forEach((row) => {
      if (row.length !== 5) {
        ERR(F, `${cat}: row has ${row.length} fields, expected 5 [combo, type, def, example, answer] - ${JSON.stringify(row)}`);
        return;
      }
      const [combo, , def, example, answer] = row;
      if (!def || !example) ERR(F, `${cat}/"${combo}": missing def or example`);
      if (!answer) ERR(F, `${cat}/"${combo}": missing answer preposition`);
      if (example && !example.includes('___')) ERR(F, `${cat}/"${combo}": example has no ___ gap - "${example}"`);
      if (seen.has(combo)) ERR(F, `${cat}: duplicate combo "${combo}"`);
      seen.add(combo);
    });
  });
}

/* ------------------------------------------------------------------ run everything */
checkWordFormation();
checkAdjectives();
checkIdioms();
checkPhrasalVerbs();
checkCollocations();
checkFixedExpressions();
checkWordBanks();
checkPrepositions();

const errors = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');

findings.forEach((f) => console.log(`[${f.level}] ${f.file}: ${f.msg}`));
console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
process.exit(errors.length > 0 ? 1 : 0);
