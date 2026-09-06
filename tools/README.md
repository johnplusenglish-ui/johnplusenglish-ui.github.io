# Cambridge exam page tooling

Covers both the C1 Advanced pages and the B2 First pages. The two levels have real format
differences (see `validate-b2.mjs`'s header comment) - never assume a C1 rule carries over to
B2 without checking the relevant handbook first.

## `validate-c1.mjs`

Structural + content invariants for the four C1 Advanced exam pages
(`c1-reading-test-content.html`, `uoe-c1-content.html`, `c1-writing-content.html`,
`c1-speaking-content.html`).

Run it any time from the repo root:

```bash
node tools/validate-c1.mjs
```

Exit code `0` means every `ERROR`-level check passed; `1` means something is wrong
(and the offending items are printed). `WARN`-level lines are worth a look but never
fail the run.

### What it checks

- **Use of English** - 20 sets per part; Part 1 has 8 gaps / 4 options / a valid `correct`
  index; Part 2 answers are single words; Part 3 answers are never reused across sets;
  Part 4 answers are 3–6 words with the key word **inside** the gap; all `{1}`–`{8}`
  placeholders are present.
- **Reading** - Part 5 = 6 questions (and every in-context vocab item's `lineWord` really
  appears in its passage); Part 6 = 4; Part 7 = 6 keys / 7 paragraph options / exactly one
  unused; Part 8 = 10.
- **Writing** - three quoted opinions + the rubric line per essay, no B2-style framing,
  every model answer 220–260 words.
- **Speaking** - 72 Part 1 questions across 12 categories, two-aspect Part 2 prompts,
  five-option Part 3 tasks, Part 4 mapping 1:1 to Part 3.
- **Every page** - no em dash (`—` / `&mdash;`) and no spaced en dash.

Add new rules inside the relevant section. Use `ERR(...)` for "this is wrong / unfair to a
student" and `WARN(...)` for "worth a look but not a hard failure".

## `validate-b2.mjs`

Same idea, for the four B2 First exam pages (`b2-reading-test-content.html`,
`uoe-b2-content.html`, `b2-writing-content.html`, `b2-speaking-content.html`). B2 First is
**not** just "C1 with smaller numbers" - confirmed against the official Cambridge "First
Handbook for teachers": Use of English Part 4 (KWT) answers are **2–5 words** (not 3–6);
Reading has only **three** parts (5 MCQ, 6 sentence-removal, 7 ten-question multiple matching,
no C1-style Part 8); Writing's essay is built from **two** given notes plus the candidate's own
third idea (not three quoted opinions), target **140–190** words; Speaking Part 2 gives **two**
photos and **one** printed question (not three photos / a two-aspect prompt). Run:

```bash
node tools/validate-b2.mjs
```

Same ERROR/WARN convention as `validate-c1.mjs`.

## `validate-b1.mjs`

For the four B1 Preliminary pages (`b1-reading-test-content.html`, `b1-writing-content.html`,
`b1-speaking-content.html`, `b1-grammar-content.html`). B1 Preliminary (PET) is a different
exam again, confirmed against the official Cambridge B1 Preliminary 2022 sample papers:
Reading has **six** parts (P1 five signs / 3 options, P2 match five people to eight texts,
P3 five 4-option MC on a long text, P4 five sentences removed from a text with eight options,
P5 six 4-option MC cloze, P6 six open-cloze one-word gaps); Writing is a compulsory Part 1
**email** (~100 words, replying to a friend's email and **four** notes, one of which asks a
question back) plus a Part 2 choice of an **article or a story** (~100 words, the story given
as an opening sentence); Speaking Part 2 is describing **one** photo alone (not comparing two).
The `grammar` page is a supplementary resource, so only the dash check applies to it. Run:

```bash
node tools/validate-b1.mjs
```

Same ERROR/WARN convention as the others.

## `validate-c2.mjs`

For the four C2 Proficiency (CPE) pages (`uoe-c2-content.html`, `c2-reading-test-content.html`,
`c2-writing-content.html`, `c2-speaking-content.html`). C2 differs from C1 (confirmed against the
official Cambridge C2 Proficiency 2020 sample papers): Use of English Part 4 (KWT) answers are
**three to eight** words; Reading has **three** parts (5 MC on a literary extract, 6 a GAPPED TEXT
with **seven** paragraphs removed and eight options, 7 multiple matching of 10 questions to
sections A-E which **may be reused**); Writing Part 1 is a 240-280-word essay summarising and
evaluating **two** input texts and Part 2 (article/letter/report/review) is 280-320 words;
Speaking has **three** parts. Word-formation answer reuse is a WARN here (not an ERROR as in
C1/B2): the C2 bank is large and rotated one test at a time, so a repeat is a diversity nudge
rather than a defect. Run:

```bash
node tools/validate-c2.mjs
```

## `validate-vocab.mjs`

Structural + content invariants for the large vocabulary tools - word formation, adjectives,
idioms, phrasal verbs, collocations, fixed expressions, word banks, and dependent
prepositions (`word-formation-content.html`, `adjectives-content.html`, `idioms-content.html`,
`phrasal-verbs-content.html`, `collocations-content.html`, `fixed-expressions-content.html`,
`word-banks-content.html`, `prepositions-content.html`). These datasets run 500-1500+ records
each, hand-authored - the kind of mistake that's obvious in a 20-item exam page hides easily
at that size. Run:

```bash
node tools/validate-vocab.mjs
```

Same ERROR/WARN convention as the exam validators.

### What it checks

- **Word formation** - every practised form must actually appear in its own example
  (word-boundary match, trying every `/`-alternative with any trailing `(preposition)` gloss
  stripped) - this is a permanent regression test for the WF-001/WF-002 defects (a form that
  doesn't match its example gets silently dropped from practice, with no visible error).
  Duplicate `pos`+`form` pairs are flagged (the same spelling legitimately serving two parts
  of speech, e.g. verb "change" / noun "change", is NOT a duplicate).
- **Phrasal verbs** - a headword repeated across theme categories is normal polysemy (e.g.
  "take off" ×4), but WARNs if two of its senses have high word-overlap in their definitions -
  a permanent regression test for the PV-001 defect class (same sense, restated under a
  second category).
- **Idioms** - every category tag actually exists in `ID_GROUPS` (an unregistered category is
  unbrowsable dead weight), no duplicate idiom text, `freq`/`t` values from the known sets.
- **Adjectives, collocations** - no duplicate headword+category pairs, `freq`/`type` values
  from the known sets.
- **Fixed expressions** - no duplicate expression within a category, `reg` from
  formal/informal/neutral, `level` a real CEFR band.
- **Word banks** - every entry is the expected 4-tuple `[word, pos, def, example]`, `pos` from
  the declared set, no duplicate word within a tier.
- **Dependent prepositions** - every entry is the expected 5-tuple, the example actually
  contains a `___` gap, the answer preposition isn't empty, no duplicate combo within a
  category.
- **Every page** - no em dash (`—` / `&mdash;`) and no spaced en dash.

Duplicate/near-duplicate checks that rely on exact structural facts (same headword+category,
same word+pos) are `ERR`; the phrasal-verb sense-overlap check is a fuzzy heuristic and is
`WARN` only - a human should read the flagged pair and decide, the same way the PV-001 pass did.

## `build-c1-manifest.mjs` + item analytics

The C1 Use of English (Parts 1–4) and Reading (Parts 5–8) pages log **anonymous, aggregate**
answer data via `/item-analytics.js` (same cookieless abacus counter service as the pageview
counter - no accounts, no names, no per-student records). For multiple-choice items it counts
which option was chosen; for typed gaps it counts attempts and correct answers.

`node tools/build-c1-manifest.mjs` regenerates `c1-item-manifest.json` (the list of every
scored item + its correct answer). **Run it after editing C1 exam content** so the dashboard
stays in sync.

Open **`/c1-insights.html`** (John-only, `noindex`, not linked anywhere) to read the data back.
Pick a part, press **Load**, and it flags:

- **high miss** - most learners get it wrong (likely mis-keyed or too hard),
- **ambiguous** - a wrong option is chosen nearly as often as the key,
- **low data** - not enough attempts yet to judge.

Worst items sort to the top. Counts are cached in the browser; **Refresh from server** re-fetches.

### The B2 First sibling

The B2 First pages (`uoe-b2-content.html`, `b2-reading-test-content.html`) run the same
analytics pipeline, but in a separate counter namespace so the two levels never merge. The
pages set `window.JPE_LA_PREFIX = 'b2f_'` before loading `item-analytics.js` (C1 keeps the
default `c1a_`). B2 First Reading has only Parts 5-7 (no Part 8).

- `node tools/build-b2-manifest.mjs` regenerates `b2-item-manifest.json` (710 items). **Run
  it after editing B2 exam content.**
- Dashboard: **`/b2-insights.html`** (John-only, `noindex`, unlinked), the same UI as the C1
  one but reading the `b2f_` counters and the B2 manifest, and with its own browser cache
  namespace (`jpe-ins-b2:`) so cached counts don't collide with C1's.

## `hooks/pre-commit`

Optional git hook that runs the relevant validator automatically - the matching level's
validator runs when one of its pages is staged (C1, C2, B2 or B1), and `validate-vocab.mjs`
runs when any of the 8 vocabulary pages is staged. Untouched pages are skipped, so a commit
to one doesn't run the others' checks.

```bash
cp tools/hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

Once installed, a commit that touches an exam or vocabulary page and fails its validator is
blocked (override a single commit with `git commit --no-verify`).
