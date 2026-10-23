"use strict";

/* ======================================================
   FLAPPYVISION — NEON ARCADE
   Hand tracking + smooth physics + collectible coins
   ====================================================== */

const $ = (id) => document.getElementById(id);

const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");

const video = $("camera-video");
const handCanvas = $("hand-canvas");
const handCtx = handCanvas.getContext("2d");

const startScreen = $("start-screen");
const gameScreen = $("game-screen");

const startBtn = $("start-btn");
const playBtn = $("play-btn");
const restartBtn = $("restart-btn");
const homeBtn = $("home-btn");
const gameoverHomeBtn = $("gameover-home-btn");
const brandHome = $("brand-home");

const readyOverlay = $("ready-overlay");
const gameoverOverlay = $("gameover-overlay");
const countdownElement = $("countdown");

const scoreElement = $("score");
const bestScoreElement = $("best-score");
const gameBestElement = $("game-best");
const coinCountElement = $("coin-count");
const finalScoreElement = $("final-score");
const finalBestElement = $("final-best");
const finalCoinsElement = $("final-coins");
const bestScoreText = $("best-score-text");

const trackingDot = $("tracking-dot");
const trackingText = $("tracking-text");
const cameraPlaceholder = $("camera-placeholder");

const soundBtn = $("sound-btn");
const soundIcon = $("sound-icon");

const messageBox = $("message-box");
const messageText = $("message-text");
const messageIcon = $("message-icon");
const messageClose = $("message-close");
const floatingScore = $("floating-score");

// ------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------

const W = 900;
const H = 720;
const GROUND = 90;

const BIRD_X = 220;
const BIRD_R = 17;

const GRAVITY = 1550;
const FLAP_VELOCITY = -460;
const MAX_FALL_SPEED = 580;

const PIPE_W = 84;
const PIPE_GAP = 205;
const PIPE_SPEED = 245;
const PIPE_INTERVAL = 1.65;

const COIN_R = 13;
const COIN_VALUE = 1;

const PINCH_ON = 0.050;
const PINCH_OFF = 0.078;
const FLAP_COOLDOWN = 220;

const COLORS = {
  cyan: "#63F5FF",
  purple: "#AD83FF",
  pink: "#FF72DC",
  gold: "#FFDC72",
  white: "#FFFFFF"
};

// ------------------------------------------------------
// GAME STATE
// ------------------------------------------------------

let state = "menu";

let score = 0;
let coinsCollected = 0;
let bestScore = loadNumber("flappyvision-best");
let bestCoins = loadNumber("flappyvision-coins");

let bird = {
  y: H * 0.43,
  vy: 0,
  rotation: 0
};

let pipes = [];
let coins = [];
let particles = [];
let stars = [];
let clouds = [];

let elapsed = 0;
let pipeTimer = 0;
let lastTime = 0;
let lastFlapTime = 0;

let countdownId = 0;
let floatingScoreTimer = 0;

let hands = null;
let camera = null;
let cameraStarted = false;
let cameraStarting = false;

let handDetected = false;
let wasPinching = false;
let pinchLocked = false;

let soundEnabled = true;
let audioContext = null;
let toastTimer = null;

// ------------------------------------------------------
// STORAGE
// ------------------------------------------------------

function loadNumber(key) {
  try {
    return Math.max(
      0,
      Number(localStorage.getItem(key)) || 0
    );
  } catch {
    return 0;
  }
}

function storeNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // The game still works if storage is unavailable.
  }
}

function updateHUD() {
  scoreElement.textContent = score;
  bestScoreElement.textContent = bestScore;
  gameBestElement.textContent = bestScore;
  coinCountElement.textContent = coinsCollected;

  finalScoreElement.textContent = score;
  finalBestElement.textContent = bestScore;
  finalCoinsElement.textContent = coinsCollected;
}

// ------------------------------------------------------
// AUDIO
// All effects are synthesized. No sound files required.
// ------------------------------------------------------

function initAudio() {
  if (!soundEnabled) return;

  try {
    const AudioCtor =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioCtor) return;

    if (!audioContext) {
      audioContext = new AudioCtor();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  } catch (error) {
    console.warn("Audio unavailable:", error);
  }
}

