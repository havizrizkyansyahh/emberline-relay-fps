# EMBERLINE // RELAY

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/havizrizkyansyahh/emberline-relay-fps/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard)
[![reward](https://make.fun/badge/threejs-fps-02/havizrizkyansyahh/emberline-relay-fps/reward.svg)](https://make.fun/bounty/threejs-fps-02)

An original, offline, single-player tactical FPS built with three.js. Lead a three-person team through a coastal relay station against defending bots: manage ammunition and money, use cover, and arm a relay at either objective site. Defenders can isolate the uplink before its countdown completes.

## Play locally

Requires Node.js 22.18 or newer and a desktop browser with WebGL 2.

```sh
node serve.ts
```

Open the local address printed by the server. The game uses locally vendored modules and assets; gameplay needs no external services. Use a local HTTP server rather than opening index.html as a file.

## Controls

- WASD: move; mouse: look and fire.
- Shift: walk; Ctrl: crouch; Space: jump.
- R: reload; 1/2/3: switch weapons; G: throw a frag.
- E, held: interact with the relay.
- B: equipment menu during preparation; Tab: scoreboard; Escape: pause.
- If pointer lock is unavailable, use drag-to-look or the arrow keys.

See the briefing screen for available modes and current controls.

## Test simulation

```sh
node --test tests/*.test.mjs
```

The simulation tests exercise game rules independently of WebGL. They are not a substitute for browser playtesting.

## Produce the submission output

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The entrypoint copies game/ and screenshots/ and writes dossier.json using the competition's supplied library. The grading runtime installs no dependencies.

## License and attribution

MIT. three.js and the make.fun helper retain their included licenses and notices. See LICENSE and the vendored license files. Map, game names and authored game presentation are original to this entry.

Built with an AI coding agent for [make.fun's three.js tactical FPS bounty](https://make.fun/bounty/threejs-fps-02). Participation does not imply a prize or acceptance; the live badges reflect the platform's recorded results.
