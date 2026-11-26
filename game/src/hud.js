// hud.js — the lit instruments: altitude, speed, heading, compass, fuel, gear, dusk.
import { duskClock } from './world.js';

export function updateHud(plane, mission, world) {
  setText('hud-alt', String(Math.round(plane.altitude)));
  setText('hud-spd', String(Math.round(plane.speed)));
  setText('hud-hdg', String(Math.round(plane.heading)).padStart(3, '0'));
  setText('hud-vs', (plane.verticalSpeed >= 0 ? '+' : '') + String(Math.round(plane.verticalSpeed)));
  setText('hud-fuel-num', String(Math.round(plane.fuel)));
  setText('hud-gear-num', String(Math.round(plane.gearHealth)));
  setText('hud-dusk', duskClock(mission.duskLeft));
  setText('hud-saved', mission.saved + '/24');
  setText('hud-score', String(mission.score));
  setText('hud-thr-num', Math.round(plane.throttle * 100) + '%');
  const fuelBar = document.getElementById('hud-fuel');
  if (fuelBar) {
    fuelBar.style.width = Math.max(0, plane.fuel) + '%';
    fuelBar.style.background = plane.fuel < 20 ? '#b3392e' : '#f5a623';
  }
  const gearBar = document.getElementById('hud-gear');
  if (gearBar) gearBar.style.width = Math.max(0, plane.gearHealth) + '%';
  const thrBar = document.getElementById('hud-thr');
  if (thrBar) thrBar.style.height = Math.round(plane.throttle * 100) + '%';
  const compass = document.getElementById('hud-compass');
  if (compass) compass.textContent = compassStrip(plane.heading);
  const missionEl = document.getElementById('hud-mission');
  if (missionEl) missionEl.textContent = missionLine(mission, world);
}

export function compassStrip(heading) {
  const points = ['N', '030', '060', 'E', '120', '150', 'S', '210', '240', 'W', '300', '330'];
  const idx = Math.round(heading / 30) % 12;
  const prev = points[(idx + 11) % 12];
  const next = points[(idx + 1) % 12];
  return prev + '   ◀ ' + points[idx] + ' ' + String(Math.round(heading)).padStart(3, '0') + '° ▶   ' + next;
}

export function missionLine(mission, world) {
  if (mission.phase === 'won') return 'ALL 24 HIKERS SAFE — FINAL SCORE ' + mission.score;
  if (mission.phase === 'crashed') return 'CRASHED — PRESS R TO FLY AGAIN';
  if (mission.phase === 'outoffuel') return 'OUT OF FUEL — PRESS R TO FLY AGAIN';
  if (mission.phase === 'night') return 'NIGHT FELL — PRESS R TO FLY AGAIN';
  const strip = world.strips[Math.min(mission.leg, world.strips.length - 1)];
  const remaining = Math.max(0, Math.round(strip.distance - mission.flown));
  const state = mission.phase === 'landed' ? 'ON THE GROUND — LOADING HIKERS' : 'STRIP ' + (mission.leg + 1) + ' OF 6 — ' + strip.name.toUpperCase() + ' · ' + remaining + ' M · HDG ' + String(strip.heading).padStart(3, '0');
  return state;
}

export function showBanner(title, sub, seconds) {
  const el = document.getElementById('banner');
  if (!el) return;
  el.innerHTML = '';
  const strong = document.createElement('div');
  strong.textContent = title;
  el.appendChild(strong);
  if (sub) {
    const small = document.createElement('small');
    small.textContent = sub;
    el.appendChild(small);
  }
  el.classList.remove('hidden');
  window.clearTimeout(showBanner.timer);
  showBanner.timer = window.setTimeout(function () {
    el.classList.add('hidden');
  }, seconds * 1000);
}

export function hideBanner() {
  const el = document.getElementById('banner');
  if (el) el.classList.add('hidden');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && el.textContent !== value) el.textContent = value;
}
