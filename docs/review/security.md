# Security and edge-case review

Scope: game and Christmas application source, HTML customization/bootstrap scripts,
Vite configuration, art receiver and art/verification tooling. Asset names and paths
were reviewed as data; generated images, fonts, archives and dependency internals
were not treated as executable source. Existing local changes were preserved.

## Fixed

- **P1: malformed saved dialogue could stop progression.** Null entries and invalid
  sequences reached `DialogueBox.showNode()` directly. Added bounded normalization
  for dialogue text/nodes and fallbacks to the built-in sequence. Completion now
  runs once, hidden dialogue ignores extra advance events, and the frame that
  opens a dialogue cannot also advance it.
- **P2: stored customization was trusted without consistent validation.** A shared
  normalization module validates metadata and puzzle-image schemes before the game
  starts. Raster uploads and explicit HTTP(S) images remain supported; executable,
  local-file and malformed schemes are rejected. Storage reads tolerate privacy
  restrictions and malformed JSON. Dialogue/metadata render as text, not HTML.
- **P2: setup could fail silently when storage was blocked/full.** All launch writes
  now share the existing user-visible failure path, with useful privacy/quota
  messages. A previously uploaded puzzle survives launch without a replacement.
- **P2: malformed stage data could produce NaN progression.** `completeStage()` now
  accepts only declared trial identifiers and repairs invalid stage counters.
- **P2: optional accessory selection was not preserved.** An explicitly empty
  accessory no longer gets replaced by a Santa hat during legacy migration.
- **P2: profile edge cases.** Control-only strings now use defaults; inherited
  asset-part keys return an empty path; a successful local save remains successful
  when session-storage cleanup is unavailable.
- **P2: dialogue listeners accumulated across room visits.** Scene shutdown now
  removes the update and pointer handlers and releases the completion callback.

## Findings routed to other review streams

- Original virtual controls need a blur/reset path to prevent stuck movement.
- Original HUD subscribes to registry changes without removing its listener.
- Scene initializers should tolerate missing transition data.

## Checks and limits

- `node art/christmas/check-campaign.mjs` passed after the changes, including the
  fresh campaign VM integration, nine stages, checkpoints, reward idempotency and
  final ritual gate.
- Standalone assertions passed for malformed dialogue, non-string metadata,
  executable/file puzzle URLs, valid HTTPS images, explicit empty accessories,
  control-only profile names and inherited asset keys.
- Parent agent owns the committed regression suite, dependency audit, production
  build and browser checks; those results are recorded in the combined review.
- The art receiver binds to loopback, checks a strict Origin allowlist, restricts
  output names, bounds request bodies and checks the PNG signature. No remote
  write or path traversal was found in that surface. This is a code review, not a
  penetration test, and does not establish that every possible defect is absent.
