// aircraft.js — the bush plane itself: state helpers and the chase-view drawing.
import { clamp } from './physics.js';

export function drawAircraft(ctx, plane, cx, cy, scale, time) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-plane.bank * Math.PI) / 180);
  ctx.scale(scale, scale);
  // Shadow on the ground plane, offset by altitude so the pilot reads height.
  // Tail fin
  ctx.fillStyle = '#b3392e';
  ctx.beginPath();
  ctx.moveTo(-6, -58);
  ctx.lineTo(6, -58);
  ctx.lineTo(14, -96);
  ctx.lineTo(-14, -96);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5a623';
  ctx.fillRect(-14, -96, 28, 8);
  // Fuselage: a built, riveted bush-plane body, nose away from the viewer.
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath();
  ctx.moveTo(-16, -58);
  ctx.lineTo(16, -58);
  ctx.lineTo(22, 30);
  ctx.lineTo(10, 62);
  ctx.lineTo(-10, 62);
  ctx.lineTo(-22, 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a8378';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Belly stripe
  ctx.fillStyle = '#b3392e';
  ctx.fillRect(-16, 18, 32, 8);
  // Registration, hand-painted on the tail boom: PK-DUSK, the rescue callsign.
  ctx.fillStyle = '#10151a';
  ctx.font = '700 11px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PK-DUSK', 0, 40);
  // Cockpit windows, lit amber at dusk
  ctx.fillStyle = '#ffcf6e';
  ctx.fillRect(-13, -46, 11, 18);
  ctx.fillRect(2, -46, 11, 18);
  ctx.strokeStyle = '#10151a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-13, -46, 11, 18);
  ctx.strokeRect(2, -46, 11, 18);
  // Wings, wide and high-lift, with tip lights
  ctx.fillStyle = '#d94f30';
  ctx.beginPath();
  ctx.moveTo(-16, -18);
  ctx.lineTo(-118, -6);
  ctx.lineTo(-118, 10);
  ctx.lineTo(-16, 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -18);
  ctx.lineTo(118, -6);
  ctx.lineTo(118, 10);
  ctx.lineTo(16, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5a4e';
  ctx.beginPath();
  ctx.arc(-118, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7fe07f';
  ctx.beginPath();
  ctx.arc(118, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  // Horizontal stabiliser
  ctx.fillStyle = '#b3392e';
  ctx.fillRect(-52, 44, 104, 10);
  // Propeller blur: two spinning arcs ahead of the nose
  const spin = time * 22;
  ctx.strokeStyle = 'rgba(240, 236, 226, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -64, 20, spin, spin + Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -64, 20, spin + Math.PI, spin + Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();
}

export function drawGroundShadow(ctx, plane, cx, groundY, scale) {
  const heightFactor = clamp(1 - (plane.altitude - 2400) / 9000, 0.15, 0.9);
  ctx.save();
  ctx.globalAlpha = 0.2 * heightFactor;
  ctx.fillStyle = '#10151a';
  ctx.beginPath();
  ctx.ellipse(cx, groundY, 52 * scale * heightFactor, 9 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
