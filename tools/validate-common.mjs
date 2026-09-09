#!/usr/bin/env node
/**
 * validate-common.mjs — house-rule checks that apply to EVERY content page, not just the exam
 * and vocabulary families the level-specific validators cover.
 *
 * Run:  node tools/validate-common.mjs            (scans every *-content.html in the repo root)
 *       node tools/validate-common.mjs a.html b.html   (scans only the named files)
 * Exit: 0 if all ERROR-level checks pass, 1 otherwise.
 *
 * The single rule that is uniform across the whole site is the dash rule: no em dash (in ANY
 * render-equivalent form — the literal —, the U+2015 horizontal bar ―, the named &mdash;, or the
 * numeric &#8212; / &#x2014; entities) and no spaced en dash used as punctuation (John's firm,
 * repeatedly-stated house style). The level validators enforce the literal/named forms on their
 * own pages; this one is the authority and closes the gap for the ~45 content pages that no other
 * validator touches, so an em dash cannot slip onto ANY page in any encoding unseen. The U+2212
 * minus sign is deliberately allowed (it is a legitimate "−" UI glyph, e.g. a decrement button).
 *
 * Deliberately NOT checked here (too many legitimate uses to police blindly, would only cry wolf):
 *  - italics: shared print CSS legitimately uses font-style:italic (e.g. .print-def);
 *  - emojis: chat-activity and story-dice use them by design.
 * Keep this validator zero-false-positive so it can run on every commit without ever nagging.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];
const ERR = (file, msg) => findings.push({ file, msg });

// Files to scan: CLI args (repo-relative paths) if given, else every *-content.html in the root.
const args = process.argv.slice(2).map((a) => path.basename(a));
const files = (args.length ? args : fs.readdirSync(ROOT).filter((f) => /-content\.html$/.test(f)))
  .filter((f) => /-content\.html$/.test(f));

for (const f of files) {
  let src;
  try { src = fs.readFileSync(path.join(ROOT, f), 'utf8'); }
  catch { continue; } // a staged path that no longer exists on disk — skip quietly
  // Em dash and every render-equivalent: the literal char, the named entity, the decimal/hex
  // numeric entities (&#8212; / &#x2014;, leading zeros allowed), and the U+2015 horizontal bar.
  // NOT the U+2212 minus sign (used as a legitimate "−" UI glyph, e.g. a decrement button) or
  // hyphens/en dashes — only the em-dash family is banned outright.
  if (/—|―|&mdash;|&#0*8212;|&#[xX]0*2014;/.test(src)) ERR(f, 'contains an em dash or em-dash equivalent (—, ―, &mdash;, or a numeric em-dash entity)');
  if (/ – | &ndash; /.test(src)) ERR(f, 'contains a spaced en dash used as punctuation');
}

if (findings.length) {
  console.log('\nERRORS:');
  findings.forEach((f) => console.log(`  ✗ [${f.file}] ${f.msg}`));
  console.log(`\n${findings.length} error(s) across ${files.length} file(s) scanned.`);
  process.exit(1);
}
console.log(`All common house-rule checks passed across ${files.length} file(s). ✓`);
process.exit(0);
