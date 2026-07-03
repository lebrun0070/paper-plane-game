# Paper Plane Odyssey 3D — Build Progress

Target: `odyssey_3d_v1.html` — single self-contained HTML, Three.js from CDN, full 3D
reimagining of `paper_plane_odyssey_v10_4.html` (DO NOT MODIFY the v10 file).
Full spec: launch-fly-earn-upgrade idle flyer, two axes (around the world + up to Pluto),
15–18 h optimal completion enforced by `sim.js`.

## v10 source extraction (done)
- **Characters (never invent new ones):** Mikey (Workshop — launch/fuel systems), Sophie
  (Glamorous Wing Shop — wings/lift, theatrical), Nico (Airframe Garage — hull/structure,
  blunt), Mateo & Gary (Engine Depot — engines, loud & chaotic), Jorge (Control Tower —
  radio announcer: "Jorge's Control Tower... you are cleared for takeoff.").
- **Systems carried:** Legacy Stars prestige ("RETIRE & EARN STARS"), passport stamps,
  half-circle canvas speedometer with green/yellow/red zones, paper/ink palette
  (`--paper:#f6efe0 --ink:#22303f`), Permanent Marker + Nunito, taped clipboard panels.
- **Department mapping:** Mateo & Gary → Engines+Aero (horizontal), Sophie → Lift,
  Nico → Hull (+ Legacy Stars desk), Mikey → Fuel & Rocket Boost, Jorge → Passport
  Office + Mission Control (once space unlocks).

## Architecture notes (read before editing)
- `odyssey_3d_v1.html` has a **plain script block between `/* ===ECON-START=== */` and
  `/* ===ECON-END=== */`** containing ALL economy constants + pure math (no DOM/three).
  `sim.js` (Phase 5) extracts that block by marker and runs it headless — keep it pure.
- Visual scale: `UPM=150` units per game-mile; altitude compressed via `visY()` (log above
  6k ft) so Pluto-height coordinates stay float-safe. Floating origin shifts every 16k units.
- Terrain: chunked (600u long), biome from `posMi`, props per biome, disposed behind.
- World position `posMi` is CUMULATIVE and persists between flights (laps = posMi/2000mi).
  Each launch continues from where the last flight ended (crew caravan fiction).
- Testing: `scratchpad/test.mjs` (Playwright, chromium at /opt/pw-browsers/chromium with
  swiftshader flags) — intercepts the jsdelivr CDN route and serves a local copy of
  three.module.js 0.160.0 (CDN is egress-blocked in the dev sandbox, fine in production).

## Phase status
- [x] **Phase 1 — Flyable 3D core** (committed): launch, fixed-timestep flight physics,
  home meadow biome chunks, chase cam that pulls back with speed, HUD (v10 speedometer
  port + altimeter tape + layer/status), coin rings + distance/altitude coin formula,
  fast falls (gravity multiplier ramps to 7x), CALL IT ✓ stamped button on descent
  (banks identical rewards instantly), re-entry cinematic stub (>60k ft), return-to-pad
  loop, save/load, shops functional (6 tracks), prestige skeleton, headwind wall + lap
  gate ceilings already enforced in physics. Playwright smoke test: zero console errors,
  full loop (launch → CALL IT → bank → relaunch) verified.
- [ ] **Phase 2 — World loop**: all 8 biomes' props/palettes polish, lap detection + lap
  celebration + golden stamp, lap world-variants (golden hour / night / storm), launch-site
  hub with character buildings, per-character dialogue that updates at milestones.
- [ ] **Phase 3 — Vertical**: layer visuals (stars, Earth below, curved horizon), KASPVR
  satellite (canvas texture, exact spelling, silent hidden stamp), Moon/planets/asteroid
  belt/Pluto + celebration, 8 distinct craft models swapped at CRAFT_TIERS.
- [ ] **Phase 4 — Passport & secrets**: passport book UI with UNLABELED gray silhouettes,
  ≥5 hidden stamps, "...did you?" beat after Pluto, Planet Nine + quiet true ending.
- [ ] **Phase 5 — Simulator & tuning**: sim.js extracts ECON block, optimal-play loop,
  print hours, tune to 15–18 h optimal + pacing targets (border ~20 min, lap1 ~2 h,
  orbit 4–5 h, Moon ~7 h, P9 a few hours past Pluto), perf pass, final checklist.

## Next steps
Phase 2. Key files: `odyssey_3d_v1.html` (game), `scratchpad/test.mjs` (test harness).
