// physics.js — the bush plane's flight model: throttle, pitch, bank, stall, landing.
export function createPlane() {
  return {
    speed: 0,          // knots
    throttle: 0.55,    // 0..1
    altitude: 5200,    // feet above sea level
    verticalSpeed: 0,  // feet per minute
    heading: 0,        // degrees
    bank: 0,           // degrees, -60..60
    pitch: 0,          // degrees, -15..20
    flaps: false,
    onGround: false,
    gearHealth: 100,
    fuel: 100,
  };
}

export const STALL_SPEED = 48;
export const MAX_SPEED = 165;
export const CRUISE_CLIMB = 900;

export function updatePlane(plane, input, dt, terrainFloor) {
  if (plane.onGround) {
    updateGroundRoll(plane, input, dt);
    return;
  }
  plane.throttle = clamp(plane.throttle + input.throttleDelta * dt * 0.55, 0, 1);
  plane.flaps = input.flaps;
  const targetBank = clamp(input.roll * 55, -55, 55);
  plane.bank += (targetBank - plane.bank) * Math.min(1, dt * 3.2);
  const targetPitch = clamp(input.pitch * 16, -14, 18);
  plane.pitch += (targetPitch - plane.pitch) * Math.min(1, dt * 2.6);

  const flapDrag = plane.flaps ? 0.82 : 1;
  const targetSpeed = (30 + plane.throttle * 150) * flapDrag;
  plane.speed += (targetSpeed - plane.speed) * Math.min(1, dt * 0.55);
  plane.speed = clamp(plane.speed, 0, MAX_SPEED);

  // Turn rate grows with bank and falls off at low speed; heading follows the bank.
  const turnRate = (plane.bank / 55) * (plane.speed / 90) * 14;
  plane.heading = (plane.heading + turnRate * dt + 360) % 360;

  // Climb: pitch lifts, throttle feeds it; a stalled wing sinks fast.
  // Flaps buy lift at low speed: they drop the stall speed by 8 kt.
  const stallSpeed = plane.flaps ? STALL_SPEED - 8 : STALL_SPEED;
  let climb = Math.sin((plane.pitch * Math.PI) / 180) * plane.speed * 95;
  if (plane.speed < stallSpeed) {
    climb -= (stallSpeed - plane.speed) * 55;
  }
  plane.verticalSpeed = climb;
  plane.altitude += (climb * dt) / 60;
  if (plane.altitude < terrainFloor) {
    plane.altitude = terrainFloor;
  }
  plane.fuel = Math.max(0, plane.fuel - (0.35 + plane.throttle * 1.5) * dt);
}

export function updateGroundRoll(plane, input, dt) {
  plane.throttle = clamp(plane.throttle + input.throttleDelta * dt * 0.55, 0, 1);
  const targetSpeed = plane.throttle * 150;
  plane.speed += (targetSpeed - plane.speed) * Math.min(1, dt * 0.5);
  plane.bank *= Math.max(0, 1 - dt * 4);
  plane.pitch *= Math.max(0, 1 - dt * 4);
  plane.verticalSpeed = 0;
  if (plane.speed > 62 && plane.throttle > 0.7) {
    plane.onGround = false;
    plane.altitude += 4;
  }
  plane.fuel = Math.max(0, plane.fuel - (0.2 + plane.throttle * 1.1) * dt);
}

// Returns 'ok' | 'hard' | 'crash' for a touchdown at the given descent rate.
export function touchdownQuality(verticalSpeed, speed, aligned) {
  const descent = -verticalSpeed;
  if (!aligned) return 'crash';
  if (descent > 900 || speed > 118) return 'crash';
  if (descent > 520 || speed > 102) return 'hard';
  return 'ok';
}

export function isStalled(plane) {
  return !plane.onGround && plane.speed < STALL_SPEED;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
