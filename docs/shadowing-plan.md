# CopyCat — build plan

**Product:** CopyCat — a shadowing pronunciation trainer for everyday spoken English.
**Lives at:** `copycat.johnplusenglish.com`, served from its own repo (see §2).
**Status:** plan agreed. Blocked on repo + DNS setup (§3). Nothing built yet.
**This file** is the planning record; it moves into the `copycat` repo at phase 1.
**Last updated:** 2026-11-07

---

## 1. What it is

A shadowing trainer. A learner hears a short, natural question-and-answer exchange, then
speaks *along with* the model voice — copying rhythm, stress, linking and intonation. Not
reading aloud, not vocabulary drilling.

Pedagogical shape, which drives every technical decision below:

1. Chunks must be short — one sense group, roughly 2–4 seconds.
2. Replay must be instant. Latency kills the drill; nothing may make the learner wait.
3. Slow playback must not change pitch.
4. The text must show chunk boundaries, because that is where the learner breathes.
5. Progression: listen → listen + silent mouthing → shadow in sync → shadow with text
   hidden → (later) record and compare.

**Brand register:** deliberately playful, unlike the exam-prep tone of johnplusenglish.
Shadowing feels ridiculous to do, and that embarrassment is the main thing stopping adult
learners from practising pronunciation out loud. A light brand gives them permission to
sound silly. Tagline direction: *"Hear it. Copy it. Own it."*

## 2. Hosting — its own repo, and why it must be

**New repo `johnplusenglish-ui/copycat`, served at `copycat.johnplusenglish.com`.**

This is not a preference, it is a constraint: a GitHub Pages `CNAME` file holds exactly
**one** domain, and a domain can be claimed by only **one** repo. This repo's `CNAME` is
already `johnplusenglish.com`, so the subdomain cannot be served from here. Different
subdomains of the same parent domain *can* each have their own repo, each pointing at
`johnplusenglish-ui.github.io`.

Three things fall out of this, all good:

- **Independent deploys.** Pushes to `copycat` never touch the live johnplusenglish.com.
  That removes the "every push to `main` goes live immediately" hazard from this entire
  project — the biggest single risk in the original plan.
- **The lock question disappears.** `lock.js` does not exist in the new repo, so CopyCat
  is public by default. No decision needed.
- **Consistent with existing practice** — `johnplusnews`, `johnplustools`,
  `johnplusbooks`, `johnplusdictionary` are all already separate repos.

Repo root **is** the site root, so paths are short: `/index.html`, `/data/`, `/audio/`,
`/assets/`.

**Theme:** copy `theme.css` (~2KB) into the new repo rather than linking it cross-origin
from johnplusenglish.com. Linking would couple the two deploys and make CopyCat depend on
a gated site. CopyCat gets its own visual register anyway, so a copy is the right call —
it starts from the same tokens and diverges freely.

## 3. Setup steps — John, before phase 1

Phase 0 (§8) needs none of this and can run first. Phase 1 is blocked until all four are done.

1. **Create the repo** `johnplusenglish-ui/copycat`, public, empty.
   (Claude cannot create repos in this session — repo creation is outside its GitHub scope.)
2. **DNS** at the johnplusenglish.com provider: add a `CNAME` record,
   host `copycat`, value `johnplusenglish-ui.github.io`.
3. **Pages settings** in the new repo: Settings → Pages → Custom domain →
   `copycat.johnplusenglish.com`. This writes the `CNAME` file automatically. Tick
   *Enforce HTTPS* once the certificate is issued.
4. Tell Claude when it exists, so it can be attached to the session with `add_repo`.

DNS propagation and certificate issuance can take a while — if the subdomain 404s at
first, wait rather than re-configuring.

## 4. Voice — decided

**Google AI voices via `gemini-3.8-flash-tts`.** Already in use and known good.

Settled and closed:

- **No voice cloning.** Google's Chirp 3 Instant Custom Voice is gated to allow-listed
  GCP projects via a sales and review process, not by geography — so a VPN cannot help,
  because the gate is bound to the project and billing account, not the IP.
- **No human recordings.** Considered and rejected; AI voice is the chosen direction.

What Gemini TTS gives us that shapes the build:

