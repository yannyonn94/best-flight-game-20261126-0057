// world.js — the valley: seeded ridges, rivers, lakes, six rescue strips, approach rings.
export function makeSeededRandom(seed) {
  let s = seed >>> 0;
  return function random() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const STRIP_NAMES = ['Pine Creek', 'Eagle Notch', 'Mirror Lake', 'Fox Hollow', 'Storm Pass', 'Last Light'];

export function buildWorld() {
  const rand = makeSeededRandom(20261126);
  const strips = [];
  let heading = 0;
  for (let i = 0; i < 6; i++) {
    const turn = (rand() - 0.5) * 70;
    heading = (heading + turn + 360) % 360;
    strips.push({
      index: i,
      name: STRIP_NAMES[i],
      hikers: 4,
      heading: Math.round(heading),
      distance: 2600 + Math.floor(rand() * 1400),
      length: 620 + Math.floor(rand() * 260),
      elevation: 2400 + Math.floor(rand() * 2600),
      terrain: i % 3 === 0 ? 'river' : i % 3 === 1 ? 'lake' : 'forest',
    });
  }
  const ridges = [];
  for (let layer = 0; layer < 3; layer++) {
    const peaks = [];
    for (let x = 0; x <= 24; x++) {
      peaks.push(0.25 + rand() * 0.75);
    }
    ridges.push({ layer, peaks, speed: 0.12 + layer * 0.22 });
  }
  return { strips, ridges, rand };
}

export function stripProgress(world, leg, flown) {
  const strip = world.strips[leg];
  if (!strip) return 1;
  return Math.min(1, Math.max(0, flown / strip.distance));
}

// Distance (in world units) from the aircraft to the current strip's threshold.
export function distanceToStrip(world, leg, flown) {
  const strip = world.strips[leg];
  if (!strip) return 0;
  return Math.max(0, strip.distance - flown);
}

// Heading error in degrees, wrapped to [-180, 180], toward the current strip.
export function headingErrorToStrip(planeHeading, stripHeading) {
  let d = (stripHeading - planeHeading) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export function fogDensity(elapsedSeconds, duskSeconds) {
  const t = Math.min(1, Math.max(0, elapsedSeconds / duskSeconds));
  return t * t * 0.85;
}

export function duskClock(remainingSeconds) {
  const m = Math.floor(remainingSeconds / 60);
  const s = Math.floor(remainingSeconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}

// One-line summary of a leg for the HUD and the dossier: name, hikers, terrain.
export function legSummary(world, leg) {
  const strip = world.strips[Math.min(leg, world.strips.length - 1)];
  return 'STRIP ' + (leg + 1) + ' OF 6 — ' + strip.name + ' · ' + strip.hikers + ' hikers · ' + strip.terrain + ' valley · ' + strip.distance + ' m out';
}
