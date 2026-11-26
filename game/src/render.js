// render.js — the dusk valley on canvas: sky, sun, ridges, ground, strip, ring, fog.
import { drawAircraft, drawGroundShadow } from './aircraft.js';
import { distanceToStrip, fogDensity, headingErrorToStrip, stripProgress } from './world.js';
import { clamp } from './physics.js';

const SKY_TOP = '#2c3e55';
const SKY_MID = '#e07840';
const SKY_LOW = '#f5a623';

export function renderScene(ctx, world, plane, mission, time, width, height) {
  const horizon = height * 0.46 + plane.pitch * 2.2 - (plane.altitude - 5200) * 0.004;
  drawSky(ctx, horizon, width, height, time);
  drawSun(ctx, width * 0.72, horizon - 60, time);
  drawClouds(ctx, horizon, width, time);
  drawRidges(ctx, world, horizon, width, height, plane.heading, time);
  drawGround(ctx, world, plane, mission, horizon, width, height, time);
  drawRing(ctx, world, plane, mission, horizon, width, height);
  // On the ground the aircraft sits on the strip, low in the frame; in the air
  // it rides higher so the terrain ahead stays in view.
  const planeY = plane.onGround ? height * 0.8 : height * 0.66;
  drawGroundShadow(ctx, plane, width / 2, plane.onGround ? planeY + 78 : height * 0.86, 1);
  drawAircraft(ctx, plane, width / 2, planeY, 1.15, time);
  drawStallWarning(ctx, plane, width, height);
  drawFog(ctx, world, mission, width, height);
  drawVignette(ctx, width, height);
}

