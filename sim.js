#!/usr/bin/env node
/* =============================================================
   Paper Plane Odyssey 3D — headless economy simulator
   =============================================================
   Plays the game optimally (perfect upgrade choices, ideal
   prestige timing) at thousands of runs per second and prints
   the total simulated ACTIVE-PLAY hours to reach Pluto and
   Planet Nine, plus every pacing milestone.

   It does NOT reimplement the game math: it extracts the block
   between the ECON-START/ECON-END markers in odyssey_3d_v1.html
   and executes it, so the simulator always proves the exact
   constants and formulas the game ships with.

   Usage:
     node sim.js                 # full report
     node sim.js --quiet         # one-line summary
     node sim.js --set=KEY=VAL   # experiment with an override
                                 # (dot paths ok: tracks.boost.base)

   Targets (tuned & verified):
     first biome border ~20 min · first lap ~2 h · first orbit
     4-5 h · Moon ~7 h · Pluto 15-18 h (hard) · Planet Nine a few
     hours beyond Pluto · 3-4 prestiges on the optimal path.
   ============================================================= */
"use strict";
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "odyssey_3d_v1.html"), "utf8");
const m = src.match(/\/\* ===ECON-START=== \*\/([\s\S]*?)\/\* ===ECON-END=== \*\//);
if (!m) { console.error("ECON block not found in odyssey_3d_v1.html"); process.exit(1); }
const G = new Function(m[1] + `
  return {ECON,upCost,statsFor,gateCapFor,wallReq,borderIdxAt,canPassWall,
          coinsFor,starsForLifetime,layerAt,craftIndex,optimalRun,lapCash,
          CRAFT_FORMS,CRAFT_TIERS};`)();
const E = G.ECON;

// ---- CLI overrides (for tuning experiments only; shipped constants live in the game) ----
let QUIET = false;
for (const arg of process.argv.slice(2)) {
  if (arg === "--quiet") { QUIET = true; continue; }
  const mo = arg.match(/^--set=([\w.]+)=(-?[\d.eE]+)$/);
  if (mo) {
    const keys = mo[1].split(".");
    let o = E;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = parseFloat(mo[2]);
  }
}

const TRACKS = Object.keys(E.tracks);
const freshUp = () => ({ engine: 0, aero: 0, fuel: 0, boost: 0, lift: 0, hull: 0 });

function incomeRate(s) {
  const run = G.optimalRun(s.up, s.stars, s.laps, s.posMi);
  return run.coins / run.seconds;
}

function simulate(prestigeRatio = 1.6) {
  const s = { money: 0, lifetime: 0, laps: 0, posMi: 0, stars: 0, prestiges: 0,
              up: freshUp(), t: 0, bestPeak: 0, runs: 0 };
  const milestones = {};
  const mark = k => { if (milestones[k] === undefined) milestones[k] = s.t; };
  let guard = 0;

  const flyOnce = () => {
    const run = G.optimalRun(s.up, s.stars, s.laps, s.posMi);
    s.t += run.seconds;
    s.money += run.coins; s.lifetime += run.coins;
    s.posMi = run.endPos;
    s.bestPeak = Math.max(s.bestPeak, run.peak);
    s.runs++;
    let lapped = false;
    while (Math.floor(s.posMi / E.circumferenceMi) > s.laps) {
      s.laps++; lapped = true;
      const cash = G.lapCash(s.laps, G.statsFor(s.up, s.stars, s.laps).mult);
      s.money += cash; s.lifetime += cash;
      mark("lap" + s.laps);
    }
    if (s.posMi >= E.biomeLenMi) mark("border1");
    if (run.peak >= 4000) mark("clouds");
    if (run.peak >= 400000) mark("orbit");
    if (run.peak >= 1500000) mark("moon");
    if (run.peak >= E.plutoAlt) mark("pluto");
    if (run.peak >= E.planet9Alt) mark("planet9");
    return lapped;
  };

  while (s.bestPeak < E.planet9Alt && guard++ < 200000) {
    // ---- pick the mathematically best next purchase ----
    const base = incomeRate(s);
    let best = null;
    for (const tr of TRACKS) {
      const lvl = s.up[tr];
      if (lvl >= E.tracks[tr].max) continue;
      const cost = G.upCost(tr, lvl);
      s.up[tr]++;
      const gain = (incomeRate(s) - base) / cost;
      s.up[tr]--;
      if (!best || gain > best.gain) best = { tr, cost, gain };
    }
    if (best && best.gain <= 0) {
      // Greedy sees no marginal gain — usually a multi-tier headwind wall.
      // Optimal play pushes engine/aero until the wall cracks.
      const run = G.optimalRun(s.up, s.stars, s.laps, s.posMi);
      if (run.blocked) {
        const tr = G.upCost("engine", s.up.engine) <= G.upCost("aero", s.up.aero) ? "engine" : "aero";
        best = { tr, cost: G.upCost(tr, s.up[tr]), gain: 0 };
      }
    }

    // ---- prestige at the ideal moment ----
    const gain = G.starsForLifetime(s.lifetime) - s.stars;
    if (gain > 0) {
      const ratio = (1 + (s.stars + gain) * E.starMult) / (1 + s.stars * E.starMult);
      if (ratio >= prestigeRatio) {
        s.stars += gain; s.prestiges++;
        s.money = 0; s.posMi = s.laps * E.circumferenceMi; s.up = freshUp();
        mark("prestige_" + s.prestiges);
        continue;
      }
    }

    if (best && s.money >= best.cost) { s.money -= best.cost; s.up[best.tr]++; continue; }
    // ---- fly until the chosen part is affordable (re-plan on lap change) ----
    if (!best) { flyOnce(); continue; }
    let flights = 0;
    while (s.money < best.cost && flights++ < 400 && s.bestPeak < E.planet9Alt) {
      if (flyOnce()) break; // a new lap changes gates/walls — re-plan
      const g2 = G.starsForLifetime(s.lifetime) - s.stars;
      if (g2 > 0 && (1 + (s.stars + g2) * E.starMult) / (1 + s.stars * E.starMult) >= prestigeRatio) break;
    }
  }
  return { s, milestones, timedOut: guard >= 200000 };
}

// The "ideal prestige timing" is found, not assumed: try several prestige
// aggressiveness thresholds and keep whichever reaches Pluto fastest.
let best = null, bestRatio = null;
for (const r of [1.25, 1.4, 1.6, 1.8, 2.2, 3.0]) {
  const res = simulate(r);
  if (res.timedOut) continue;
  if (!best || (res.milestones.pluto ?? Infinity) < (best.milestones.pluto ?? Infinity)) {
    best = res; bestRatio = r;
  }
}
if (!best) { console.error("SIM TIMED OUT — economy unreachable, retune"); process.exit(2); }

const H = t => t === undefined ? "  n/a " : (t / 3600).toFixed(2) + " h";
const MIN = t => t === undefined ? "n/a" : (t / 60).toFixed(1) + " min";
const { s, milestones } = best;
const plutoH = milestones.pluto / 3600;
const p9H = milestones.planet9 / 3600;

const prestigesBeforePluto = Object.keys(milestones).filter(k => k.startsWith("prestige_") && milestones[k] <= (milestones.pluto ?? Infinity)).length;
if (QUIET) {
  console.log(`pluto=${plutoH.toFixed(2)}h p9=${p9H.toFixed(2)}h border1=${MIN(milestones.border1)} lap1=${H(milestones.lap1)} lap2=${H(milestones.lap2)} orbit=${H(milestones.orbit)} moon=${H(milestones.moon)} prestiges@pluto=${prestigesBeforePluto}/${s.prestiges} runs=${s.runs}`);
} else {
  console.log("=====================================================");
  console.log(" PAPER PLANE ODYSSEY 3D — OPTIMAL-PLAY SIMULATION");
  console.log("=====================================================");
  console.log(` first biome border   ${MIN(milestones.border1).padStart(9)}   (target ~20 min)`);
  console.log(` first cloud break    ${MIN(milestones.clouds).padStart(9)}`);
  console.log(` first lap            ${H(milestones.lap1).padStart(9)}   (target ~2 h)`);
  console.log(` second lap           ${H(milestones.lap2).padStart(9)}`);
  console.log(` first orbit          ${H(milestones.orbit).padStart(9)}   (target 4-5 h)`);
  console.log(` third lap            ${H(milestones.lap3).padStart(9)}`);
  console.log(` Moon flyby           ${H(milestones.moon).padStart(9)}   (target ~7 h)`);
  console.log(` PLUTO                ${H(milestones.pluto).padStart(9)}   (target 15-18 h)`);
  console.log(` PLANET NINE          ${H(milestones.planet9).padStart(9)}   (a few hours past Pluto)`);
  console.log("-----------------------------------------------------");
  console.log(` prestiges to Pluto: ${prestigesBeforePluto} · to Planet Nine: ${s.prestiges} (best threshold ${bestRatio})`);
  console.log(` total flights: ${s.runs} · legacy stars at end: ${s.stars}`);
  console.log(` lifetime earnings: $${Math.round(s.lifetime).toLocaleString()}`);
  console.log("-----------------------------------------------------");
  const ok1 = plutoH >= 15 && plutoH <= 18;
  const ok2 = p9H - plutoH <= 6;
  console.log(` OPTIMAL PLUTO TIME: ${plutoH.toFixed(2)} hours ${ok1 ? "✓ WITHIN 15-18h" : "✗ OUT OF RANGE"}`);
  console.log(` PLANET NINE: +${(p9H - plutoH).toFixed(2)} h beyond Pluto ${ok2 ? "✓" : "✗"}`);
  process.exitCode = ok1 && ok2 ? 0 : 1;
}