- **30 prebuilt voices** with distinct descriptors (Puck — upbeat, Charon — informative,
  Kore — firm, plus Zephyr, Fenrir and others). Two are cast per card.
- **Multi-speaker generation in a single call.** Each card is generated as a two-speaker
  exchange, so the answer's intonation genuinely responds to the question's. Two separate
  single-speaker calls cannot produce that, and for a Q&A shadowing product it is the
  single biggest naturalness win available.
- **Style control in natural language**, e.g. "conversational pace, slight pause before
  the final clause". More useful for teaching prosody than SSML ever was. The style prompt
  is a field in the card data, so delivery is tunable per card.
- **No SSML.** Therefore no `<mark>` timepointing — see §6.

Model and voice names are **config, never hardcoded**; Google's TTS model IDs have moved
fast and the public docs contradict each other.

## 5. Content model

Hand-authored JSON, one file per topic: `/data/<topic>.json`.

```json
{
  "topic": "greetings-and-introductions",
  "title": "Greetings & Introductions",
  "level": "B1",
  "voices": { "q": "Puck", "a": "Kore" },
  "cards": [
    {
      "id": "g01",
      "q": "So, where are you from originally?",
      "a": "I'm from a little town | just outside Madrid | — you've probably never heard of it.",
      "style": "relaxed, conversational, slight smile on the last clause",
      "note": "linking: from_a, just_outside. Stress: LIT-tle, mad-RID."
    }
  ]
}
```

- `|` marks chunk boundaries and is **authored by hand, not auto-split.** Sense-group
  chunking is a teaching judgement; an algorithm splitting on commas and word counts gets
  it wrong in exactly the places that matter.
- Answers are written as *speech*, not prose: contractions, the odd `well` or `I mean`.
  This is the biggest quality lever in the project and the part that cannot be automated.
- `level` is on the file from day one so an advanced variant slots in later without a
  format change. The existing 50-topic `speaking-questions-content.html` bank on the main
  site (simple/advanced, ~10 questions each) is the natural source for the *questions*;
  the model answers are new writing.

## 6. Audio pipeline

Static site, no server: **audio is pre-generated at build time and committed.**

`build-audio.py` at the repo root reads the topic JSON, generates what has changed, writes
MP3s into `/audio/`, and emits `/data/manifest.json`.

### One file per card, chunks as time ranges

The important decision. Per card:

1. **One Gemini TTS call** → two-speaker exchange (question voice + answer voice) → one
   audio stream. Gemini returns PCM, so convert to MP3 with ffmpeg.
2. **Forced-align** that audio against the known text to get word-level timings.
3. Map the hand-marked `|` boundaries onto those word timings → chunk time ranges, plus
   the question range and the answer range.
4. Manifest stores the file plus all ranges.
5. The player plays **ranges within the one loaded file**, seeking with `currentTime`.

Why this beats one clip per chunk:

- Every chunk is literally a slice of the natural utterance, so there is **zero prosody
  mismatch** between drilling a chunk and hearing the whole answer.
- Chunk replay is a seek on already-loaded audio — **no network round trip**, which is
  requirement 2 from §1.
- ~100 files instead of ~500, fewer bytes, far less git blob churn.

### Chunk timing — the one real unknown

No SSML means no `<mark>` timepointing, so:

- **Preferred: forced alignment.** Aligning against *known* text is the accurate case
  (alignment, not transcription). Build dependency is the cost — `whisper-timestamped`,
  WhisperX or MFA.
- **Fallback, per failing card:** synthesise that card's chunks separately. Costs a
  prosody mismatch on those cards only, rather than all of them.
- **Build-time QA gate:** flag any card where alignment confidence is low or a chunk
  duration looks wrong (under ~0.4s or over ~6s) for manual review. Never ship unreviewed
  timings — a mis-cut chunk teaches the wrong rhythm.

### Other pipeline decisions

- **One audio set; slow playback in the browser.** No separate slow files. The player uses
  `audio.playbackRate` with `preservesPitch = true` for 0.7× / 0.85× / 1×.
- **Content-hash cache.** The manifest stores a hash of (text + style + voices + model)
  per card; the build skips anything unchanged. Every regenerated MP3 is a permanent new
  blob in git, so this matters more than the money.
