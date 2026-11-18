## Problem and resulting behavior

Malformed saved customization could interrupt dialogue/progression, held controls
could survive focus loss, scene listeners could accumulate, and replaying original
trials could award duplicate keys. The reviewed application now validates saved
content, disposes listeners and input state, and makes terminal rewards idempotent.

## Changes

- Normalize custom dialogue, metadata and puzzle-image URLs before boot; catch
  blocked/quota-limited storage and preserve existing uploaded puzzle images.
- Guard dialogue opening/advance/completion and remove shutdown listeners.
- Preserve deliberate no-accessory choices and repair malformed stage counters.
- Guard Memory/Lava completion and reward re-entry; tolerate absent room data.
- Dispose HUD/joypad subscriptions and timers; reset controls on blur/visibility
  loss; support multi-touch and assistive activation without duplicate actions.
- Reduce per-frame vector allocation and unchanged text-color updates; improve
  mobile touch targets, responsive controls and keyboard focus visibility.
- Add repeatable regression/coverage commands and CI for tests and production build.
- Update Vite to 8.3.8 and refresh transitive security fixes; use ESM configuration.

## Existing changes included

The starting checkout contained uncommitted original-game/customizer changes and
the Christmas campaign, art assets and fonts. This PR preserves the runnable
reviewed application on which these fixes/tests depend. Prior art experiments,
transcripts, caches and vendor archives are left out. See docs/review for findings,
scope, file inventory, coverage and limitations.

## Validation and limits

All 47 regression tests, the nine-stage Christmas campaign/checkpoint verifier, 92 route
checks, coverage run, formatting and production build pass locally. Tests use
production logic with browser/Phaser rendering stubs. Full visual/device
playthrough is unverified because live browser access was unavailable.

The production build retains a large shared Phaser chunk warning. `npm audit`
still reports four high package entries arising from one unpatched picomatch
ReDoS advisory propagated through fdir/tinyglobby/Vite. This PR reduces the audit
findings from seven entries and does not claim a clean security audit.
