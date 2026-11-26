// audio.js — synthesised dusk-flight sound: engine hum, wind, ring chime, touchdown thud.
export function createAudio() {
  const state = {
    ctx: null,
    engine: null,
    engineGain: null,
    wind: null,
    windGain: null,
    muted: false,
    started: false,
  };
  return state;
}

export function ensureAudio(state) {
  if (state.started) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    state.ctx = new Ctx();
    state.engine = state.ctx.createOscillator();
    state.engine.type = 'sawtooth';
    state.engine.frequency.value = 62;
    state.engineGain = state.ctx.createGain();
    state.engineGain.gain.value = 0.0;
    const engineFilter = state.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 320;
    state.engine.connect(engineFilter);
    engineFilter.connect(state.engineGain);
    state.engineGain.connect(state.ctx.destination);
    state.engine.start();
    const buffer = state.ctx.createBuffer(1, state.ctx.sampleRate * 2, state.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    state.wind = state.ctx.createBufferSource();
    state.wind.buffer = buffer;
    state.wind.loop = true;
    const windFilter = state.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 480;
    state.windGain = state.ctx.createGain();
    state.windGain.gain.value = 0.0;
    state.wind.connect(windFilter);
    windFilter.connect(state.windGain);
    state.windGain.connect(state.ctx.destination);
    state.wind.start();
    state.started = true;
  } catch (err) {
    state.started = false;
  }
}

export function updateEngineSound(state, plane) {
  if (!state.started || !state.ctx) return;
  const t = state.ctx.currentTime;
  const target = state.muted ? 0 : 0.03 + plane.throttle * 0.05 + (plane.onGround ? 0 : 0.01);
  state.engineGain.gain.setTargetAtTime(target, t, 0.1);
  state.engine.frequency.setTargetAtTime(52 + plane.throttle * 68 + plane.speed * 0.12, t, 0.1);
  const windTarget = state.muted ? 0 : Math.min(0.09, plane.speed * 0.00045);
  state.windGain.gain.setTargetAtTime(windTarget, t, 0.2);
}

export function playTone(state, frequency, duration, type, volume) {
  if (!state.started || !state.ctx || state.muted) return;
  try {
    const osc = state.ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = frequency;
    const gain = state.ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.12, state.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(state.ctx.destination);
    osc.start();
    osc.stop(state.ctx.currentTime + duration);
  } catch (err) {
    // Sound is garnish; a failed beep never stops the flight.
  }
}

export function playRingChime(state) {
  playTone(state, 880, 0.35, 'sine', 0.14);
  window.setTimeout(function () { playTone(state, 1318, 0.4, 'sine', 0.1); }, 120);
}

export function playThud(state) {
  playTone(state, 90, 0.25, 'triangle', 0.2);
}

export function playPickup(state) {
  playTone(state, 523, 0.16, 'sine', 0.12);
  window.setTimeout(function () { playTone(state, 659, 0.16, 'sine', 0.12); }, 140);
  window.setTimeout(function () { playTone(state, 784, 0.3, 'sine', 0.12); }, 280);
}

export function playAlarm(state) {
  playTone(state, 440, 0.18, 'square', 0.06);
  window.setTimeout(function () { playTone(state, 440, 0.18, 'square', 0.06); }, 220);
}

export function toggleMute(state) {
  state.muted = !state.muted;
  return state.muted;
}