function tone(
  frequency,
  duration = 0.12,
  type = "sine",
  volume = 0.045,
  endFrequency = null
) {
  if (!soundEnabled) return;

  initAudio();
  if (!audioContext) return;

  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    if (endFrequency !== null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFrequency),
        now + duration
      );
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration
    );

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (error) {
    console.warn("Audio playback failed:", error);
  }
}

function soundFlap() {
  tone(420, 0.09, "sine", 0.035, 720);
}

function soundCoin() {
  tone(880, 0.10, "sine", 0.055, 1150);

  setTimeout(() => {
    tone(1320, 0.15, "sine", 0.04, 1600);
  }, 55);
}

function soundScore() {
  tone(660, 0.09, "triangle", 0.035, 920);
}

function soundStart() {
  tone(460, 0.10, "sine", 0.035, 600);

  setTimeout(() => {
    tone(700, 0.15, "sine", 0.045, 1000);
  }, 90);
}

function soundCrash() {
  tone(250, 0.28, "triangle", 0.055, 110);

  setTimeout(() => {
    tone(125, 0.24, "sawtooth", 0.025, 65);
  }, 120);
}

// ------------------------------------------------------
// TOAST MESSAGE
// ------------------------------------------------------

function showMessage(message, error = false) {
  messageText.textContent = message;
  messageIcon.textContent = error ? "!" : "✦";

  messageBox.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    messageBox.classList.add("hidden");
  }, 6500);
}

messageClose.addEventListener("click", () => {
  messageBox.classList.add("hidden");
});

// ------------------------------------------------------
// BACKGROUND
// ------------------------------------------------------

function initBackground() {
  stars = [];
  clouds = [];

  for (let i = 0; i < 95; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2
    });
  }

  for (let i = 0; i < 11; i++) {
    clouds.push({
      x: Math.random() * W,
      y: 60 + Math.random() * 390,
      size: 20 + Math.random() * 36,
      speed: 7 + Math.random() * 12
    });
  }
}