function drawSky(ctx, horizon, width, height, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, horizon);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(0.62, SKY_MID);
  grad.addColorStop(1, SKY_LOW);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, Math.max(0, horizon));
  // Early stars up high
  ctx.fillStyle = '#f2ede4';
  for (let i = 0; i < 26; i++) {
    const x = (i * 173 + 41) % width;
    const y = (i * 97 + 13) % Math.max(40, horizon * 0.4);
    ctx.globalAlpha = 0.25 + (i % 3) * 0.18;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawClouds(ctx, horizon, width, time) {
  // Slow dusk clouds, amber-lit underneath, drifting with the wind.
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 331 + time * 6) % (width + 320)) - 160;
    const cy = 60 + (i % 3) * 52;
    if (cy > horizon - 30) continue;
    ctx.fillStyle = 'rgba(242, 237, 228, 0.20)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90 + (i % 2) * 40, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(245, 166, 35, 0.16)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 80 + (i % 2) * 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSun(ctx, x, y, time) {
  const pulse = 1 + Math.sin(time * 0.7) * 0.02;
  ctx.save();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(x, y, 46 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3cf';
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRidges(ctx, world, horizon, width, height, heading, time) {
  const colours = ['#54463a', '#41362d', '#241f1a'];
  world.ridges.forEach(function (ridge, layer) {
    const baseY = horizon + layer * 16;
    const amp = 26 + layer * 30;
    ctx.fillStyle = colours[layer];
    ctx.beginPath();
    ctx.moveTo(0, height);
    const offset = (heading * ridge.speed * 4 + time * 2 * layer) % width;
    for (let px = 0; px <= width; px += 32) {
      const idx = Math.floor(((px + offset) / width) * 24) % 24;
      const peak = ridge.peaks[idx];
      ctx.lineTo(px, baseY - peak * amp);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  });
}

function drawGround(ctx, world, plane, mission, horizon, width, height, time) {
  ctx.fillStyle = '#3d4a2f';
  ctx.fillRect(0, horizon, width, height - horizon);
  // Valley floor texture: river, lake, forest patches sliding past with heading.
  const strip = world.strips[Math.min(mission.leg, world.strips.length - 1)];
  const scroll = (mission.flown * 0.35 + plane.heading * 6) % 400;
  if (strip.terrain === 'river' || strip.terrain === 'lake') {
    ctx.fillStyle = '#3a6b8a';
    ctx.beginPath();
    ctx.moveTo(width * 0.3, horizon);
    ctx.bezierCurveTo(width * 0.42, horizon + 90, width * 0.2, horizon + 200, width * 0.34, height);
    ctx.lineTo(width * 0.52, height);
    ctx.bezierCurveTo(width * 0.4, horizon + 200, width * 0.58, horizon + 90, width * 0.46, horizon);
    ctx.closePath();
    ctx.fill();
  }
  // Forest clumps
  ctx.fillStyle = '#2c3a22';
  for (let i = 0; i < 14; i++) {
    const x = ((i * 211 + scroll * 2) % (width + 120)) - 60;
    const y = horizon + 40 + ((i * 67) % 220);
    ctx.beginPath();
    ctx.arc(x, y, 14 + (i % 3) * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  drawStrip(ctx, world, plane, mission, horizon, width, height);
}

function drawStrip(ctx, world, plane, mission, horizon, width, height) {
  const strip = world.strips[Math.min(mission.leg, world.strips.length - 1)];
  const progress = stripProgress(world, mission.leg, mission.flown);
  const err = headingErrorToStrip(plane.heading, strip.heading);
  // The strip sits ahead on the ground plane; its lateral offset follows heading error.
  const centreX = width / 2 + clamp(err, -60, 60) * 7;
  const nearY = height * 0.98;
  const farY = horizon + (height - horizon) * (0.12 + progress * 0.55);
  // The strip grows as you close on it: wide at the near end, narrow at the far.
  const nearHalf = 40 + progress * 130;
  const farHalf = 8 + progress * 26;
  ctx.save();
  // Dirt strip with amber edge lights
  ctx.fillStyle = '#8a6f4d';
  ctx.beginPath();
  ctx.moveTo(centreX - farHalf, farY);
  ctx.lineTo(centreX + farHalf, farY);
  ctx.lineTo(centreX + nearHalf, nearY);
  ctx.lineTo(centreX - nearHalf, nearY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#f2ede4';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(centreX, farY);
  ctx.lineTo(centreX, nearY);
  ctx.stroke();
  ctx.setLineDash([]);
  // Strip name board at the threshold, offset to the LEFT of the strip and
  // raised above the wing line so the aircraft and the ring never cover it.
  ctx.fillStyle = '#10151a';
  ctx.fillRect(centreX - farHalf - 236, farY - 78, 220, 34);
  ctx.fillStyle = '#ffd98a';
  ctx.font = '700 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(strip.name.toUpperCase() + '  ·  ' + Math.max(0, Math.round(strip.distance - mission.flown)) + ' M', centreX - farHalf - 126, farY - 54);
  // Windsock at the near end
  ctx.fillStyle = '#b3392e';
  ctx.fillRect(centreX + nearHalf + 12, nearY - 52, 4, 52);
  ctx.beginPath();
  ctx.moveTo(centreX + nearHalf + 16, nearY - 52);
  ctx.lineTo(centreX + nearHalf + 44, nearY - 44);
  ctx.lineTo(centreX + nearHalf + 16, nearY - 36);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRing(ctx, world, plane, mission, horizon, width, height) {
  if (mission.ringPassed || mission.phase !== 'fly') return;
  const remaining = distanceToStrip(world, mission.leg, mission.flown) - 700;
  if (remaining < -200 || remaining > 2600) return;
  const t = clamp(1 - remaining / 2600, 0, 1);
  const cx = width / 2 + clamp(headingErrorToStrip(plane.heading, world.strips[mission.leg].heading), -50, 50) * 4;
  // The ring hangs in the sky AHEAD of the aircraft, above its nose, never behind it.
  const cy = horizon + (height * 0.52 - horizon) * (0.18 + t * 0.38);
  const rx = 20 + t * 120;
  const ry = 16 + t * 84;
  ctx.save();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 5 + t * 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd98a';
  ctx.font = '700 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RING  ·  ' + Math.max(0, Math.round(remaining)) + ' M', cx, cy - ry - 12);
  ctx.restore();
}

function drawStallWarning(ctx, plane, width, height) {
  if (plane.onGround || plane.speed >= 48) return;
  ctx.save();
  ctx.fillStyle = '#b3392e';
  ctx.fillRect(width / 2 - 130, 96, 260, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STALL — NOSE DOWN, FULL THROTTLE', width / 2, 123);
  ctx.restore();
}

function drawFog(ctx, world, mission, width, height) {
  const density = fogDensity(mission.elapsed, 360);
  if (density <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = density;
  ctx.fillStyle = '#8a7f72';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawVignette(ctx, width, height) {
  const grad = ctx.createRadialGradient(width / 2, height / 2, height * 0.45, width / 2, height / 2, height * 0.85);
  grad.addColorStop(0, 'rgba(16, 21, 26, 0)');
  grad.addColorStop(1, 'rgba(16, 21, 26, 0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
