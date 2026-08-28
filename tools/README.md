# C1 tooling

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

- **Use of English** — 20 sets per part; Part 1 has 8 gaps / 4 options / a valid `correct`
  index; Part 2 answers are single words; Part 3 answers are never reused across sets;
  Part 4 answers are 3–6 words with the key word **inside** the gap; all `{1}`–`{8}`
  placeholders are present.
- **Reading** — Part 5 = 6 questions (and every in-context vocab item's `lineWord` really
  appears in its passage); Part 6 = 4; Part 7 = 6 keys / 7 paragraph options / exactly one
  unused; Part 8 = 10.
- **Writing** — three quoted opinions + the rubric line per essay, no B2-style framing,
  every model answer 220–260 words.
- **Speaking** — 72 Part 1 questions across 12 categories, two-aspect Part 2 prompts,
  five-option Part 3 tasks, Part 4 mapping 1:1 to Part 3.
- **Every page** — no em dash (`—` / `&mdash;`) and no spaced en dash.

Add new rules inside the relevant section. Use `ERR(...)` for "this is wrong / unfair to a
student" and `WARN(...)` for "worth a look but not a hard failure".

## `build-c1-manifest.mjs` + item analytics

The C1 Use of English (Parts 1–4) and Reading (Parts 5–8) pages log **anonymous, aggregate**
answer data via `/item-analytics.js` (same cookieless abacus counter service as the pageview
counter — no accounts, no names, no per-student records). For multiple-choice items it counts
which option was chosen; for typed gaps it counts attempts and correct answers.

`node tools/build-c1-manifest.mjs` regenerates `c1-item-manifest.json` (the list of every
scored item + its correct answer). **Run it after editing C1 exam content** so the dashboard
stays in sync.

Open **`/c1-insights.html`** (John-only, `noindex`, not linked anywhere) to read the data back.
Pick a part, press **Load**, and it flags:

- **high miss** — most learners get it wrong (likely mis-keyed or too hard),
- **ambiguous** — a wrong option is chosen nearly as often as the key,
- **low data** — not enough attempts yet to judge.

Worst items sort to the top. Counts are cached in the browser; **Refresh from server** re-fetches.

## `hooks/pre-commit`

Optional git hook that runs the validator automatically, but only when a C1 page is staged.

```bash
cp tools/hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

Once installed, a commit that touches a C1 page and fails validation is blocked (override a
single commit with `git commit --no-verify`).
