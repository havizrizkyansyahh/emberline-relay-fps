# EMBERLINE // RELAY — build and verification report

Built locally on 2026-11-16 in /home/agent/projects/emberline-fps.
Session: local-c1f8b8b18737fe068df04318bd9c9ea5c03fb31c7fe0e3e3f889d92b3241336f
Scope: author, run, test, and package locally only. No login, registration, bundle upload, submission, payment, remote push, history rewrite, or freshness anchor was performed in this build session. README/account ownership metadata created by the parent was left alone. No child agents were delegated.

## Play and build

Node runtime actually exercised: v26.12.1. The entrypoint uses Node standard-library APIs and erasable TypeScript annotations, with no dependencies or installation step. Node 22.18+ is the intended grader runtime; a separate Node 22 executable was not used here.

From the repository root:

    node serve.ts

Open http://localhost:8080/ in desktop Chrome with WebGL 2. The local development server is currently listening on 8080 (process handle proc_556daf4c8faa). It serves game/ only, rejects paths outside that root and symlinks escaping it, and uses no remote assets.

    node --test tests/*.test.mjs
    node tests/audit.mjs
    MAKEFUN_OUTPUT_DIR=/your/clean/output node main.ts

The optional full browser-evidence assertion command used in this environment:

    EMBERLINE_BROWSER_EVIDENCE=/home/agent/.hermes/cache/scratch/emberline-fps-evidence/browser-final-evidence.json node tests/audit.mjs

The audit invokes main.ts twice with distinct MAKEFUN_OUTPUT_DIR values, hashes every output file, compares both manifests, rebuilds dossier.json with the immutable helper, checks source truncation, parses every JS module, resolves all static references, verifies kit vendor bytes, and checks screenshot JPEG dimensions and sizes. It is a local structural audit, not the sealed make.fun gate.

## Actual final results

- node --test tests/*.test.mjs: 20 tests, 20 passed, 0 failed, 0 skipped.
- Two clean builds: 19 regular output files each; every per-file SHA-256 identical.
- Final clean output A: /home/agent/.hermes/cache/scratch/emberline-clean-build-zbRDnv/run-a
- Final clean output B: /home/agent/.hermes/cache/scratch/emberline-clean-build-zbRDnv/run-b
- dossier.json: 591,440 bytes; byte-identical to buildDossier reconstruction.
- Dossier source text: 83,837 bytes; no source truncated or omitted.
- Authored game source: 82,865 bytes across 10 source files, below the 163,840-byte text budget.
- game/: 16 files/directories together; 2,217,880 bytes of files.
- 21 resolved HTML/import references, all inside game/.
- One import map, with three mapped to ./vendor/three/three.module.min.js.
- three.module.min.js, three.core.min.js and vendor/makefun-threejs.ts match the official kit byte for byte.
- Four real JPEG screenshots, each 1280 x 720, each below 256 KiB.
- Per-file output hashes, screenshot hashes/sizes, vendor hashes and build paths: tests/build-audit.json.

## Gameplay delivered

- Three attackers (player, Mica, Sol) versus three defenders (Brass, Rook, Flint), first to three rounds.
- Twelve-second buy phase, Ready shortens remaining preparation to three seconds, ninety-second active round, six-second debrief, rewards, rebuy, final result and restart.
- An original three-lane coastal-industrial map: Tidal lane, central connector and Uplink lane; two cross-streets and relay sites A/B. Concrete/plaster buildings, cargo cover, vents, water tanks, pipes, cables, dish/antenna, pier cliff/sea setting, warm sun, teal/amber faction colors.
- WASD acceleration and stopping friction; Shift walk; Ctrl crouch and improved spread; Space gravity-driven jump; map collision.
- Pointer-locked mouse aim, drag fallback and arrow-key look. Double-click the playfield to retry pointer lock. Esc pauses/unlocks. R reloads; 1/2/3 select owned weapons; G throws a frag; held E arms the relay; B opens supply during preparation; held Tab shows personnel; M toggles synthesized audio.
- Kite sidearm, Tide automatic rifle, Cinder heavy rifle, finite magazine/reserves, reload delays, weapon recoil tied to camera/ray aim, moving/jumping spread, crouch focus, body/head geometry and wall-occluded hitscan.
- Real purchases, affordability/duplicate rejection, armor absorption, frag capacity, kill/plant/round rewards, cash cap, no negative balances. Equipment resets each round; money carries over.
- Held 3.2-second plant, thirty-five-second transmission, held five-second defender isolation. Release, movement or death cancels interaction. Relay drops on carrier death and allies can recover/plant it. Attack elimination does not end a planted round prematurely.
- Bot routing on a clearance-expanded deterministic grid, site defense, split attack lanes, limited contact memory, shot hearing, central defender rotation, LOS fire, reaction delays, aim error, reloads, objective continuation after player death, spectator cycling.
- Seeded per-round simulation RNG, fixed 1/60 simulation step, bounded render accumulator, separate renderer, pooled tracers/impacts/grenade visuals, instanced scenery and articulated bot meshes.
- Health, armor, ammo/reserve, weapon, money, alive counts, round timer/score, minimap, killfeed, headshot/damage feedback, objective markers/progress, buy menu, scoreboard and final result.
- Original synthesized WebAudio; no game audio or art downloads.

## Test-driven slices and corrections

Tests were written and run before the corresponding new simulation slices. The transcript contains actual red and green runs for round flow, movement, combat, economy, objective/grenade logic, bot behavior, valid spawns/hearing, spectator fallback, coastal boundary containment, encounter range, counter-recoil ray agreement, self-kill cash rejection, and death-cancelled objective progress.

Real corrections made during testing/playtesting:

- Rook's original spawn intersected the north building; moved to a collision-free position, with a regression covering every spawn and route.
- Excess decorative draw calls were reduced with instancing, including animated bot parts. The actual introductory scene reported 79 draws after optimization, versus 1,751 in the original unbatched version.
- Browser tab visibility was checked before diagnosing a frozen loop; requestAnimationFrame stops when the harness leaves the page hidden. Trusted CDP clicks acquired pointer lock successfully; DOM .click() alone did not.
- Unsupported symbol-font icons were replaced with CSS geometry or ASCII symbols.
- Casual encounter range was shortened to avoid immediate map-length engagements.
- Hitscan recoil and visible camera recoil were aligned with a regression test.
- Self/team frag kills no longer award cash.
- Death now clears held objective progress immediately.
- Repeated bot steering/goal objects are reused rather than allocated in every step.

## Real browser exercises and evidence

Chromium reported WebGL 2 true and rendered the actual game at 1280 x 720. The ?test=1 query exposes only a frozen object with snapshot() and renderer() readers; snapshots are detached JSON copies, with no simulation mutation API. No seeded screenshot fixtures or synthetic match states were used.

Actions were keyboard/mouse/CDP events or visible UI button clicks, not direct simulation state changes:

- Started a match, bought a Tide rifle for $1,800, observed the balance fall from $2,400 to $600.
- Fired the automatic rifle: magazine 30 -> 24. Reloaded: 30 in magazine, reserve 90 -> 84.
- Verified keyboard movement, drag-look fallback, trusted pointer lock, aim, pause/resume, weapon switching, scoreboard and mute.
- Traveled the sea-side lane with normal movement. Aimed and fired a sidearm headshot at Brass: 107.3 damage, elimination and $300 reward.
- Traveled to A and held E. Recorded the real plant event and the relay state changing from carried to planted, with 34.55 seconds remaining in the captured evidence.
- The defenders subsequently isolated the relay; the real loss debrief showed attack 0 / defense 1. Continued to round 2.
- Bought Cinder for $2,600 in round 2, leaving $500. The attempted $650 armor purchase was correctly rejected; this browser run did NOT buy armor.
- Threw a real round-two frag, observed one blast event and grenade inventory 1 -> 0. Player health remained 100 in that exercise.
- M changed the label to M · SOUND OFF; holding Tab produced six real personnel rows.
- Every recorded resource URL was local to http://localhost:8080/; no external asset resource was loaded.

Raw read-only browser snapshots are kept outside the submitted repository to avoid shipping bulky diagnostics:

    /home/agent/.hermes/cache/scratch/emberline-fps-evidence/browser-final-evidence.json
    /home/agent/.hermes/cache/scratch/emberline-fps-evidence/browser-objective-evidence.json

The first is the final complete replay and is consumed by the optional audit command above. Browser screenshots were captured directly as JPEG bytes with Page.captureScreenshot, without resizing, editing, compositing, borrowed art or substituted play state.

## Screenshots

- screenshots/01-live.jpg — actual live first-person engagement following the real sidearm headshot on the western lane.
- screenshots/02-relay.jpg — actual player-armed relay A, active countdown, original geometry and HUD.
- screenshots/03-supply.jpg — actual round-two supply menu after the heavy-rifle purchase; prices, balance and rejected affordability states are real.
- screenshots/04-briefing.jpg — actual rendered introductory scene and original controls/operation briefing.

The last two simulation-only changes after that replay were allocation reuse and clearing progress on death; neither changes the pictured scene or grants a screenshot-only state.

## Known limitations / honest scope

- Desktop single-player only. The user is always on attack; there is no online mode, side swap, controller or touch interface.
- The station is an outdoor 2.5D collision layout. Buildings are solid tactical volumes, not explorable interiors. Jumping is supported, but there is no multi-level navmesh or climbing system.
- Bots are deliberately readable finite-state opponents, not human-level tactics. Their short-range sight uses distance plus geometric LOS, not a narrow field-of-view cone; one defender is assigned the hearing/contact rotation role. Bots do not shop or throw grenades.
- Player economy is implemented; surviving equipment is intentionally not carried between rounds, as the supply UI explains.
- Audio is synthesized with distance gain on remote gunfire, not full HRTF spatial audio or recorded footsteps/dialogue.
- The headless WebGL environment was slower than a desktop GPU. No claim of a measured stable 60 FPS is made. The browser harness occasionally reset its tab to about:blank between long tool gaps; fresh full-sequence playtests were used rather than inventing missing results.
- Local checks cannot certify the sealed competition gate, provenance gate, GitHub ownership/About badges, judging outcome or reward. Parent remains responsible for repository finalization, transcript collection/checks, publication and submission.
- No local commit was created because parent-owned README/account files appeared concurrently. Working files are left for the parent to review and commit together.
