# Shadowing pronunciation tool — build plan

**Status:** plan agreed, nothing built yet.
**Branch:** `claude/gifted-mayer-we8cnq` (do NOT build on `main` — pushes to `main` go live instantly).
**Last updated:** 2026-11-07

---

## 1. What it is

A shadowing trainer for everyday spoken English. A learner hears a short, natural
question-and-answer exchange, then speaks *along with* the model voice — copying rhythm,
stress, linking and intonation. Not reading aloud, not vocabulary drilling.

Pedagogical shape, which drives every technical decision below:

1. Chunks must be short — one sense group, roughly 2–4 seconds.
2. Replay must be instant. Latency kills the drill; nothing may make the learner wait.
3. Slow playback must not change pitch.
4. The text must show chunk boundaries, because that is where the learner breathes.
5. Progression: listen → listen + silent mouthing → shadow in sync → shadow with text
   hidden → (later) record and compare.

## 2. Where it lives

`/shadowing/` inside this repo, with its **own full-screen shell** — no sidebar, no
topnav, no `lock.js`. It links `/assets/theme.css` for colour and type tokens so it stays
visually part of the family, but it does not use `shell.css` / `shell.js` /
`sidebar-nav.html`.

Rationale: free hosting and deploy on the existing Pages setup, no new DNS or analytics,
while keeping the audio-first one-card-at-a-time layout the tool actually needs. Because
it is a self-contained static folder it can be lifted to its own repo and domain later
without a rewrite, or cross-linked from the main site, whichever way it goes.

**Open decision for John:** omitting `lock.js` makes `/shadowing/` publicly reachable, like
`level-test.html`. A gated standalone product cannot be shared, so public is the default
assumption here — but it means a second thing is outside the soft-launch lock. Confirm
before phase 1 ships.

## 3. Content model

Hand-authored JSON, one file per topic: `/shadowing/data/<topic>.json`.

```json
{
  "topic": "greetings-and-introductions",
  "title": "Greetings & Introductions",
  "level": "B1",
  "cards": [
    {
      "id": "g01",
      "q": "So, where are you from originally?",
      "a": "I'm from a little town | just outside Madrid | — you've probably never heard of it.",
      "note": "linking: from_a, just_outside. Stress: LIT-tle, mad-RID."
    }
  ]
}
```

- `|` marks chunk boundaries and is **authored by hand, not auto-split.** Sense-group
  chunking is a teaching judgement; an algorithm splitting on commas and word counts will
  get it wrong in exactly the places that matter.
- Answers are written as *speech*, not prose: contractions, false starts where natural,
  the odd `well` or `I mean`. This is the single biggest quality lever in the project and
  the part that cannot be automated away.
- `level` is on the file from day one so an advanced variant of each topic slots in later
  without a format change. The existing 50-topic `speaking-questions-content.html` bank
  (simple/advanced, ~10 questions each) is the natural source for the *questions*; the
  model answers are new writing.

## 4. Audio pipeline

Static site, no server: **audio is pre-generated at build time and committed.**

`build-shadowing-audio.py` — reads the topic JSON, synthesises what has changed, writes
MP3s into `/shadowing/audio/`, and emits `/shadowing/data/manifest.json`.

Key decisions:

- **One audio set, browser-side slow playback.** No separate slow files. The player uses
  `audio.playbackRate` with `preservesPitch = true` for 0.7× / 0.85× / 1×. Halves the
  file count and removes a whole class of build complexity.
- **Content-hash cache.** The manifest stores a hash of (text + voice + model + settings)
  per clip. The build skips anything unchanged. This matters more than money: every
  regenerated MP3 is a permanent new blob in a `.git` that is already ~151MB.
- **`AUDIO_BASE` is configurable in the manifest** from day one. If the audio ever
  outgrows the repo, moving `/shadowing/audio/` to its own repo + jsDelivr, or to R2, is a
  one-line change rather than a refactor.
- **Never casually re-bake everything.** A voice change is a deliberate, one-time,
  reviewed operation.

### Cost — a non-issue, stated plainly

~280 characters of synthesis per card (question + full answer + chunks). 100 cards ≈
28,000 characters. At Google Cloud TTS Chirp 3 HD rates (~$30 per million characters) that
is **under a dollar**, and may fall inside the monthly free tier. Even the full 400-card
two-level build is a few dollars.

So cost does not constrain anything. The real costs are: writing good model answers,
git blob churn, and player UX. Budget attention accordingly.

### The one real technical unknown: chunk timing

To drill a single chunk we need its audio. Three ways, to be settled in phase 0:

- **(A) SSML marks + timepointing.** Google Cloud TTS with `<mark name="c1"/>` and
  timepointing returns exact offsets, so one *naturally-prosodied* synthesis can be sliced
  at build time with ffmpeg. Best quality, fewest files. Caveat: SSML mark support varies
  by voice tier — Neural2/Studio are safe, Chirp 3 HD has historically been limited.
  **Verify against the voice we actually like.**
- **(B) Synthesise chunks separately.** Works with any model including Gemini TTS, which
  takes plain-text style prompts rather than SSML. Costs a full utterance *plus* per-chunk
  clips. Downside: a chunk synthesised in isolation loses sentence-level intonation, so
  the chunk audio and the full-utterance audio won't quite match — pedagogically
  noticeable.
- **(C) Forced alignment.** Run the full synthesis through a word-level aligner against
  the known text, cut at chunk boundaries. Model-agnostic and keeps natural prosody, at
  the cost of a heavy build dependency.

Preference: A if it works on a voice we like, else C, else B.

### Voices

Confirm the current model ID at build time rather than trusting any doc — Google's TTS
model names have been moving fast (sources below disagree between `gemini-3.1-flash-tts`,
`gemini-3.8-flash-tts`, and the older `gemini-2.5-*-tts` line, alongside the separate
Cloud TTS Chirp 3 HD / Neural2 / Studio tiers). The build script should treat
model + voice as config, never hardcode.

**Assumed default, easily changed:** British English, two voices — question in voice A,
answer in voice B, so each card sounds like a real exchange rather than one person
talking to themselves. Voice is a field in the manifest, so re-casting is a config edit
plus a deliberate re-bake.

## 5. Player UX

Mobile-first, one card at a time, large touch targets.

- Big primary play button → full answer at natural speed.
- Answer text rendered as tappable **chunk pills**. Tap a chunk → that chunk alone, looped.
- Speed: 0.7× / 0.85× / 1×, pitch preserved.
- **Shadow mode** — the core drill: chunk → silence of equal length → chunk again. Pure JS
  timing, no extra audio, and the single most valuable feature in the tool.
- Hide-text toggle, for the last step of the progression.
- Keyboard: space = play/pause, ←/→ = chunk, 1/2/3 = speed.
- **Preload the current card's chunks and the next card's** so nothing ever waits on a
  network round trip.
- Progress in `localStorage`: cards shadowed, per-topic completion, streak. No accounts,
  no backend.

## 6. Phases

| Phase | Deliverable | Notes |
|---|---|---|
| **0** | Voice & timing spike | 3 test cards, 2–3 model/voice combos. Decide A/B/C for chunk timing. No site changes, output to scratchpad. John listens and picks the voices. |
| **1** | Pilot topic live end-to-end | `/shadowing/` shell, data format, build script, 1 topic × 10 cards, minimal player. Proves the whole pipeline. |
| **2** | Player proper | Chunk pills, shadow mode, speed, loop, hide-text, keyboard, preloading, progress. |
| **3** | Content to Core 100 | 10 topics × 10 cards, one level. Written and reviewed in batches, each batch committed and pushed on its own. |
| **4** | Record & compare | `MediaRecorder`, A/B against the model. Nothing uploaded. Mic permissions + iOS Safari handling. |
| **5** | Polish | Deep links per card, per-topic SEO pages, printable transcript, cross-links from the main site, decide on the lock. |

Phase 0 before anything else, because the voice and the chunk-timing answer determine the
data format and the build script. Phase 1 ships small and live so the player gets used in
a real lesson before bulk content is written.

## 7. Explicitly out of scope

- **Pronunciation scoring.** Google has no good per-phoneme scoring API; Azure does. It
  would need a backend and a paid per-request service, and a wrong score teaches a learner
  the wrong thing. Not in v1, possibly never.
- Accounts, sync, payments.
- Live TTS in the browser. The existing `pron.html` calls an API with a user-supplied key;
  that pattern is wrong here — it would be slow, would leak keys, and defeats offline use.

## 8. Repo hygiene (see CLAUDE.md)

- Never `git add -u` / `git add -A`. `git status --short` first, stage by name.
- Audio batches: generate → review → commit → push, one topic at a time. Do not leave
  generated MP3s uncommitted in a working tree shared by concurrent sessions.
- Add an `.claude/active-work.md` entry before any phase that touches shared assets.
- Local check with `python3 -m http.server` before every push.

## 9. Sources consulted (verify before relying on)

- https://cloud.google.com/text-to-speech/pricing
- https://ai.google.dev/gemini-api/docs/speech-generation (blocked from this session's network)
- https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