function drawBackground(dt) {
  const bg = ctx.createLinearGradient(0, 0, W, H);

  bg.addColorStop(0, "#10082F");
  bg.addColorStop(0.52, "#28205F");
  bg.addColorStop(1, "#101C4B");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft atmospheric glow.
  let glow = ctx.createRadialGradient(
    700, 135, 5, 700, 135, 220
  );

  glow.addColorStop(0, "#5EEFFF25");
  glow.addColorStop(1, "#5EEFFF00");

  ctx.fillStyle = glow;
  ctx.fillRect(460, 0, 440, 360);

  // Moon.
  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#C4F8FF";

  ctx.beginPath();
  ctx.arc(730, 115, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Twinkling stars.
  for (const star of stars) {
    const alpha =
      0.24 +
      0.66 * (
        0.5 +
        0.5 * Math.sin(elapsed * 1.6 + star.phase)
      );

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFFFFF";

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // Clouds move only during active play.
  for (const cloud of clouds) {
    if (state === "playing") {
      cloud.x -= cloud.speed * dt;
    }

    if (cloud.x < -cloud.size * 3) {
      cloud.x = W + cloud.size;
      cloud.y = 30 + Math.random() * 410;
    }

    drawCloud(cloud);
  }

  drawHills(H - GROUND - 74, "#302A70", 0.9);
  drawHills(H - GROUND - 37, "#211D56", 1.35);
}

function drawCloud(c) {
  ctx.save();
  ctx.globalAlpha = 0.105;
  ctx.fillStyle = "#B4F7FF";

  ctx.beginPath();
  ctx.ellipse(c.x, c.y, c.size, c.size * 0.45, 0, 0, Math.PI * 2);
  ctx.ellipse(c.x + c.size * 0.55, c.y - c.size * 0.24, c.size * 0.65, c.size * 0.5, 0, 0, Math.PI * 2);
  ctx.ellipse(c.x + c.size * 1.05, c.y, c.size * 0.75, c.size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHills(baseY, color, factor) {
  ctx.beginPath();
  ctx.moveTo(0, H);

  for (let x = 0; x <= W; x += 8) {
    const y =
      baseY +
      Math.sin(x * 0.008 * factor + 1) * 19 +
      Math.sin(x * 0.017 * factor) * 10;

    ctx.lineTo(x, y);
  }

  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ------------------------------------------------------
// GROUND
// ------------------------------------------------------

function drawGround() {
  const y = H - GROUND;

  const grad = ctx.createLinearGradient(0, y, 0, H);
  grad.addColorStop(0, "#B17AFF");
  grad.addColorStop(0.10, "#6840C7");
  grad.addColorStop(1, "#171238");

  ctx.fillStyle = grad;
  ctx.fillRect(0, y, W, GROUND);

  ctx.save();
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 14;
  ctx.fillRect(0, y, W, 3);
  ctx.restore();

  const offset = (elapsed * 75) % 46;

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#FFFFFF";

  for (let x = -46 - offset; x < W; x += 46) {
    ctx.fillRect(x, y + 23, 23, 3);
  }

  ctx.globalAlpha = 1;

  ctx.fillStyle = "#D5C7FF";
  ctx.font = "700 11px Outfit, sans-serif";
  ctx.fillText("FLAPPYVISION ✦", 20, H - 20);
}

// ------------------------------------------------------
// BIRD
// ------------------------------------------------------

function drawBird() {
  const floating =
    state === "menu" ||
    state === "ready" ||
    state === "countdown";

  const y = floating
    ? H * 0.43 + Math.sin(elapsed * 2.4) * 9
    : bird.y;

  ctx.save();
  ctx.translate(BIRD_X, y);

  const rotation = state === "playing"
    ? Math.max(-0.48, Math.min(0.9, bird.vy / 620))
    : Math.sin(elapsed * 1.7) * 0.035;

  ctx.rotate(rotation);

  // Soft bird glow.
  ctx.save();
  ctx.shadowColor = "#FFE57D";
  ctx.shadowBlur = 18;

  const body = ctx.createLinearGradient(-20, -20, 23, 22);
  body.addColorStop(0, "#FFFBC5");
  body.addColorStop(0.5, "#FFDC68");
  body.addColorStop(1, "#FF9C45");

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Animated wing.
  const wingMove = Math.sin(elapsed * (state === "playing" ? 19 : 4)) * 4;

  ctx.fillStyle = "#F8A53E";
  ctx.beginPath();
  ctx.ellipse(-7, 5 + wingMove, 10, 6.5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye.
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(8, -7, 6.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#201438";
  ctx.beginPath();
  ctx.arc(10.5, -6, 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(11.5, -7.2, 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Beak.
  ctx.fillStyle = "#FF795D";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(29, 4);
  ctx.lineTo(16, 9);
  ctx.closePath();
  ctx.fill();

  // Blush.
  ctx.fillStyle = "#FF9CAD";
  ctx.beginPath();
  ctx.arc(8, 7, 2.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ------------------------------------------------------
// PIPES
// ------------------------------------------------------

function createPipe() {
  const minCenter = 140 + PIPE_GAP / 2;
  const maxCenter = H - GROUND - 105 - PIPE_GAP / 2;

  const gapY = minCenter + Math.random() * (maxCenter - minCenter);

  const pipe = {
    x: W + 24,
    gapY,
    passed: false,
    coinSpawned: false
  };

  pipes.push(pipe);

  // A collectible coin appears near the middle of most gaps.
  if (Math.random() < 0.88) {
    coins.push({
      x: W + 24 + PIPE_W / 2,
      y: gapY + (Math.random() - 0.5) * 48,
      r: COIN_R,
      collected: false,
      phase: Math.random() * Math.PI * 2,
      value: COIN_VALUE
    });
  }
}

function drawPipe(pipe) {
  const gapTop = pipe.gapY - PIPE_GAP / 2;
  const gapBottom = pipe.gapY + PIPE_GAP / 2;
  const groundY = H - GROUND;

  const grad = ctx.createLinearGradient(
    pipe.x, 0, pipe.x + PIPE_W, 0
  );

  grad.addColorStop(0, "#3A1B8D");
  grad.addColorStop(0.25, "#A47AFF");
  grad.addColorStop(0.52, "#7446D6");
  grad.addColorStop(1, "#32146E");

  ctx.save();
  ctx.shadowColor = "#9B60FF";
  ctx.shadowBlur = 13;
  ctx.fillStyle = grad;

  ctx.fillRect(pipe.x, 0, PIPE_W, Math.max(0, gapTop));
  ctx.fillRect(
    pipe.x,
    gapBottom,
    PIPE_W,
    Math.max(0, groundY - gapBottom)
  );

  ctx.restore();

  // Pipe caps.
  ctx.save();
  ctx.shadowColor = "#A987FF";
  ctx.shadowBlur = 12;

  ctx.fillStyle = "#B99AFF";
  ctx.fillRect(pipe.x - 6, gapTop - 23, PIPE_W + 12, 23);
  ctx.fillRect(pipe.x - 6, gapBottom, PIPE_W + 12, 23);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFFFFF";
  ctx.globalAlpha = 0.28;

  ctx.fillRect(pipe.x + 11, 0, 4, Math.max(0, gapTop - 23));
  ctx.fillRect(pipe.x + 11, gapBottom + 23, 4, Math.max(0, groundY - gapBottom - 23));

  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#D9F9FF";
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.45;

  ctx.strokeRect(pipe.x + 6, gapTop - 17, PIPE_W - 12, 10);
  ctx.strokeRect(pipe.x + 6, gapBottom + 6, PIPE_W - 12, 10);

  ctx.restore();
}

// ------------------------------------------------------
// COINS
// ------------------------------------------------------

function drawCoin(coin) {
  if (coin.collected) return;

  const y = coin.y + Math.sin(elapsed * 4 + coin.phase) * 4;
  const spin = Math.abs(Math.cos(elapsed * 4 + coin.phase));

  ctx.save();
  ctx.translate(coin.x, y);

  // Glow.
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 18;

  const gold = ctx.createLinearGradient(-COIN_R, -COIN_R, COIN_R, COIN_R);
  gold.addColorStop(0, "#FFF6B0");
  gold.addColorStop(0.45, "#FFCF47");
  gold.addColorStop(1, "#F89C22");

  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(2, COIN_R * spin), COIN_R, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#FFF3A4";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(1, COIN_R * spin - 3), COIN_R - 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (spin > 0.35) {
    ctx.fillStyle = "#A96216";
    ctx.font = "900 12px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("¢", 0, 1);
  }

  ctx.restore();
}

function collectCoin(coin) {
  if (coin.collected) return;

  coin.collected = true;
  coinsCollected += coin.value;

  // Coins also reward a small bonus to the score.
  score += 1;

  if (score > bestScore) {
    bestScore = score;
    storeNumber("flappyvision-best", bestScore);
  }

  storeNumber("flappyvision-coins", bestCoins + coinsCollected);

  createBurst(coin.x, coin.y, [
    COLORS.gold,
    "#FFF9C9",
    "#FFAA3B",
    COLORS.cyan
  ], 22);

  showFloatingScore("+1 COIN", coin.x, coin.y);
  soundCoin();
  updateHUD();
}

function updateCoins(dt) {
  for (const coin of coins) {
    coin.x -= currentPipeSpeed() * dt;

    if (coin.collected) continue;

    const coinY =
      coin.y + Math.sin(elapsed * 4 + coin.phase) * 4;

    const dx = BIRD_X - coin.x;
    const dy = bird.y - coinY;

    // Generous collection radius makes the mechanic feel fair.
    if (Math.hypot(dx, dy) < BIRD_R + coin.r + 5) {
      collectCoin(coin);
    }
  }

  coins = coins.filter(
    coin => !coin.collected && coin.x > -35
  );
}

// ------------------------------------------------------
// DIFFICULTY / PIPE SPEED
// ------------------------------------------------------

function currentPipeSpeed() {
  // A gentle increase, capped so the game remains playable.
  return Math.min(PIPE_SPEED + score * 1.25, 305);
}

function updatePipes(dt) {
  pipeTimer += dt;

  if (pipeTimer >= PIPE_INTERVAL) {
    pipeTimer -= PIPE_INTERVAL;
    createPipe();
  }

  const speed = currentPipeSpeed();

  for (const pipe of pipes) {
    pipe.x -= speed * dt;

    if (!pipe.passed && pipe.x + PIPE_W < BIRD_X) {
      pipe.passed = true;
      score += 1;

      if (score > bestScore) {
        bestScore = score;
        storeNumber("flappyvision-best", bestScore);
      }

      createBurst(BIRD_X, bird.y, [
        "#FFFFFF",
        COLORS.cyan,
        COLORS.purple
      ], 10);

      showFloatingScore("+1", BIRD_X, bird.y - 20);
      soundScore();
      updateHUD();
    }
  }

  pipes = pipes.filter(pipe => pipe.x + PIPE_W + 30 > 0);
}

// ------------------------------------------------------
// COLLISIONS
// ------------------------------------------------------

function circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return dx * dx + dy * dy < r * r;
}

function checkCollisions() {
  const groundY = H - GROUND;

  if (bird.y - BIRD_R < 0 || bird.y + BIRD_R > groundY) {
    endGame();
    return;
  }

  for (const pipe of pipes) {
    const top = pipe.gapY - PIPE_GAP / 2;
    const bottom = pipe.gapY + PIPE_GAP / 2;
    const r = BIRD_R - 3;

    const hitTop = circleRectCollision(
      BIRD_X, bird.y, r,
      pipe.x, 0, PIPE_W, top
    );

    const hitBottom = circleRectCollision(
      BIRD_X, bird.y, r,
      pipe.x, bottom, PIPE_W, groundY - bottom
    );

    if (hitTop || hitBottom) {
      endGame();
      return;
    }
  }
}

// ------------------------------------------------------
// PARTICLES
// ------------------------------------------------------

function createBurst(x, y, colors, amount = 16) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 190;
    const life = 0.35 + Math.random() * 0.55;

    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 1.8 + Math.random() * 3.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function createFlapParticles() {
  createBurst(
    BIRD_X - 15,
    bird.y + 3,
    ["#FFFFFF", "#BDFBFF", COLORS.cyan, COLORS.gold],
    7
  );
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 100 * dt;
    p.life -= dt;
  }

  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 9;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function showFloatingScore(text, x, y) {
  floatingScore.textContent = text;

  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / W;
  const scaleY = rect.height / H;

  floatingScore.style.left = `${x * scaleX}px`;
  floatingScore.style.top = `${y * scaleY}px`;

  floatingScore.classList.remove("hidden");

  // Restart CSS animation.
  floatingScore.style.animation = "none";
  void floatingScore.offsetWidth;
  floatingScore.style.animation = "";

  floatingScoreTimer = 0.85;
}

// ------------------------------------------------------
// FLAP
// ------------------------------------------------------

function flap() {
  if (state !== "playing") return;

  const now = performance.now();

  if (now - lastFlapTime < FLAP_COOLDOWN) return;

  lastFlapTime = now;

  bird.vy = FLAP_VELOCITY;

  createFlapParticles();
  soundFlap();
}

// ------------------------------------------------------
// KEYBOARD CONTROLS
// ------------------------------------------------------

document.addEventListener("keydown", event => {
  if (event.code !== "Space" || event.repeat) return;

  if (
    state === "playing" ||
    state === "ready" ||
    state === "countdown"
  ) {
    event.preventDefault();
    initAudio();

    if (state === "ready") {
      startCountdown();
    } else if (state === "playing") {
      flap();
    }
  }
});

canvas.addEventListener("pointerdown", () => {
  initAudio();

  if (state === "ready") {
    startCountdown();
  } else if (state === "playing") {
    flap();
  }
});

// ------------------------------------------------------
// HAND TRACKING
// ------------------------------------------------------

function setTrackingStatus(message, mode = "idle") {
  trackingText.textContent = message;
  trackingDot.classList.remove("active", "error");

  if (mode === "active") {
    trackingDot.classList.add("active");
  } else if (mode === "error") {
    trackingDot.classList.add("error");
  }
}

function drawHandPreview(results) {
  const width = handCanvas.width;
  const height = handCanvas.height;

  handCtx.clearRect(0, 0, width, height);

  const landmarks = results.multiHandLandmarks;

  if (!landmarks || !landmarks.length) return;

  const points = landmarks[0];

  const connections = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17]
  ];

  handCtx.save();
  handCtx.translate(width, 0);
  handCtx.scale(-1, 1);

  handCtx.strokeStyle = COLORS.cyan;
  handCtx.lineWidth = 3;
  handCtx.shadowColor = COLORS.cyan;
  handCtx.shadowBlur = 8;

  for (const [a, b] of connections) {
    handCtx.beginPath();
    handCtx.moveTo(points[a].x * width, points[a].y * height);
    handCtx.lineTo(points[b].x * width, points[b].y * height);
    handCtx.stroke();
  }

  points.forEach((p, index) => {
    handCtx.beginPath();
    handCtx.arc(
      p.x * width,
      p.y * height,
      index === 4 || index === 8 ? 5 : 2.4,
      0,
      Math.PI * 2
    );

    handCtx.fillStyle =
      index === 4 || index === 8
        ? COLORS.pink
        : "#FFFFFF";

    handCtx.fill();
  });

  handCtx.restore();
}

function handleHandResults(results) {
  const landmarks = results.multiHandLandmarks;

  handDetected = Boolean(landmarks && landmarks.length > 0);

  drawHandPreview(results);

  if (!handDetected) {
    wasPinching = false;
    pinchLocked = false;

    if (cameraStarted) {
      setTrackingStatus("Show your hand to the camera");
    }

    return;
  }

  const hand = landmarks[0];
  const thumb = hand[4];
  const index = hand[8];

  const distance = Math.hypot(
    thumb.x - index.x,
    thumb.y - index.y
  );

  // Hysteresis prevents rapid triggering near the threshold.
  let pinching;

  if (pinchLocked) {
    pinching = distance < PINCH_OFF;
  } else {
    pinching = distance < PINCH_ON;
  }

  if (pinching && !wasPinching) {
    if (state === "ready") {
      startCountdown();
    } else if (state === "playing") {
      flap();
    }
  }

  pinchLocked = pinching;
  wasPinching = pinching;

  setTrackingStatus(
    state === "playing"
      ? (pinching ? "Pinch detected — FLAP!" : "Hand detected — ready")
      : "Hand tracking active",
    "active"
  );
}

// ------------------------------------------------------
// CAMERA
// ------------------------------------------------------

async function initializeCamera() {
  if (cameraStarted) return true;
  if (cameraStarting) return false;

  if (typeof Hands === "undefined" || typeof Camera === "undefined") {
    setTrackingStatus("MediaPipe failed to load", "error");
    showMessage("MediaPipe failed to load. Check your internet connection and reload.", true);
    return false;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setTrackingStatus("Camera API unavailable", "error");
    showMessage("Use Live Server or another localhost server to access the camera.", true);
    return false;
  }

  cameraStarting = true;
  startBtn.disabled = true;

  const startLabel = startBtn.querySelector("span:nth-child(2)");
  if (startLabel) startLabel.textContent = "STARTING CAMERA...";

  setTrackingStatus("Requesting camera permission...");

  try {
    hands = new Hands({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.6
    });

    hands.onResults(handleHandResults);

    camera = new Camera(video, {
      onFrame: async () => {
        if (hands && video.readyState >= 2) {
          await hands.send({ image: video });
        }
      },
      width: 640,
      height: 480
    });

    await camera.start();

    cameraStarted = true;
    cameraPlaceholder.classList.add("hidden");

    handCanvas.width = 640;
    handCanvas.height = 480;

    setTrackingStatus("Camera active — show your hand", "active");

    return true;

  } catch (error) {
    console.error("Camera initialization failed:", error);

    setTrackingStatus("Camera unavailable — use SPACE", "error");

    showMessage(
      "Camera could not start. Allow camera access in your browser settings. You can still play using SPACE.",
      true
    );

    return false;

  } finally {
    cameraStarting = false;
    startBtn.disabled = false;

    if (startLabel) startLabel.textContent = "LET'S PLAY";
  }
}

// ------------------------------------------------------
// SCREENS / GAME FLOW
// ------------------------------------------------------

async function showGameScreen() {
  initAudio();

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  resetGame();

  await initializeCamera();
}

function resetGame() {
  countdownId++;

  state = "ready";

  score = 0;
  coinsCollected = 0;

  bird.y = H * 0.43;
  bird.vy = 0;
  bird.rotation = 0;

  pipes = [];
  coins = [];
  particles = [];

  pipeTimer = 0;
  lastFlapTime = 0;

  wasPinching = false;
  pinchLocked = false;

  readyOverlay.classList.remove("hidden");
  gameoverOverlay.classList.add("hidden");
  countdownElement.classList.add("hidden");
  floatingScore.classList.add("hidden");

  updateHUD();
}

function startCountdown() {
  if (state !== "ready") return;

  initAudio();

  state = "countdown";
  const myId = ++countdownId;

  readyOverlay.classList.add("hidden");
  gameoverOverlay.classList.add("hidden");
  countdownElement.classList.remove("hidden");

  let count = 3;
  countdownElement.textContent = count;

  tone(540, 0.11, "sine", 0.04);

  function tick() {
    if (myId !== countdownId || state !== "countdown") return;

    count--;

    if (count > 0) {
      countdownElement.textContent = count;
      tone(540, 0.11, "sine", 0.04);
      setTimeout(tick, 650);
      return;
    }

    countdownElement.textContent = "FLY!";
    soundStart();

    setTimeout(() => {
      if (myId !== countdownId || state !== "countdown") return;

      countdownElement.classList.add("hidden");
      state = "playing";

      // A small initial lift makes the first moment feel responsive.
      bird.vy = -100;
      lastTime = performance.now();

    }, 420);
  }

  setTimeout(tick, 650);
}

function endGame() {
  if (state !== "playing") return;

  state = "gameover";
  countdownId++;

  countdownElement.classList.add("hidden");

  const newRecord = score > bestScore;

  if (newRecord) {
    bestScore = score;
    storeNumber("flappyvision-best", bestScore);
  }

  const totalSavedCoins = loadNumber("flappyvision-coins");
  bestCoins = Math.max(bestCoins, totalSavedCoins);

  bestScoreText.textContent = newRecord
    ? "✦ NEW PERSONAL BEST! ✦"
    : "One more flight. One more chance.";

  updateHUD();
  gameoverOverlay.classList.remove("hidden");

  createBurst(BIRD_X, bird.y, [
    COLORS.pink,
    COLORS.purple,
    COLORS.cyan,
    "#FFFFFF"
  ], 28);

  soundCrash();
}

function returnHome() {
  countdownId++;

  state = "menu";

  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");

  countdownElement.classList.add("hidden");

  wasPinching = false;
  pinchLocked = false;
}

// ------------------------------------------------------
// BUTTONS
// ------------------------------------------------------

startBtn.addEventListener("click", showGameScreen);
playBtn.addEventListener("click", startCountdown);

restartBtn.addEventListener("click", () => {
  resetGame();
  startCountdown();
});

homeBtn.addEventListener("click", returnHome);
gameoverHomeBtn.addEventListener("click", returnHome);

brandHome.addEventListener("click", event => {
  event.preventDefault();
  returnHome();
});

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  soundIcon.textContent = soundEnabled ? "♫" : "♪";
  soundBtn.setAttribute("aria-pressed", String(soundEnabled));

  if (soundEnabled) {
    initAudio();
    tone(700, 0.1, "sine", 0.035, 950);
  }
});

// ------------------------------------------------------
// UPDATE
// ------------------------------------------------------

function update(dt) {
  elapsed += dt;

  if (floatingScoreTimer > 0) {
    floatingScoreTimer -= dt;

    if (floatingScoreTimer <= 0) {
      floatingScore.classList.add("hidden");
    }
  }

  if (state === "playing") {
    bird.vy = Math.min(
      bird.vy + GRAVITY * dt,
      MAX_FALL_SPEED
    );

    bird.y += bird.vy * dt;

    updatePipes(dt);
    updateCoins(dt);

    if (state === "playing") {
      checkCollisions();
    }
  }

  updateParticles(dt);
}

// ------------------------------------------------------
// RENDER
// ------------------------------------------------------

function render(dt) {
  ctx.clearRect(0, 0, W, H);

  drawBackground(dt);

  if (state === "playing" || state === "gameover") {
    pipes.forEach(drawPipe);
    coins.forEach(drawCoin);
  } else if (state === "ready" || state === "countdown") {
    drawPipe({
      x: W - 122,
      gapY: H * 0.45
    });

    drawCoin({
      x: W - 80,
      y: H * 0.45,
      r: COIN_R,
      collected: false,
      phase: 0
    });
  }

  drawGround();
  drawBird();
  drawParticles();
}

// ------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;

  // Clamp delta to prevent giant jumps after a tab is inactive.
  const dt = Math.min((timestamp - lastTime) / 1000, 1 / 30);
  lastTime = timestamp;

  update(dt);
  render(dt);

  requestAnimationFrame(gameLoop);
}

// ------------------------------------------------------
// INIT
// ------------------------------------------------------

function initializeGame() {
  canvas.width = W;
  canvas.height = H;

  handCanvas.width = 640;
  handCanvas.height = 480;

  initBackground();
  updateHUD();
  setTrackingStatus("Camera not started");

  requestAnimationFrame(gameLoop);

  console.log(
    "%c FLAPPYVISION — NEON ARCADE READY ",
    "background:#8f5bff;color:white;font-size:15px;font-weight:bold;padding:6px"
  );
}

initializeGame();
