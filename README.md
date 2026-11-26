DUSK RESCUE — a bush pilot lands on 6 mountain strips to evacuate 24 hikers before night fog swallows the valley; every landing wears the gear, fuel is the clock.

[![Best Flight Game](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/yannyonn94/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/yannyonn94/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

## The game

You are the last bush pilot flying in the valley of Pine Creek. Six mountain strips, four hikers waiting on each one, one tank of fuel, and six minutes of dusk left before the fog closes the valley for the night.

- **6 rescue sorties, 24 hikers, 6 named strips** — Pine Creek, Eagle Notch, Mirror Lake, Fox Hollow, Storm Pass, Last Light — each a different valley: river, lake, or forest floor.
- **Amber approach rings** — fly through each ring for +250 points and +8 fuel; miss it and the strip still takes you, poorer.
- **Fuel and gear are decisions** — full throttle climbs fast and drinks fast; hard landings cost 25% gear; three hard landings end the plane. Every strip cache refuels +20.
- **Dusk is the clock** — 360 seconds; the fog thickens every second and nightfall ends the sortie.
- **Throttle and turn discipline** — the plane stalls below 48 KT (40 with flaps), banks turn the heading, and a smooth landing pays +200 over a hard +100.
- **A complete cockpit** — altitude, speed, heading, vertical speed, compass strip, fuel and gear bars, dusk countdown, and a live mission line, all lit amber against the dusk.
- **Synthesised sound** — engine hum follows throttle, wind follows speed, ring chimes, touchdown thuds, low-fuel alarms. No audio files; WebAudio only. M mutes, P pauses, R restarts.

## Controls

- **Arrow keys** — pitch and bank (mouse drag steers too)
- **W / S** — throttle up / down
- **F** — flaps (slower stall, more drag)
- **M** — mute · **P** — pause · **R** — restart · **Enter / TAKE OFF** — start

## How to land

Line up on the strip heading, drop below 90 KT with flaps down, and kiss the dirt under 520 FPM. The hikers load in two seconds — then throttle up and go.

## Files

- `game/index.html` — page, HUD panels, title screen
- `game/style.css` — flat dusk palette, solid panels, no gradients
- `game/src/main.js` — game loop, landing detection, screens, restart
- `game/src/world.js` — seeded valley: ridges, strips, rings, fog
- `game/src/aircraft.js` — the bush plane PK-DUSK, chase-view drawing
- `game/src/physics.js` — throttle, pitch, bank, stall, ground roll, touchdown quality
- `game/src/hud.js` — lit instruments: ALT, SPD, HDG, V/S, compass, fuel, gear, dusk
- `game/src/missions.js` — six sorties, rings, pickups, scoring, endings
- `game/src/audio.js` — WebAudio engine, wind, chimes, thuds, alarms
- `game/src/input.js` — keyboard + mouse steering
- `game/src/render.js` — dusk sky, sun, clouds, ridges, ground, strip, ring, fog
- `game/src/shots.js` — deterministic screenshot poses (?shot=cover|approach|landed)
- `main.ts` — hand-in program (Node 22, stdlib only): copies game/ + screenshots/ to /output and writes dossier.json

## Play locally

Serve `game/` with any static server and open `index.html` in desktop Chrome. No network request is made; everything is local.

## License

MIT — see LICENSE.

## Verification (26 Nov 2026, local)

- `node --check` passes on all 10 game modules; zero JS errors in a scripted headless-Chrome playtest (start, 3 s climb to 152 KT, R restart).
- `main.ts` run twice with `MAKEFUN_OUTPUT_DIR` produces byte-identical output; dossier.json 375,627 bytes; game/ 12 files, 46,324 bytes; 4 screenshots, each 1280×720 JPEG under 69 KB.
- Screenshots are real renders of the game code (headless Chrome, `?shot=` poses), never edited or composited.
- Impeccable static detect on `game/`: 0 findings after fixing one wide-tracking note.
