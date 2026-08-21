# johnplusenglish.com

Static site, GitHub Pages (`CNAME` → johnplusenglish.com), deployed straight from `main` on push —
**every push to `main` goes live immediately**, no staging.

## Freshness check — do this first, every session

This file was last synced against commit `6e927ce` (2026-08-21). Run
`git log --oneline 6e927ce..HEAD | wc -l` — if it's a large number (this repo moves fast, ~2-3
commits/hour is normal across concurrent sessions; treat 40+ as "a lot"), skim
`git log --oneline 6e927ce..HEAD` for anything structural (new page pattern, new gating/redirect
logic, sidebar/tools.html changes, a new shared component) before starting your task, and update
this section (new SHA + whatever changed) if you find something. Don't do a deep audit — a skim of
commit *messages* is usually enough to tell if something here is now wrong or missing. This keeps
the file's cost proportional to how much has actually changed, not to calendar time — no scheduled
job does this automatically, because an unattended agent periodically writing to a live,
concurrency-sensitive repo is a worse risk than an occasionally-slightly-stale doc.

## Active-work coordination (read before any multi-file edit)

Before starting a task that touches many files (sidebar-wide changes, a cross-page pattern rollout,
anything like the past incidents below), check `.claude/active-work.md` in this repo (gitignored,
local to this Mac, shared across concurrent sessions since they all use this same working
directory). If another session has an entry there, treat it like a dirty `git status` — don't step
on it, ask before proceeding if it looks like it'll touch the same files. Add your own one-line
entry (timestamp, what you're touching, session identifier) before starting, remove it when you
commit/push or abandon the task. This is best-effort, not a real lock — it doesn't replace `git
status --short` before staging.

## Current site state (volatile — check this is still true)

As of commit `6e927ce`, the site is gated: `lock.js` (included on every page) redirects to
`lock.html` unless `sessionStorage['jpe-unlocked-v1'] === '1'`, EXCEPT `level-test.html` which is
the free, public entry point (linked directly from the lock screen as the primary CTA). This is a
deliberate temporary state (soft-launching Level Test alone) — don't assume the rest of the site is
meant to stay hidden forever, and don't remove the lock without asking. To test other pages
locally/live, set that sessionStorage key first.

`ielts-writing-content.html` has a "Study Resources" tab pattern (recently added/iterated) for
grouping study-tool links inside a content page rather than the sidebar — check that file as the
reference if asked to add something similar elsewhere, rather than inventing a new pattern.

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

**The sidebar IS a shared component (since 2026-08-21, commit `f9ba4a1`)** — do not paste it back
into individual files. The 51 sidebar-bearing wrapper pages (all except the legacy `tools.html`
shim) each load three shared assets instead of embedding the sidebar directly:
- `/assets/shell.css` — sitewide chrome CSS (topnav, sidebar, accordion, collapse behaviour)
- `/assets/shell.js` — `JPE_TITLES` map + all nav/collapse/soft-navigation JS
- `/assets/sidebar-nav.html` — the actual category/tool-link markup, injected via a synchronous
  `document.write(XHR(...))` at the exact spot the old inline `<nav id="sidebar">` used to sit
  (keeps it render-blocking so there's no flash of an empty sidebar)

To change a category or tool row: edit `/assets/sidebar-nav.html` once — it applies to every page
immediately, no multi-file sed needed. To change sidebar styling: edit `/assets/shell.css`. To
change nav/collapse behaviour: edit `/assets/shell.js`. `index.html` and `exam-photos-speaking.html`
each have one small extra inline `<script>` alongside the shared tag for page-specific behaviour
(home hash-routing; a query-string forward) — don't confuse that with the shared block. Always
verify via local `python3 -m http.server` + browser click-through before shipping (soft-nav,
active-state highlight, collapse toggle) since this is now a single point of failure for every page.

## What NOT to read/grep during exploration

- `images/`, `audio/`, `pdfs/` — binary assets, never source. Don't open or grep these directories.
- `.git/` — ~151MB (history was rewritten/pruned 2026-08-21 to drop dead pre-compression
  image/audio blobs; a full mirror backup of the pre-rewrite history exists at
  `~/Documents/johnplusenglish-ui.github.io-BACKUP-20260821-102440` if anything's ever needed from
  before that). Irrelevant to almost every task; don't `git log -p` or full-history operations
  unless specifically asked to investigate history. Don't repeat a history rewrite without checking
  for other active sessions first (`ListAgents`) — it requires a force-push.
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
3. For anything that still legitimately touches many files (not the sidebar anymore — see
   Architecture above), spot-check at least one file that *wasn't* part of the automated
   find-and-replace to make sure it didn't need the same fix and wasn't missed.
