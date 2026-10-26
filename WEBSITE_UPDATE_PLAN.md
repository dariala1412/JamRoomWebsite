# Jam Room website — update plan

Audit of `jamroom.eu` against the app at `~/Desktop/STUDY/MusicApp` (MARKETING_VERSION 1.2.8,
iOS 17+, iPhone & iPad) plus `api-gateway/`, `rhymes-worker/` and `supabase/functions/`.
Screenshots/videos excluded by request.

Severity: **P0** = factually wrong / legal risk · **P1** = materially incomplete · **P2** = polish.

---

## 1. Pricing table — `index.html` §pricing

### P0 — Free tier claims transcription it does not have
`UsageTracker.canUseTranscription()` starts with `guard SubscriptionManager.shared.isPro`.
Free gets **zero** transcription minutes; the paywall lists "Voice-to-Lyrics Transcription" as a
Pro unlock. The site's Free column says *"5 min/mo voice transcription"*.

- Remove that line from the Free column, or restyle it as a crossed-out/Pro-only row.
- Pro row "60 min/mo voice transcription" is correct (`proTranscriptionMinutes = 60.0`).

### P0 — "Unlimited" Pro AI claims have a hidden ceiling
`proPhraseFairUseLimit = 1000`, `proRhymeFairUseLimit = 1000` per month, plus Cloudflare
rate limits (30 LLM req/min). Keep the word "Unlimited" but add a `*` footnote:
*"Subject to fair-use limits that protect the service from automated abuse."*
This also needs to exist in the Terms (see §4).

### P0 — "Back up your jams" (Free) is right, but the device limit is missing
`DeviceRegistrationManager`: Free = 1 active device, Pro = unlimited. Signing in on a second
device deactivates the first (`blockedDeviceMessage`).

- Free column: `Back up your jams` → **`Back up & sync — 1 device at a time`**
- Pro column: `Sync unlimited devices` stays.

### P1 — Both columns are missing the whole multitrack feature
`ParallelVoicesEditorView`: Free = 2 vocal layers, 1 chords track, 1 melody track, default
instrument only. Pro = unlimited vocal layers, up to 8 chords + 8 melody tracks, ~30 backing
instruments across 6 categories (Keys, Guitar, Vocal/Ensemble, Brass, Organ, Pads).

- Free: `Parallel takes — 2 vocal layers, 1 chords + 1 melody track`
- Pro: `Parallel takes — unlimited layers, 8 chords + 8 melody tracks, 30+ instruments`

### P1 — Creative Tools split is missing
`InspoModels.isPro`: Free = Check-In, Freewriting, Song Map, Songwriting Prompt.
Pro = Wildcard, Sense Sprint, Word Ladder, Three Random Words.

- Free: `4 creative tools`  ·  Pro: `All 8 creative tools`

### P2 — Prices verified correct
`Configuration.storekit`: `pro_monthly $4.99`, `pro_annual $29.99` with a 3-day free trial on
annual only. Matches the page and the `TERMS` object in the inline script. No change.

---

## 2. Feature sections — `index.html`

### P0 — Auto chord detection description is out of date
Current copy: *"Play a chord on your instrument and Jam Room recognises it instantly."*
There are now two capture modes (`captureLive` / `captureRecord`): live one-chord-at-a-time,
**and** record a whole progression then extract. Plus a confidence readout and a tap-to-replace
editor. Rewrite to cover both.

### P1 — Entire features missing from the site
Ranked by how much they'd sell the app:

1. **Parallel takes / multitrack** — onboarding calls it *"Multitrack recording: record multiple
   vocal takes and layer them with harmonies and instrumental tracks."* Deserves its own
   feature block next to "Capture ideas instantly", not a tile.
2. **Creative Tools** — Check-In (12 reflective questions + mood picker), Freewriting (timed,
   with a floating countdown that continues in the **Dynamic Island**), Wildcard, Song Map,
   Sense Sprint, Word Ladder, Three Random Words, Songwriting Prompt, plus an **Archive** that
   keeps what you write. Second new feature block.
3. **Melody detection** — hum, sing or play and it transcribes the notes (`listenMelody`,
   `MelodyRecognizerView`), melody tracks per section, diatonic scale helper
   (Major / Natural Minor / Dorian / Harmonic Minor, triads & 7ths).
4. **8 languages** — UI *and* rhyme dictionaries in EN, UK, DE, ES, FR, IT, PT, PL
   (`rhymes-worker/import_*_index.sql`). The site never mentions this at all. Add a tile and
   a FAQ entry; it's a real differentiator.
5. **Interactive tutorial** — a 14-step guided tour on first jam, re-runnable from the jam menu.
6. **Weekly quote** — a rotating quote from artists and creators, toggleable in Settings.
7. **Recently Deleted** — 30-day trash with restore / delete forever / empty trash.
8. **Presets & song structures** — Classic Pop / Simple / Verse Heavy, plus a
   "Top 100 Famous Songs" structure reference.
9. **Customization** — reorder/remove section labels, rename the three statuses, default
   instrument, appearance.
10. **Search & organize** — search across titles *and* lyrics, duplicate a jam, sort orders.
11. **Tempo tools** — tap tempo, time signature incl. custom beats/note value, metronome during
    recording (the site only says "built-in metronome").
12. **Offline-first** — edits made offline sync automatically on reconnect
    (`dataStatusOfflineDetail`).

