// missions.js — the rescue sorties: six strips, rings, pickups, scoring, endings.
import { touchdownQuality } from './physics.js';

export const DUSK_SECONDS = 360;
export const TOTAL_HIKERS = 24;

export function createMissionState(world) {
  return {
    leg: 0,
    flown: 0,
    ringPassed: false,
    phase: 'title', // title | fly | landed | pickup | crashed | outoffuel | night | won
    saved: 0,
    score: 0,
    elapsed: 0,
    duskLeft: DUSK_SECONDS,
    banner: '',
    bannerSub: '',
    bannerUntil: 0,
    landTimer: 0,
    message: '',
  };
}

export function currentStrip(world, mission) {
  return world.strips[Math.min(mission.leg, world.strips.length - 1)];
}

export function startSortie(mission) {
  mission.phase = 'fly';
  mission.elapsed = 0;
  mission.duskLeft = DUSK_SECONDS;
  mission.banner = 'SORTIE 1 — PINE CREEK';
  mission.bannerSub = 'Fly through the amber ring, then land on the strip';
  mission.bannerUntil = 4;
}

export function updateMission(mission, world, plane, dt) {
  if (mission.phase !== 'fly' && mission.phase !== 'landed' && mission.phase !== 'pickup') return;
  mission.elapsed += dt;
  mission.duskLeft = Math.max(0, DUSK_SECONDS - mission.elapsed);
  if (mission.duskLeft <= 0 && mission.phase === 'fly') {
    mission.phase = 'night';
    mission.banner = 'NIGHT FELL OVER THE VALLEY';
    mission.bannerSub = mission.saved + ' of 24 hikers saved — the fog won this time';
    return;
  }
  if (plane.fuel <= 0 && mission.phase === 'fly' && !plane.onGround) {
    mission.phase = 'outoffuel';
    mission.banner = 'OUT OF FUEL';
    mission.bannerSub = 'The engine quit at ' + Math.round(plane.altitude) + ' ft — glide home next time';
    return;
  }
  if (mission.phase === 'fly') {
    mission.flown += (plane.speed * 1.9) * dt;
    const strip = currentStrip(world, mission);
    const remaining = strip.distance - mission.flown;
    // Amber ring sits 700 units before the strip threshold.
    if (!mission.ringPassed && remaining < 700 && remaining > 0) {
      if (plane.altitude > strip.elevation - 400 && plane.altitude < strip.elevation + 1400) {
        mission.ringPassed = true;
        mission.score += 250;
        plane.fuel = Math.min(100, plane.fuel + 8);
        mission.banner = 'RING CLEARED  +250';
        mission.bannerSub = '+8 fuel — line up on the strip ahead';
        mission.bannerUntil = 3;
      }
    }
    if (remaining <= 0 && plane.onGround) {
      landAtStrip(mission, world, plane);
    }
  }
  if (mission.phase === 'landed') {
    mission.landTimer -= dt;
    if (mission.landTimer <= 0) {
      mission.phase = 'pickup';
      const strip = currentStrip(world, mission);
      mission.saved += strip.hikers;
      mission.score += 500 + strip.hikers * 100;
      plane.fuel = Math.min(100, plane.fuel + 20);
      mission.banner = strip.hikers + ' HIKERS ABOARD  +' + (500 + strip.hikers * 100);
      mission.bannerSub = '+20 fuel from the strip cache — throttle up and go';
      mission.bannerUntil = 4;
      mission.leg += 1;
      mission.flown = 0;
      mission.ringPassed = false;
      if (mission.leg >= world.strips.length) {
        mission.phase = 'won';
        // Time bonus: every second of dusk left is worth 5 points.
        mission.score += Math.round(mission.duskLeft) * 5;
        mission.banner = 'ALL 24 HIKERS SAFE';
        mission.bannerSub = 'Final score ' + mission.score + ' — the valley remembers this flight';
        return;
      }
      mission.phase = 'fly';
      const next = currentStrip(world, mission);
      mission.banner = 'SORTIE ' + (mission.leg + 1) + ' — ' + next.name.toUpperCase();
      mission.bannerSub = next.hikers + ' hikers waiting · ' + Math.round(mission.duskLeft) + 's of dusk left';
      mission.bannerUntil = 4;
    }
  }
}

export function landAtStrip(mission, world, plane) {
  const strip = currentStrip(world, mission);
  const aligned = Math.abs(plane.heading - strip.heading) < 28 || Math.abs(plane.heading - strip.heading) > 332;
  const quality = touchdownQuality(plane.verticalSpeed, plane.speed, aligned);
  if (quality === 'crash') {
    mission.phase = 'crashed';
    mission.banner = 'CRASHED ON THE STRIP';
    mission.bannerSub = 'Too fast, too steep, or off heading — the gear gave up';
    return;
  }
  if (quality === 'hard') {
    plane.gearHealth = Math.max(0, plane.gearHealth - 25);
    mission.score += 100;
    mission.banner = 'HARD LANDING  +100';
    mission.bannerSub = 'Gear took a beating — 25% gone. Be gentle next time';
    if (plane.gearHealth <= 0) {
      mission.phase = 'crashed';
      mission.banner = 'GEAR COLLAPSED';
      mission.bannerSub = 'Too many hard landings — the plane will not fly again';
      return;
    }
  } else {
    mission.score += 200;
    mission.banner = 'SMOOTH LANDING  +200';
    mission.bannerSub = 'The hikers are running to the plane';
  }
  mission.bannerUntil = 2.5;
  mission.phase = 'landed';
  mission.landTimer = 2.2;
}

export function crashIntoTerrain(mission, plane) {
  mission.phase = 'crashed';
  mission.banner = 'TERRAIN STRIKE';
  mission.bannerSub = 'The ridge came up faster than the climb — ' + Math.round(plane.altitude) + ' ft was not enough';
}
