// shots.js — deterministic screenshot staging: ?shot=cover|approach|landed|title
// poses the game mid-action so every screenshot is a real render of the code.
import { createPlane } from './physics.js';

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot') || '';
}

export function applyShot(shot, plane, mission, world) {
  if (!shot) return false;
  // Pick the leg first: every pose below is flown against that leg's strip.
  if (shot === 'cover' || shot === 'approach' || shot === 'landed') {
    mission.leg = 1;
    mission.saved = 4;
  }
  const strip = world.strips[mission.leg];
  if (shot === 'cover') {
    plane.speed = 118;
    plane.throttle = 0.72;
    plane.altitude = strip.elevation + 900;
    plane.heading = strip.heading;
    plane.bank = -14;
    plane.pitch = 2;
    mission.flown = strip.distance - 1750;
    mission.elapsed = 96;
    mission.duskLeft = 264;
    mission.score = 1250;
    return true;
  }
  if (shot === 'approach') {
    plane.speed = 82;
    plane.throttle = 0.42;
    plane.altitude = strip.elevation + 320;
    plane.heading = strip.heading;
    plane.bank = 6;
    plane.pitch = -4;
    plane.flaps = true;
    mission.flown = strip.distance - 260;
    mission.elapsed = 150;
    mission.duskLeft = 210;
    mission.score = 1450;
    return true;
  }
  if (shot === 'landed') {
    plane.speed = 0;
    plane.throttle = 0.12;
    plane.altitude = strip.elevation;
    plane.heading = strip.heading;
    plane.onGround = true;
    mission.flown = strip.distance;
    mission.phase = 'landed';
    mission.landTimer = 999;
    mission.elapsed = 178;
    mission.duskLeft = 182;
    mission.score = 1900;
    mission.saved = 8;
    return true;
  }
  if (shot === 'title') {
    plane.speed = 95;
    plane.throttle = 0.6;
    plane.altitude = strip.elevation + 1500;
    plane.heading = strip.heading;
    mission.elapsed = 40;
    mission.duskLeft = 320;
    return true;
  }
  return false;
}

export function freshPlaneForShot() {
  return createPlane();
}
