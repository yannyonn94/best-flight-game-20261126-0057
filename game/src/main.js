// main.js — Dusk Rescue entry point: game loop, landing detection, screens, restart.
import { createPlane, updatePlane, isStalled } from './physics.js';
import { buildWorld, distanceToStrip } from './world.js';
import { createMissionState, startSortie, updateMission, crashIntoTerrain, currentStrip } from './missions.js';
import { renderScene } from './render.js';
import { updateHud, showBanner, hideBanner } from './hud.js';
import { createInput, attachInput, pollInput, consumeFlag } from './input.js';
import { createAudio, ensureAudio, updateEngineSound, playRingChime, playThud, playAlarm, playPickup, toggleMute } from './audio.js';
import { shotFromUrl, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1280;
const HEIGHT = 720;

const world = buildWorld();
let plane = createPlane();
let mission = createMissionState(world);
const input = createInput();
const audio = createAudio();
attachInput(input, canvas);

let lastTime = performance.now();
let lastBanner = '';
let lowFuelWarned = false;
let shotFrozen = false;
let paused = false;

function resetFlight() {
  plane = createPlane();
  mission = createMissionState(world);
  hideBanner();
  lastBanner = '';
  lowFuelWarned = false;
  document.getElementById('title-screen').classList.remove('hidden');
}

function beginFlight() {
  document.getElementById('title-screen').classList.add('hidden');
  ensureAudio(audio);
  // Start 900 ft above the first strip: room to build speed before the ridges.
  plane.altitude = currentStrip(world, mission).elevation + 900;
  startSortie(mission);
  showBanner(mission.banner, mission.bannerSub, 4);
  lastBanner = mission.banner;
}

function groundContact() {
  if (mission.phase !== 'fly') return;
  const strip = currentStrip(world, mission);
  const remaining = distanceToStrip(world, mission.leg, mission.flown);
  const floor = strip.elevation;
  if (plane.altitude <= floor + 6) {
    if (remaining <= 320) {
      plane.altitude = floor;
      plane.onGround = true;
      playThud(audio);
    } else {
      crashIntoTerrain(mission, plane);
      playThud(audio);
    }
  }
}

function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  pollInput(input, WIDTH, HEIGHT);

  if (consumeFlag(input, 'restartPressed') && mission.phase !== 'title') {
    resetFlight();
  }
  if (consumeFlag(input, 'mutePressed')) {
    toggleMute(audio);
  }
  if (consumeFlag(input, 'pausePressed') && mission.phase !== 'title') {
    paused = !paused;
    showBanner(paused ? 'PAUSED' : 'FLYING', paused ? 'Press P to resume' : '', paused ? 30 : 1);
  }
  if (consumeFlag(input, 'startPressed') && mission.phase === 'title') {
    beginFlight();
  }

  if (!paused && (mission.phase === 'fly' || mission.phase === 'landed' || mission.phase === 'pickup')) {
    // In screenshot staging the pose is frozen: the render is the game, held still.
    if (!shotFrozen) {
      updatePlane(plane, input, dt, currentStrip(world, mission).elevation);
      groundContact();
      const wasRing = mission.ringPassed;
      const wasSaved = mission.saved;
      updateMission(mission, world, plane, dt);
      if (mission.ringPassed && !wasRing) playRingChime(audio);
      if (mission.saved > wasSaved) playPickup(audio);
      if (mission.banner && mission.banner !== lastBanner) {
        showBanner(mission.banner, mission.bannerSub, mission.bannerUntil || 3);
        lastBanner = mission.banner;
      }
      if (plane.fuel < 20 && !lowFuelWarned && mission.phase === 'fly') {
        lowFuelWarned = true;
        playAlarm(audio);
        showBanner('LOW FUEL — ' + Math.round(plane.fuel) + '% LEFT', 'Next ring or strip cache is your only hope', 3);
      }
      // A stall only kills you when the wing quits CLOSE to the ground while
      // sinking — not at takeoff, where every flight begins slow.
      if (isStalled(plane) && plane.verticalSpeed < -100 && plane.altitude < currentStrip(world, mission).elevation + 120) {
        crashIntoTerrain(mission, plane);
      }
      updateEngineSound(audio, plane);
    }
  }

  renderScene(ctx, world, plane, mission, now / 1000, WIDTH, HEIGHT);
  updateHud(plane, mission, world);
  requestAnimationFrame(tick);
}

// Screenshot staging: ?shot=cover|approach|landed|title poses a real render.
const shot = shotFromUrl();
if (shot) {
  shotFrozen = true;
  document.getElementById('title-screen').classList.add('hidden');
  applyShot(shot, plane, mission, world);
  mission.phase = shot === 'landed' ? 'landed' : 'fly';
  if (shot === 'title') mission.phase = 'title';
  if (shot === 'cover' || shot === 'approach') {
    // No centre banner in staged shots: the HUD mission line already says the
    // sortie, and the banner would hide the ring and the strip.
    hideBanner();
  }
  if (shot === 'landed') {
    hideBanner();
  }
}

requestAnimationFrame(tick);