### P2 — Do **not** advertise a widget
`InspoWidget/` is still the unmodified Xcode template (placeholder emoji, "A an example control
that runs a timer"). Only `FreewriteLiveActivity` is real. Mention the Dynamic Island timer,
nothing about a Home Screen widget.

### P2 — "Essentials" tiles that stay accurate
Sync, folders, share via link, export (lyrics as text + memos as audio — `ProjectExporter`),
circle of fifths, metronome, light & dark. Keep. The "A clear structure for every Jam" bullets
are all still true; add `🎶 Melody per section` to that list.

---

## 3. Privacy Policy — `privacy.html` (**P0 throughout**)

This page describes an architecture the app no longer has. These are GDPR accuracy problems,
not copy problems.

| § | Current claim | Reality in code |
|---|---|---|
| 6 | Transcription is **on-device via WhisperKit**, "not sent to external servers" | `AudioTranscriptionService.strategy = GladiaTranscriptionStrategy()`. Audio is uploaded to **Gladia** (`api.gladia.io/v2`) through the Cloudflare Worker gateway. |
| 6, 8, 10 | AI suggestions/rhymes go to **OpenAI** | **Google Gemini** (`gemini-2.5-flash`) and **Groq** (`openai/gpt-oss-120b`), both via the gateway. No OpenAI anywhere. |
| 3 | "we do not collect analytics, tracking data, **device identifiers**, or location data" | A Keychain device ID (`KeychainDeviceID`) is registered to `user_devices` on the server to enforce the Free 1-device limit. `PrivacyInfo.xcprivacy` already declares `NSPrivacyCollectedDataTypeDeviceID`. |
| 5, 7 | Sync framed as Pro-only | Any signed-in account syncs; Free is capped at one active device. |
| 8 | Processor table | Missing **Cloudflare Workers** (API gateway, rate limiting, D1 rhyme dictionary), **Gladia**, **Google (Gemini)**, **Groq**, **Spotify** (artwork search sends song titles). |

### Required edits
1. **Rewrite §6** — voice memos are uploaded to Gladia for transcription; state retention and
   that transcripts are not used for model training. Delete every WhisperKit / on-device claim.
2. **Replace OpenAI with Gemini + Groq** in §6, §8 and §10, and note that requests are proxied
   through our own Cloudflare Worker so provider keys never sit on the device.
3. **Fix §3** — a device identifier *is* collected, for the device-limit feature only. Name the
   legal basis (contract performance / legitimate interest).
4. **Rebuild the §8 table** with all processors and their locations. Gemini and Groq are US
   transfers → they need an SCC sentence alongside Resend.
5. **Decide the Creative Tools Archive question.** `SyncService` calls
   `InspoArchiveStore.applyRemote(...)` and uploads archive entries, but the in-app string
   `inspoArchiveEmpty` tells users they "stay here, device-only." Check-In answers and mood
   check-ins are sensitive personal content. Either stop syncing them or document the sync here
   **and** fix the app string — the current pair is a GDPR transparency problem either way.
6. **Add** the weekly-quotes fetch, the Spotify artwork lookup, the R2 presigned-URL flow via
   Supabase Edge Functions, the `r2-cleanup` deletion job, and the per-user rate limiting
   (legitimate interest, Art. 6(1)(f)).
7. **§11 portability** — exports now include audio, not just text.
8. Keep the region block (Supabase Stockholm / Cloudflare R2 EU) — verified current.
9. Bump "Last updated" from June 28, 2026.

---

## 4. Terms of Service — `terms.html`

- **P0 §9 and §12** — replace OpenAI with Gemini / Groq / Gladia, and add Cloudflare.
- **P0 §3** — *"An account is only required for Pro features such as cloud sync and backup"* is
  wrong; a free account gets backup and single-device sync. Also expand the one-line service
  description to cover multitrack recording, chord & melody detection, and creative tools.
- **P1 — add a device-limit clause.** Free = one active device; signing in elsewhere deactivates
  the previous one. That's a material limitation and it belongs in the Terms, not only in an
  in-app alert.
- **P1 — add a fair-use clause** for the "unlimited" Pro AI features (1000 requests/month per
  feature, plus rate limits), matching the footnote added in §1.
- **P1 §8 sharing** — the copy-to-recipient description is still accurate, but the link is a
  `jamroom://project/<uuid>` **app deep link**: the recipient needs Jam Room installed and a
  signed-in account. Say so. Also note sharing is Pro-only (`ProjectDetailView.swift:258`).
- **P2** — bump "Last updated" from July 11, 2026.

---

## 5. Imprint — `imprint.html`

Structurally fine (§5 ECG / §25 MedienG). Two checks only:

- **P2** Confirm the Kleinunternehmerregelung statement is still true for 2026 revenue.
- **P2** The page says the blog carries "songwriting tips" — there's exactly one post. Either
  publish more or soften the wording.

No other changes needed.

---

## 6. Cross-cutting

- **P0 — the App Store buttons are `href="#"`.** Both the hero and pricing CTAs are dead links.
  Needs the real App Store URL before launch.
- **P1 — URL mismatch in the app.** `PaywallView` links to `https://jamroom.eu/privacy`
  (extensionless) but `https://jamroom.eu/terms.html`. Confirm `/privacy` resolves on the host
  and make the two consistent.
- **P1 — FAQ "Where are my songs stored?" is wrong.** It says Free jams live entirely on device.
  Rewrite: no account → device only; free account → backed up, one device; Pro → all devices.
- **P1 — new FAQ entries worth adding:** which languages are supported; what happens when you
  sign in on a second device on Free; is my writing used to train AI models (answer: no).
- **P2 — app-side, flag for later:** Settings links to the Privacy Policy but not the Terms,
  though the paywall links both.

---

## Suggested order of work

1. Privacy Policy + Terms factual corrections (P0, legal exposure).
2. Pricing table corrections (P0, these are purchase-decision claims).
3. App Store links + FAQ rewrite.
4. New feature blocks: parallel takes, creative tools.
5. New essentials tiles: melody detection, languages, offline, recently deleted, presets.
6. Copy refresh on chord detection; imprint checks.
