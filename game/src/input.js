// input.js — keyboard + mouse steering for the bush plane.
export function createInput() {
  return {
    keys: new Set(),
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    throttleDelta: 0,
    roll: 0,
    pitch: 0,
    flaps: false,
    restartPressed: false,
    startPressed: false,
    mutePressed: false,
    pausePressed: false,
  };
}

export function attachInput(input, canvas) {
  window.addEventListener('keydown', function (event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    input.keys.add(event.key.toLowerCase());
    if (event.key === 'r' || event.key === 'R') input.restartPressed = true;
    if (event.key === 'Enter') input.startPressed = true;
    if (event.key === 'm' || event.key === 'M') input.mutePressed = true;
    if (event.key === 'p' || event.key === 'P') input.pausePressed = true;
  });
  window.addEventListener('keyup', function (event) {
    input.keys.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('mousedown', function (event) {
    input.mouseDown = true;
    input.mouseX = event.offsetX;
    input.mouseY = event.offsetY;
  });
  window.addEventListener('mouseup', function () {
    input.mouseDown = false;
  });
  canvas.addEventListener('mousemove', function (event) {
    input.mouseX = event.offsetX;
    input.mouseY = event.offsetY;
  });
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      input.startPressed = true;
    });
  }
}

export function pollInput(input, canvasWidth, canvasHeight) {
  const k = input.keys;
  input.throttleDelta = 0;
  if (k.has('w')) input.throttleDelta += 1;
  if (k.has('s')) input.throttleDelta -= 1;
  input.roll = 0;
  if (k.has('arrowleft') || k.has('a')) input.roll -= 1;
  if (k.has('arrowright') || k.has('d')) input.roll += 1;
  input.pitch = 0;
  if (k.has('arrowup')) input.pitch += 1;
  if (k.has('arrowdown')) input.pitch -= 1;
  if (k.has('f')) input.flaps = !input.flaps;
  // Mouse steering: hold and drag — the plane banks toward the pointer.
  if (input.mouseDown && canvasWidth > 0) {
    const nx = (input.mouseX / canvasWidth - 0.5) * 2;
    const ny = (input.mouseY / canvasHeight - 0.5) * 2;
    input.roll = Math.max(-1, Math.min(1, nx * 1.4));
    input.pitch = Math.max(-1, Math.min(1, -ny * 1.2));
  }
  return input;
}

export function consumeFlag(input, name) {
  const value = !!input[name];
  input[name] = false;
  return value;
}