- **`AUDIO_BASE` configurable** from day one, so moving `/audio/` to jsDelivr or R2 later
  is a one-line change.
- **Never casually re-bake everything.** A voice recast is a deliberate, reviewed,
  one-time operation.

### Scale and cost

100 cards × ~8s ≈ 13 minutes of audio ≈ **6–7MB** across ~100 files — a comfortable size
for a fresh repo, and it starts with clean history rather than the main site's ~151MB.
Synthesis is roughly 16,000 characters total; Gemini TTS bills per audio token (~$20/M)
and is reportedly outside the free tier, so the whole build costs small change.

Cost constrains nothing. The real costs are **writing good model answers** and
**player UX**. Budget attention accordingly.

## 7. Player UX

Mobile-first, one card at a time, large touch targets.

- Big primary play button → the full exchange, then the answer alone.
- Answer text rendered as tappable **chunk pills**. Tap a chunk → that range, looped.
- Speed: 0.7× / 0.85× / 1×, pitch preserved.
- **Shadow mode** — the core drill: chunk → silence of equal length → chunk again. Pure JS
  timing over the ranges, no extra audio, and the most valuable feature in the tool.
- Hide-text toggle, for the last step of the progression.
- Keyboard: space = play/pause, ←/→ = chunk, 1/2/3 = speed.
- **Preload the current and next card's file** so nothing ever waits on the network.
- Progress in `localStorage`: cards shadowed, per-topic completion, streak. No accounts,
  no backend.

## 8. Phases

| Phase | Deliverable | Notes |
|---|---|---|
| **0** | Voice-casting + alignment spike | 3 test cards, 2–3 voice pairs, multi-speaker call, style prompts. Prove forced alignment gives usable chunk ranges. Scratchpad only — **needs no repo and no DNS**, so it runs first. John picks the voice pair. |
| **1** | Pilot topic live end-to-end | New repo scaffold, CopyCat shell + theme, data format, build script, 1 topic × 10 cards, minimal player. Live on the subdomain. |
| **2** | Player proper | Chunk pills, shadow mode, speed, loop, hide-text, keyboard, preloading, progress. |
| **3** | Content to Core 100 | 10 topics × 10 cards, one level. Written and reviewed in batches; each batch committed and pushed on its own. |
| **4** | Record & compare | `MediaRecorder`, A/B against the model. Nothing uploaded. Mic permissions + iOS Safari handling. |
| **5** | Polish | Deep links per card, per-topic SEO, printable transcript, cross-links from johnplusenglish.com. |

Phase 0 first: the voice pair and the alignment answer determine the data format and the
build script, and it is unblocked today. Phase 1 ships small and live so the player gets
used in a real lesson before bulk content is written.

## 9. Explicitly out of scope

- **Pronunciation scoring.** Google has no good per-phoneme scoring API; it would need a
  backend and a paid per-request service, and a wrong score teaches a learner the wrong
  thing. Not in v1, possibly never.
- Accounts, sync, payments.
- **Live TTS in the browser.** The main site's `pron.html` calls an API with a
  user-supplied key; that pattern is wrong here — slow, leaks keys, defeats offline use.
- Voice cloning and human recordings — see §4.

## 10. Open decisions

| # | Decision | Status |
|---|---|---|
| 1 | Product name | **CopyCat** ✅ |
| 2 | Hosting | **`copycat.johnplusenglish.com`, own repo** ✅ |
| 3 | Public or gated | **Public** — moot once it is a separate repo ✅ |
| 4 | Accent | British English (assumed, easily changed) |
| 5 | V1 content target | 10 topics × 10 cards, one level (assumed) |
| 6 | Record & compare | Phase 4, not v1 (assumed) |
| 7 | Voice pair | Phase 0 decides |

## 11. Sources consulted (verify before relying on)

- https://cloud.google.com/text-to-speech/pricing
- https://ai.google.dev/gemini-api/docs/speech-generation (blocked from this session's network)
- https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
- https://discuss.ai.google.dev/t/allowlist-request-chirp-3-instant-custom-voice-generatevoicecloningkey-for-project-vitamodo-podcast/191398
- https://tink.uk/using-a-custom-domain-with-multiple-github-repositories/
