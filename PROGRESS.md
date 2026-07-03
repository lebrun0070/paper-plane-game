# Paper Plane Odyssey 3D — Build Progress

**Status: ALL 5 PHASES COMPLETE.** `odyssey_3d_v1.html` is the shipped game;
`sim.js` is the economy prover. The original `paper_plane_odyssey_v10_4.html`
is untouched (md5 verified against the initial commit).

## Files
- `odyssey_3d_v1.html` — the game. Single self-contained file, Three.js 0.160 from
  jsdelivr CDN via importmap, no other dependencies. All textures are canvas-drawn.
- `sim.js` — headless optimal-play simulator. Run: `node sim.js` (options:
  `--quiet`, `--set=KEY=VAL` with dot paths, e.g. `--set=tracks.boost.growth=1.8`).
  It extracts the `/* ===ECON-START=== */ ... /* ===ECON-END=== */` block from the
  game file and executes it, so it always proves the exact shipped constants.
- `paper_plane_odyssey_v10_4.html` — original 2D game. DO NOT MODIFY.

## Simulator verdict (shipped constants)
```
first biome border  25.6 min (target ~20 min)
first lap            1.86 h  (target ~2 h)
first orbit          4.67 h  (target 4-5 h)
Moon flyby           8.11 h  (target ~7 h)
PLUTO               15.75 h  ✓ WITHIN 15-18 h
PLANET NINE        +5.98 h beyond Pluto ✓
prestiges to Pluto: 3 (5 total to Planet Nine)
```
Casual play lands well above (suboptimal purchases/prestige timing roughly
double the grind; pickups are tuned to be a small fraction of income so real
optimal play stays inside the proven band). Exit code 0 = all checks pass.

## v10 carry-over (checklist item 2)
Characters, all by name, voices intact, no inventions: **Mikey** (Workshop —
Fuel & Boost), **Sophie** (Glamorous Wing Shop — Lift), **Nico** (Airframe
Garage — Hull, Legacy-adjacent lines), **Mateo & Gary** (Engine Depot —
Engines/Aero), **Jorge** (Control Tower — Passport Office, becomes Mission
Control after lap 2). Legacy Stars prestige, passport, half-circle speedometer,
paper/ink palette, Permanent Marker + Nunito, taped clipboard panels all carried.

## Architecture notes (for future sessions)
- **ECON block** (marked, pure JS, no DOM/three) holds every economy constant and
  formula: `statsFor`, `upCost`, `wallReq` (concave curve + lap-1 bump),
  `gateCaps` (lap-gated sky tiers), `coinsFor`, `starsForLifetime`, `optimalRun`
  (coarse-dt integration of the same update rules the live physics uses),
  `lapCash`, craft tiers. Keep it pure — sim.js `eval`s it.
- Visual scale: `UPM=150` u/mi; altitude log-compressed via `visY()`; floating
  origin shifts every 16k units. Space bodies positioned relative to the craft,
  visible only within their layer window (±2600 visY units).
- Terrain: 600u chunks, AHEAD=7 (fog swallows farther), disposed behind,
  hidden entirely above ~61k ft. ~750 draw calls / ~16k tris at ground level.
- World position is cumulative; prestige resets to the start of the CURRENT lap
  (`posMi = laps * circumferenceMi`) — never to 0, or laps would need re-flying.
- Laps: lap 2 golden hour, lap 3 night (lit town windows + arctic auroras),
  lap 4+ storm (rain, lightning, gusts, `stormBonus` income in ECON).
- Cinematics: `cinema` object drives Pluto (radio → "YOU MADE IT" → pause →
  "...did you?" → blank silhouette on the passport's last page) and Planet Nine
  (quiet ending, no fireworks). KASPVR check runs per physics tick with a
  climb-rate-aware window so fast ascents can't skip it; the stamp is silent.
- Hidden stamps (6): KASPVR flyby, mountain arch thread, ocean skim, whale buzz,
  aurora dance (lap-3 night arctic), storm ride (lap 4+).
- Dev/test hook: `window.__PPO` (getState/getP/setAlt/setPos/isCinema/
  setCraftForm/renderer) — used by the Playwright tests.
- Testing (sandbox): CDN egress is blocked in dev containers; Playwright tests
  route-intercept jsdelivr and serve a local copy of three.module.js
  (see scratchpad test*.mjs pattern; chromium at /opt/pw-browsers/chromium with
  swiftshader flags). Zero console errors across the full suite.

## Phase log
- [x] Phase 1 — flyable 3D core (launch/physics/meadow/HUD/CALL IT/fast falls).
- [x] Phase 2 — 8 biomes, world wrap, lap events + variants, crew hub, shops.
- [x] Phase 3 — vertical layers, KASPVR, Moon/planets/belt, Pluto cinematic,
      8 craft forms.
- [x] Phase 4 — passport silhouettes, hidden stamps, prestige polish,
      "...did you?", Planet Nine + quiet true ending.
- [x] Phase 5 — sim.js, economy tuned until 15-18 h PROVEN (15.75 h), perf pass.

## Next steps
None required — DONE CHECKLIST verified. If retuning is ever needed: adjust ECON
constants in the game file, re-run `node sim.js` until it prints a Pluto time in
15-18 h with exit code 0.
