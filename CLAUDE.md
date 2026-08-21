# johnplusenglish.com

Static site, GitHub Pages (`CNAME` → johnplusenglish.com), deployed straight from `main` on push —
**every push to `main` goes live immediately**, no staging.

## Read this first: shared, concurrent repo

This working tree is used by multiple Claude Code sessions at once (routinely 5-9 concurrent
sessions on this Mac). Real incidents have happened here: uncommitted work silently wiped by a
concurrent session's `git reset`/`checkout`, and a `git add -u` accidentally bundling another
session's unrelated finished-but-uncommitted work into a push.

- **Never `git add -u` or `git add -A`.** Run `git status --short` first, before touching anything.
  If it shows dirty files you didn't create, that's another session's pending work — leave it, ask
  before it ends up in your commit. Stage only the exact files you edited by name.
- For a multi-file batch edit, stage each unit of work in the scratchpad first, `cp` into the repo,
  then commit+push immediately — before starting the next unit. Shrinks the window where a
  concurrent session's foreign commit can land on top of yours.
- If files you just wrote seem to vanish or revert, check `git reflog` for a foreign commit before
  assuming your own tooling is broken.

## Architecture — read before exploring the tree

Two page shapes, both must be understood before editing anything nav-related:

1. **`*.html` wrapper + `*-content.html` iframe** (the pattern for ~90 of ~142 html files). The
   wrapper holds only the sidebar/topnav chrome and an `<iframe src="X-content.html">`. The actual
   page content — the real app, e.g. a grammar drill or a reading test — lives in the sibling
   `-content.html` file and is a self-contained, independently-styled app (generic class names like
   `.container`/`.btn`, its own `<style>`/`<script>`, `<base target="_top">` so in-app links break
   out of the iframe). **Edit content in `X-content.html`, edit nav/sidebar in `X.html`.** Never
   assume they're the same file.
2. **`tools.html`** — a legacy single-page-app shell. It used to hold several tools' full data+UI
   inline in its own DOM; all of those have since been un-merged to standalone wrapper+iframe pages
   (pattern 1). What's left in `tools.html` is just `location.replace('X.html')` hash redirects for
   backward compatibility — don't add new content here, treat it as a redirect shim.

**The sidebar is NOT a shared component.** It's byte-identical HTML/CSS pasted into every one of the
52 sidebar-bearing files (`grep -l "cat-group" *.html` to get the current exact list — it changes).
Any sitewide sidebar change (new category, new tool row, recolor, layout tweak) means:
```
grep -l "<exact anchor string you're changing>" *.html   # get the file list first
```
then a scripted find-and-replace across all of them (verify the anchor string occurs exactly once
per file before touching it — a file that's drifted from the others needs a manual look, not a
blind sed), then a syntax check on any touched `<script>` blocks, then a local
`python3 -m http.server` + browser check before committing. This is inherently a many-file
operation — don't try to avoid it by editing one file and assuming the rest match; they don't
always. See `.claude/memory` (Claude's own persistent notes, if you have access to it) for the exact
history of this component if something looks broken — it's been reworked many times.

## What NOT to read/grep during exploration

- `images/`, `audio/`, `pdfs/` — binary assets, never source. Don't open or grep these directories.
- `.git/` — 392MB of history (vs. ~56MB working tree), mostly pre-compression image/audio blobs.
  Irrelevant to almost every task; don't `git log -p` or full-history operations unless specifically
  asked to investigate history.
- Any single `-content.html` file is usually 150–560KB of self-contained app code. If a task only
  concerns one tool/page, you only need that one file (plus its wrapper if the nav changes too) —
  you don't need to read sibling `-content.html` files to understand it, they're independent apps
  that happen to share a visual style, not a shared codebase.

## Conventions

- Font: Outfit (labels/body). `JetBrains Mono` is reserved for real-time digit displays only
  (selectors containing `timer`/`countdown`/`clock`) — don't reintroduce it elsewhere.
- Sidebar category colors are a fixed 10-color palette, already chosen by John — don't re-derive or
  "improve" them without being asked; if a recolor is needed, there's a standalone picker tool
  pattern for letting him choose (ask if it still exists in `~/Downloads`).
- Content pages (`*-content.html`) use a shared header pattern: `.topic-hero` (52px icon + `<h1>`,
  no description paragraph) — check an already-converted reference page (e.g.
  `word-banks-content.html`) for the exact current markup before building a new one from scratch.

## Before shipping any change here

1. Local preview: `python3 -m http.server` + browser check (Browser pane / `preview_start`), not
   just "the code looks right."
2. `git status --short` → stage only your own files by name → commit → push.
3. For anything touching many files (sidebar, shared header), spot-check at least one file that
   *wasn't* part of the automated find-and-replace to make sure it didn't need the same fix and
   wasn't missed.
