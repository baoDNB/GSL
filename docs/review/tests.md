# Agent 4: regression tests and coverage

The repository had two useful standalone Christmas checks (`check-campaign.mjs`
and `check-routes.mjs`) but no package test script and no repeatable regression
suite for malformed customization, browser storage failures, input lifecycle,
or the original minigames.

Added 47 tests using Node's built-in test runner, with no new dependency. A small
VM module loader executes the original ES module source in this otherwise
CommonJS package, preserving real source filenames for coverage. Browser/Phaser
rendering services are stubbed; game logic is not copied into tests.

## Covered behavior

- Malformed custom dialogue, metadata allowlists, control-only text, bounded
  lengths, unsafe puzzle image schemes, prototype keys, denied storage and
  invalid JSON.
- Fresh independent saves, malformed counters and locations, legacy saves,
  preparation requirements, all three stages and reward idempotence, final gate,
  save/reload and quota failures.
- Profile normalization, deliberate no-hat choices, legacy hat migration, session
  fallback, and existence of every allowlisted character image.
- Christmas controls: multiple pointers on one button, equivalent action keys,
  held movement vs one-shot taps, cancellation, blur/visibility reset,
  keyboard/assistive click activation and complete external listener removal.
- Dialogue opening-frame suppression, one advance per frame, callback once,
  malformed stored/direct nodes, movement unlock and scene-shutdown cleanup.
- Original puzzle shuffle permutation/solvability invariant (100 shuffles),
  adjacent-only input and empty-tile movement; memory level configuration,
  mismatch timeout, full-match progression and duplicate completion; lava reward
  idempotence; original joypad reinitialization/disposal and blur reset.

## Verification

`node --experimental-vm-modules --experimental-test-coverage --test tests/*.test.mjs`

Result: **47 passed, zero failed**, Node 24.8.0.

Selected source coverage from this run:

| Source | Lines | Branches | Functions |
| --- | ---: | ---: | ---: |
| customization.js | 100% | 100% | 100% |
| christmas/controls.js | 100% | 100% | 100% |
| objects/DialogueBox.js | 94.74% | 79.31% | 91.67% |
| christmas/profile.js | 86.41% | 88.89% | 100% |
| christmas/state.js | 63.46% | 100% | 88.89% |
| assets/VirtualJoypad.js | 75% | 91.67% | 53.33% |

Coverage is explicitly not whole-repository coverage. The final expanded run reports
40.59% lines, 94.32% branches and 72.46% functions for loaded files (including the helper).
The lower line percentage reflects loading additional room scenes in the final tests.
Unloaded scenes are not counted; renderer-heavy minigame methods have low line
coverage. High branch percentages therefore do not establish high coverage for
the whole game. The journal DOM updater, GPU rendering, full room traversal,
physics collisions, actual mobile devices, sound and complete browser playthrough
still require integration/manual testing. The parent separately runs the existing
Christmas nine-stage campaign and room-route checks and production build.

The final nine tests additionally cover lava failure/victory exclusivity, repeated
victory, six original room initializers with missing data, and HUD listener disposal.
No production files, package scripts or Git history were changed by this agent.
