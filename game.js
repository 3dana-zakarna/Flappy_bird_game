"use strict";

/* =====================================================
   FLAPPYVISION — MULTIVERSE ARCADE EDITION
   Hand tracking + 5 Worlds changing every 10 points + Magical FX
   ===================================================== */

const $ = (id) => document.getElementById(id);

const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");

const video = $("camera-video");
const handCanvas = $("hand-canvas");
const handCtx = handCanvas.getContext("2d");

const startScreen = $("start-screen");
const selectBirdScreen = $("select-bird-screen");
const gameScreen = $("game-screen");

const startBtn = $("start-btn");
const selectBirdMenuBtn = $("select-bird-menu-btn");
const birdSelectBackBtn = $("bird-select-back-btn");
const birdSelectNextBtn = $("bird-select-next-btn");
const playBtn = $("play-btn");
const restartBtn = $("restart-btn");
const homeBtn = $("home-btn");
const gameoverHomeBtn = $("gameover-home-btn");
const brandHome = $("brand-home");

const birdGrid = $("bird-grid");
const currentWorldBadge = $("current-world-badge");

const readyOverlay = $("ready-overlay");
const gameoverOverlay = $("gameover-overlay");
const countdownElement = $("countdown");

const scoreElement = $("score");
const bestScoreElement = $("best-score");
const coinCountElement = $("coin-count");

const goalTargetText = $("goal-target-text");
const goalProgressFill = $("goal-progress-fill");
const goalHint = $("goal-hint");

const giftRewardBox = $("gift-reward-box");
const giftEncouragement = $("gift-encouragement");
const giftTitleText = $("gift-title-text");
const giftDescText = $("gift-desc-text");
const standardHeader = $("gameover-standard-header");

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
const milestoneBanner = $("milestone-banner");

// -----------------------------------------------------
// BIRD SELECTION DEFINITIONS
// -----------------------------------------------------

const BIRD_TYPES = [
  { id: "yellow", name: "Classic Yellow", body: ["#FFFBC5", "#FFDC68", "#FF9C45"], wing: "#F8A53E", eye: "#201438", type: "bird" },
  { id: "green", name: "Neon Green", body: ["#C5FFD0", "#68FF85", "#22D448"], wing: "#1DB33B", eye: "#0D3313", type: "bird" },
  { id: "red", name: "Crimson Phoenix", body: ["#FFC5C5", "#FF6868", "#E62222"], wing: "#B31D1D", eye: "#380000", type: "bird" },
  { id: "blue", name: "Cosmic Blue", body: ["#C5F3FF", "#68D8FF", "#228BE6"], wing: "#1D6FB3", eye: "#001D38", type: "bird" },
  { id: "pink", name: "Cyber Pink", body: ["#FFC5FA", "#FF68EE", "#E622C5"], wing: "#B31D9B", eye: "#380030", type: "bird" },
  { id: "rocket", name: "Turbo Rocket", body: ["#FFFFFF", "#D6D6D6", "#FF3B3B"], wing: "#FF9800", eye: "#00E5FF", type: "rocket" },
  { id: "butterfly", name: "Neon Butterfly", body: ["#EBB8FF", "#B052FF", "#7814E6"], wing: "#FF66EB", eye: "#FFFFFF", type: "butterfly" },
  { id: "pixel", name: "Classic Flappy", body: ["#FFE156", "#F39C12", "#D35400"], wing: "#E67E22", eye: "#2C3E50", type: "pixel" }
];

let selectedBirdIndex = loadNumber("flappyvision-selected-bird") || 0;

// -----------------------------------------------------
// THE 5 MULTIVERSE WORLDS (CHANGES EVERY 10 POINTS)
// -----------------------------------------------------

const WORLDS = [
  {
    minScore: 0,
    name: "GALAXY WORLD 🌌",
    bg1: "#10082F", bg2: "#28205F", bg3: "#101C4B",
    glow: "#5EEFFF25", celestial: "#C4F8FF",
    pipe1: "#3A1B8D", pipe2: "#A47AFF", pipe3: "#7446D6", pipe4: "#32146E",
    pipeShadow: "#9B60FF"
  },
  {
    minScore: 10,
    name: "CRYSTAL WORLD 💎",
    bg1: "#061A2E", bg2: "#154775", bg3: "#0B2545",
    glow: "#63F5FF35", celestial: "#63F5FF",
    pipe1: "#0E5A8A", pipe2: "#63F5FF", pipe3: "#32B9E7", pipe4: "#073252",
    pipeShadow: "#63F5FF"
  },
  {
    minScore: 20,
    name: "CANDY WORLD 🍬",
    bg1: "#2E0822", bg2: "#6F2055", bg3: "#450B33",
    glow: "#FF72DC35", celestial: "#FF72DC",
    pipe1: "#8D1B6F", pipe2: "#FF72DC", pipe3: "#E732B0", pipe4: "#52073B",
    pipeShadow: "#FF72DC"
  },
  {
    minScore: 30,
    name: "CYBER CITY 🌆",
    bg1: "#05091E", bg2: "#182658", bg3: "#0B1333",
    glow: "#00FFEE35", celestial: "#00FFEE",
    pipe1: "#153075", pipe2: "#00FFEE", pipe3: "#0099FF", pipe4: "#07122E",
    pipeShadow: "#00FFEE"
  },
  {
    minScore: 40,
    name: "DREAM KINGDOM 👑",
    bg1: "#22082E", bg2: "#55206F", bg3: "#330B45",
    glow: "#FFDC7235", celestial: "#FFDC72",
    pipe1: "#6F1B8D", pipe2: "#FFDC72", pipe3: "#E7B932", pipe4: "#3B0752",
    pipeShadow: "#FFDC72"
  }
];

function getCurrentWorld(currentScore) {
  let world = WORLDS[0];
  for (const w of WORLDS) {
    if (currentScore >= w.minScore) {
      world = w;
    }
  }
  return world;
}

// -----------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------

const W = 900;
const H = 720;
const GROUND = 90;

const BIRD_X = 220;
const BIRD_R = 17;

const GRAVITY = 1650;
const FLAP_VELOCITY = -480;
const MAX_FALL_SPEED = 680;

const PIPE_W = 84;
const PIPE_GAP = 205;
const PIPE_SPEED = 275;
const PIPE_INTERVAL = 1.55;

const COIN_R = 13;
const COIN_VALUE = 1;

const PINCH_ON = 0.050;
const PINCH_OFF = 0.078;
const FLAP_COOLDOWN = 200;

const GIFT_TIERS = [
  { points: 10, title: "NICE TRY! 🎁", icon: "🎁", desc: "You unlocked the Bronze Gift Reward!" },
  { points: 20, title: "AMAZING! 🌟", icon: "🌟", desc: "You reached 20 points and unlocked the Silver Gift!" },
  { points: 30, title: "FANTASTIC! 🏆", icon: "🏆", desc: "Awesome skills! The Gold Gift Reward is yours!" },
  { points: 50, title: "LEGENDARY! 👑", icon: "👑", desc: "UNBELIEVABLE! You earned the Legendary Gift Reward!" }
];

const COLORS = {
  cyan: "#63F5FF",
  purple: "#AD83FF",
  pink: "#FF72DC",
  gold: "#FFDC72",
  white: "#FFFFFF"
};

// -----------------------------------------------------
// STATE
// -----------------------------------------------------

let state = "menu";
let score = 0;
let coinsCollected = 0;
let lastWorldIndex = 0;

let bestScore = loadNumber("flappyvision-best");
let bestCoins = loadNumber("flappyvision-coins");
let highestGiftTierEarned = loadNumber("flappyvision-gift-tier");

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
let lastTime = null;
let lastFlapTime = 0;
let countdownId = 0;
let floatingScoreTimer = 0;

let hands = null;
let camera = null;
let cameraStarted = false;
let cameraStarting = false;
let isProcessingFrame = false;
let frameCounter = 0;

let handDetected = false;
let wasPinching = false;
let pinchLocked = false;

let soundEnabled = true;
let audioContext = null;
let toastTimer = null;

// -----------------------------------------------------
// STORAGE AND HUD
// -----------------------------------------------------

function loadNumber(key) {
  try {
    return Math.max(0, Number(localStorage.getItem(key)) || 0);
  } catch {
    return 0;
  }
}

function storeNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

function getNextGoalTier(currentScore) {
  for (const tier of GIFT_TIERS) {
    if (currentScore < tier.points) return tier;
  }
  return null;
}

function updateHUD() {
  scoreElement.textContent = score;
  bestScoreElement.textContent = bestScore;
  coinCountElement.textContent = coinsCollected;

  finalScoreElement.textContent = score;
  finalBestElement.textContent = bestScore;
  finalCoinsElement.textContent = coinsCollected;

  const currentWorld = getCurrentWorld(score);
  currentWorldBadge.textContent = currentWorld.name;

  const nextTier = getNextGoalTier(score);
  if (nextTier) {
    goalTargetText.textContent = `${score} / ${nextTier.points}`;
    const percent = Math.min(100, Math.floor((score / nextTier.points) * 100));
    goalProgressFill.style.width = `${percent}%`;
    const needed = nextTier.points - score;
    goalHint.textContent = `${needed} more point${needed > 1 ? 's' : ''} to unlock!`;
  } else {
    goalTargetText.textContent = `${score} / MAX 👑`;
    goalProgressFill.style.width = "100%";
    goalHint.textContent = "ALL GIFT TIERS UNLOCKED!";
  }
}

// -----------------------------------------------------
// WORLD TRANSITION WITH SLIM BANNER & MAGICAL SOUND FX
// -----------------------------------------------------

function checkWorldTransition() {
  const currentWorld = getCurrentWorld(score);
  const worldIndex = WORLDS.indexOf(currentWorld);

  if (worldIndex > lastWorldIndex) {
    lastWorldIndex = worldIndex;
    triggerWorldTransitionCelebration(currentWorld.name);
  }
}

function triggerWorldTransitionCelebration(worldName) {
  const announcement = `✨ WELCOME TO ${worldName} ✨`;

  milestoneBanner.textContent = announcement;
  milestoneBanner.classList.remove("hidden", "animate");
  void milestoneBanner.offsetWidth;
  milestoneBanner.classList.add("animate");

  soundWorldTransitionEffect();

  createBurst(
    W / 2,
    H / 2,
    [COLORS.pink, COLORS.cyan, COLORS.gold, "#FFFFFF"],
    30
  );
}

function soundWorldTransitionEffect() {
  if (!soundEnabled) return;
  tone(587.33, 0.08, "sine", 0.05, 880);
  setTimeout(() => tone(880, 0.12, "triangle", 0.05, 1174.66), 80);
  setTimeout(() => tone(1174.66, 0.25, "sine", 0.06, 1760), 160);
}

// -----------------------------------------------------
// BIRD RENDERING & SELECTION UI
// -----------------------------------------------------

function buildBirdGrid() {
  birdGrid.innerHTML = "";

  BIRD_TYPES.forEach((bSpec, index) => {
    const card = document.createElement("div");
    card.className = `bird-card ${index === selectedBirdIndex ? "active" : ""}`;
    card.dataset.index = index;

    const canvasPre = document.createElement("canvas");
    canvasPre.width = 50;
    canvasPre.height = 50;
    canvasPre.className = "bird-preview-canvas";

    renderBirdPreviewOnCanvas(canvasPre, bSpec);

    const label = document.createElement("span");
    label.className = "bird-card-name";
    label.textContent = bSpec.name;

    card.appendChild(canvasPre);
    card.appendChild(label);

    card.addEventListener("click", () => {
      selectedBirdIndex = index;
      storeNumber("flappyvision-selected-bird", selectedBirdIndex);
      soundScore();

      document.querySelectorAll(".bird-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
    });

    birdGrid.appendChild(card);
  });
}

function renderBirdPreviewOnCanvas(cElem, bSpec) {
  const pCtx = cElem.getContext("2d");
  pCtx.clearRect(0, 0, 50, 50);

  pCtx.save();
  pCtx.translate(25, 25);
  drawCustomBirdShape(pCtx, bSpec, 0, 0);
  pCtx.restore();
}

// -----------------------------------------------------
// AUDIO
// -----------------------------------------------------

function initAudio() {
  if (!soundEnabled) return;

  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    if (!audioContext) audioContext = new AudioCtor();

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  } catch (error) {
    console.warn("Audio unavailable:", error);
  }
}

function tone(frequency, duration = 0.12, type = "sine", volume = 0.045, endFrequency = null) {
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
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (error) {
    console.warn("Sound failed:", error);
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

function soundGiftUnlock() {
  if (!soundEnabled) return;
  tone(523.25, 0.1, "sine", 0.06, 659.25);
  setTimeout(() => tone(659.25, 0.12, "sine", 0.06, 783.99), 90);
  setTimeout(() => tone(783.99, 0.15, "sine", 0.07, 1046.50), 190);
  setTimeout(() => tone(1046.50, 0.35, "triangle", 0.08, 1318.51), 320);
}

// -----------------------------------------------------
// MESSAGES
// -----------------------------------------------------

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

// -----------------------------------------------------
// BACKGROUND & WORLDS RENDERING
// -----------------------------------------------------

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
  const currentWorld = getCurrentWorld(score);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, currentWorld.bg1);
  bg.addColorStop(0.52, currentWorld.bg2);
  bg.addColorStop(1, currentWorld.bg3);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(700, 135, 5, 700, 135, 220);
  glow.addColorStop(0, currentWorld.glow);
  glow.addColorStop(1, "transparent");

  ctx.fillStyle = glow;
  ctx.fillRect(460, 0, 440, 360);

  ctx.save();
  ctx.shadowColor = currentWorld.celestial;
  ctx.shadowBlur = 25;
  ctx.fillStyle = currentWorld.celestial;

  ctx.beginPath();
  ctx.arc(730, 115, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const star of stars) {
    const alpha = 0.24 + 0.66 * (0.5 + 0.5 * Math.sin(elapsed * 1.6 + star.phase));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFFFFF";

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

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

  drawHills(H - GROUND - 74, "#2A204D", 0.9);
  drawHills(H - GROUND - 37, "#1D163A", 1.35);
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
    const y = baseY + Math.sin(x * 0.008 * factor + 1) * 19 + Math.sin(x * 0.017 * factor) * 10;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// -----------------------------------------------------
// GROUND
// -----------------------------------------------------

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

  const offset = (elapsed * 85) % 46;

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

// -----------------------------------------------------
// BIRD & CHARACTER DRAWING
// -----------------------------------------------------

function drawCustomBirdShape(context, bSpec, x, y) {
  context.save();

  if (bSpec.type === "rocket") {
    context.fillStyle = bSpec.body[2];
    context.beginPath();
    context.moveTo(18, 0);
    context.lineTo(-12, -12);
    context.lineTo(-8, 0);
    context.lineTo(-12, 12);
    context.closePath();
    context.fill();

    context.fillStyle = bSpec.body[0];
    context.beginPath();
    context.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = bSpec.eye;
    context.beginPath();
    context.arc(5, -2, 4, 0, Math.PI * 2);
    context.fill();
  } else if (bSpec.type === "butterfly") {
    context.fillStyle = bSpec.wing;
    context.beginPath();
    context.ellipse(-4, -10, 12, 8, -0.4, 0, Math.PI * 2);
    context.ellipse(-4, 10, 10, 6, 0.4, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = bSpec.body[1];
    context.beginPath();
    context.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = bSpec.eye;
    context.beginPath();
    context.arc(6, -2, 2.5, 0, Math.PI * 2);
    context.fill();
  } else {
    context.save();
    context.shadowColor = bSpec.body[1];
    context.shadowBlur = 12;

    const bodyGrad = context.createLinearGradient(-18, -18, 20, 20);
    bodyGrad.addColorStop(0, bSpec.body[0]);
    bodyGrad.addColorStop(0.5, bSpec.body[1]);
    bodyGrad.addColorStop(1, bSpec.body[2]);

    context.fillStyle = bodyGrad;
    context.beginPath();
    context.ellipse(0, 0, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const wingMove = Math.sin(elapsed * (state === "playing" ? 20 : 4)) * 4;

    context.fillStyle = bSpec.wing;
    context.beginPath();
    context.ellipse(-7, 5 + wingMove, 10, 6.5, -0.3, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#FFFFFF";
    context.beginPath();
    context.ellipse(8, -7, 6.5, 8, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = bSpec.eye;
    context.beginPath();
    context.arc(10.5, -6, 3.4, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#FFFFFF";
    context.beginPath();
    context.arc(11.5, -7.2, 1.1, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#FF795D";
    context.beginPath();
    context.moveTo(16, 0);
    context.lineTo(29, 4);
    context.lineTo(16, 9);
    context.closePath();
    context.fill();
  }

  context.restore();
}

function drawBird() {
  const floating = state === "menu" || state === "ready" || state === "countdown";
  const y = floating ? H * 0.43 + Math.sin(elapsed * 2.4) * 9 : bird.y;

  ctx.save();
  ctx.translate(BIRD_X, y);

  const rotation = state === "playing"
    ? Math.max(-0.48, Math.min(0.9, bird.vy / 620))
    : Math.sin(elapsed * 1.7) * 0.035;

  ctx.rotate(rotation);

  const currentSpec = BIRD_TYPES[selectedBirdIndex] || BIRD_TYPES[0];
  drawCustomBirdShape(ctx, currentSpec, 0, 0);

  ctx.restore();
}

// -----------------------------------------------------
// PIPES (WORLD-THEMED OBSTACLES)
// -----------------------------------------------------

function createPipe() {
  const minCenter = 140 + PIPE_GAP / 2;
  const maxCenter = H - GROUND - 105 - PIPE_GAP / 2;

  const gapY = minCenter + Math.random() * (maxCenter - minCenter);

  pipes.push({
    x: W + 24,
    gapY,
    passed: false
  });

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

  const world = getCurrentWorld(score);

  const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
  grad.addColorStop(0, world.pipe1);
  grad.addColorStop(0.25, world.pipe2);
  grad.addColorStop(0.52, world.pipe3);
  grad.addColorStop(1, world.pipe4);

  ctx.save();
  ctx.shadowColor = world.pipeShadow;
  ctx.shadowBlur = 13;
  ctx.fillStyle = grad;

  ctx.fillRect(pipe.x, 0, PIPE_W, Math.max(0, gapTop));
  ctx.fillRect(pipe.x, gapBottom, PIPE_W, Math.max(0, groundY - gapBottom));

  ctx.restore();

  ctx.save();
  ctx.shadowColor = world.pipe2;
  ctx.shadowBlur = 12;
  ctx.fillStyle = world.pipe2;

  ctx.fillRect(pipe.x - 6, gapTop - 23, PIPE_W + 12, 23);
  ctx.fillRect(pipe.x - 6, gapBottom, PIPE_W + 12, 23);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFFFFF";
  ctx.globalAlpha = 0.28;

  ctx.fillRect(pipe.x + 11, 0, 4, Math.max(0, gapTop - 23));
  ctx.fillRect(pipe.x + 11, gapBottom + 23, 4, Math.max(0, groundY - gapBottom - 23));

  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "#D9F9FF";
  ctx.lineWidth = 1.5;

  ctx.strokeRect(pipe.x + 6, gapTop - 17, PIPE_W - 12, 10);
  ctx.strokeRect(pipe.x + 6, gapBottom + 6, PIPE_W - 12, 10);

  ctx.restore();
}

// -----------------------------------------------------
// COINS
// -----------------------------------------------------

function drawCoin(coin) {
  if (coin.collected) return;

  const y = coin.y + Math.sin(elapsed * 4 + coin.phase) * 4;
  const spin = Math.abs(Math.cos(elapsed * 4 + coin.phase));

  ctx.save();
  ctx.translate(coin.x, y);

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
  score += 1;

  if (score > bestScore) {
    bestScore = score;
    storeNumber("flappyvision-best", bestScore);
  }

  storeNumber("flappyvision-coins", loadNumber("flappyvision-coins") + coin.value);

  createBurst(coin.x, coin.y, [COLORS.gold, "#FFF9C9", "#FFAA3B", COLORS.cyan], 22);
  showFloatingScore("+1 COIN", coin.x, coin.y);

  checkWorldTransition();
  soundCoin();
  updateHUD();
}

function updateCoins(dt) {
  for (const coin of coins) {
    coin.x -= currentPipeSpeed() * dt;
    if (coin.collected) continue;

    const coinY = coin.y + Math.sin(elapsed * 4 + coin.phase) * 4;
    const dx = BIRD_X - coin.x;
    const dy = bird.y - coinY;

    if (Math.hypot(dx, dy) < BIRD_R + coin.r + 5) {
      collectCoin(coin);
    }
  }

  coins = coins.filter(coin => !coin.collected && coin.x > -35);
}

// -----------------------------------------------------
// DIFFICULTY AND PIPES
// -----------------------------------------------------

function currentPipeSpeed() {
  return Math.min(PIPE_SPEED + score * 1.35, 340);
}

function updatePipes(dt) {
  pipeTimer += dt;

  while (pipeTimer >= PIPE_INTERVAL) {
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

      createBurst(BIRD_X, bird.y, ["#FFFFFF", COLORS.cyan, COLORS.purple], 10);
      showFloatingScore("+1", BIRD_X, bird.y - 20);

      checkWorldTransition();
      soundScore();
      updateHUD();
    }
  }

  pipes = pipes.filter(pipe => pipe.x + PIPE_W + 30 > 0);
}

// -----------------------------------------------------
// COLLISIONS
// -----------------------------------------------------

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

    const hitTop = circleRectCollision(BIRD_X, bird.y, r, pipe.x, 0, PIPE_W, top);
    const hitBottom = circleRectCollision(BIRD_X, bird.y, r, pipe.x, bottom, PIPE_W, groundY - bottom);

    if (hitTop || hitBottom) {
      endGame();
      return;
    }
  }
}

// -----------------------------------------------------
// PARTICLES
// -----------------------------------------------------

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
  createBurst(BIRD_X - 15, bird.y + 3, ["#FFFFFF", "#BDFBFF", COLORS.cyan, COLORS.gold], 7);
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

  floatingScore.style.animation = "none";
  void floatingScore.offsetWidth;
  floatingScore.style.animation = "";

  floatingScoreTimer = 0.85;
}

// -----------------------------------------------------
// FLAP
// -----------------------------------------------------

function flap() {
  if (state !== "playing") return;

  const now = performance.now();
  if (now - lastFlapTime < FLAP_COOLDOWN) return;

  lastFlapTime = now;
  bird.vy = FLAP_VELOCITY;

  createFlapParticles();
  soundFlap();
}

// -----------------------------------------------------
// CONTROLS
// -----------------------------------------------------

document.addEventListener("keydown", event => {
  if (event.code !== "Space" || event.repeat) return;
  if (state === "playing" || state === "ready" || state === "countdown") {
    event.preventDefault();
    initAudio();
    if (state === "ready") startCountdown();
    else if (state === "playing") flap();
  }
});

canvas.addEventListener("pointerdown", () => {
  initAudio();
  if (state === "ready") startCountdown();
  else if (state === "playing") flap();
});

// -----------------------------------------------------
// HAND TRACKING & CAMERA
// -----------------------------------------------------

function setTrackingStatus(message, mode = "idle") {
  trackingText.textContent = message;
  trackingDot.classList.remove("active", "error");
  if (mode === "active") trackingDot.classList.add("active");
  else if (mode === "error") trackingDot.classList.add("error");
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
    handCtx.arc(p.x * width, p.y * height, index === 4 || index === 8 ? 5 : 2.4, 0, Math.PI * 2);
    handCtx.fillStyle = index === 4 || index === 8 ? COLORS.pink : "#FFFFFF";
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
    if (cameraStarted) setTrackingStatus("Show your hand to the camera");
    return;
  }

  const hand = landmarks[0];
  const thumb = hand[4];
  const index = hand[8];
  const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);

  const pinching = pinchLocked ? distance < PINCH_OFF : distance < PINCH_ON;

  if (pinching && !wasPinching) {
    if (state === "ready") startCountdown();
    else if (state === "playing") flap();
  }

  pinchLocked = pinching;
  wasPinching = pinching;

  setTrackingStatus(state === "playing" ? (pinching ? "Pinch detected — FLAP!" : "Hand detected — ready") : "Hand tracking active", "active");
}

async function initializeCamera() {
  if (cameraStarted) return true;
  if (cameraStarting) return false;

  if (typeof Hands === "undefined" || typeof Camera === "undefined") {
    setTrackingStatus("MediaPipe failed to load", "error");
    showMessage("MediaPipe failed to load. Check your internet connection.", true);
    return false;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setTrackingStatus("Camera API unavailable", "error");
    return false;
  }

  cameraStarting = true;
  startBtn.disabled = true;

  try {
    hands = new Hands({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });

    hands.onResults(results => {
      handleHandResults(results);
      isProcessingFrame = false;
    });

    camera = new Camera(video, {
      onFrame: async () => {
        if (hands && video.readyState >= 2 && !isProcessingFrame) {
          frameCounter++;
          if (frameCounter % 2 === 0) {
            isProcessingFrame = true;
            try { await hands.send({ image: video }); }
            catch (e) { isProcessingFrame = false; }
          }
        }
      },
      width: 320,
      height: 240
    });

    await camera.start();
    cameraStarted = true;
    cameraPlaceholder.classList.add("hidden");
    handCanvas.width = 320;
    handCanvas.height = 240;
    setTrackingStatus("Camera active — show your hand", "active");
    return true;
  } catch (error) {
    setTrackingStatus("Camera unavailable — use SPACE", "error");
    return false;
  } finally {
    cameraStarting = false;
    startBtn.disabled = false;
  }
}

// -----------------------------------------------------
// SCREENS AND GAME FLOW
// -----------------------------------------------------

async function showGameScreen() {
  initAudio();
  startScreen.classList.add("hidden");
  selectBirdScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  resetGame();
  await initializeCamera();
}

function showSelectBirdScreen() {
  initAudio();
  startScreen.classList.add("hidden");
  selectBirdScreen.classList.remove("hidden");
  buildBirdGrid();
}

function resetGame() {
  countdownId++;
  state = "ready";
  score = 0;
  coinsCollected = 0;
  lastWorldIndex = 0;

  bird.y = H * 0.43;
  bird.vy = 0;
  bird.rotation = 0;

  pipes = [];
  coins = [];
  particles = [];

  pipeTimer = 0;
  lastFlapTime = 0;
  lastTime = null;

  wasPinching = false;
  pinchLocked = false;

  readyOverlay.classList.remove("hidden");
  gameoverOverlay.classList.add("hidden");
  countdownElement.classList.add("hidden");
  floatingScore.classList.add("hidden");
  milestoneBanner.classList.add("hidden");

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
      bird.vy = -110;
      lastTime = null;
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

  bestCoins = Math.max(bestCoins, loadNumber("flappyvision-coins"));

  let highestUnlockedInRun = null;
  for (const tier of GIFT_TIERS) {
    if (score >= tier.points) highestUnlockedInRun = tier;
  }

  if (highestUnlockedInRun) {
    if (highestUnlockedInRun.points > highestGiftTierEarned) {
      highestGiftTierEarned = highestUnlockedInRun.points;
      storeNumber("flappyvision-gift-tier", highestGiftTierEarned);
    }

    giftEncouragement.textContent = "GREAT JOB!";

    const iconElement = giftRewardBox.querySelector('.gift-box-icon');
    if (iconElement) iconElement.textContent = highestUnlockedInRun.icon;

    giftTitleText.textContent = highestUnlockedInRun.title;
    giftDescText.textContent = `You scored ${score} points! ${highestUnlockedInRun.desc}`;

    giftRewardBox.classList.remove("hidden");
    standardHeader.classList.add("hidden");

    setTimeout(() => { soundGiftUnlock(); }, 250);
  } else {
    giftRewardBox.classList.add("hidden");
    standardHeader.classList.remove("hidden");
    bestScoreText.textContent = newRecord ? "✦ NEW PERSONAL BEST! ✦" : "One more flight. One more chance.";
  }

  updateHUD();
  gameoverOverlay.classList.remove("hidden");
  createBurst(BIRD_X, bird.y, [COLORS.pink, COLORS.purple, COLORS.cyan, "#FFFFFF"], 28);
  soundCrash();
}

function returnHome() {
  countdownId++;
  state = "menu";
  gameScreen.classList.add("hidden");
  selectBirdScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  countdownElement.classList.add("hidden");
  wasPinching = false;
  pinchLocked = false;
  lastTime = null;
}

// -----------------------------------------------------
// LISTENERS
// -----------------------------------------------------

startBtn.addEventListener("click", showGameScreen);
selectBirdMenuBtn.addEventListener("click", showSelectBirdScreen);
birdSelectBackBtn.addEventListener("click", returnHome);
birdSelectNextBtn.addEventListener("click", showGameScreen);
playBtn.addEventListener("click", startCountdown);
restartBtn.addEventListener("click", () => { resetGame(); startCountdown(); });
homeBtn.addEventListener("click", returnHome);
gameoverHomeBtn.addEventListener("click", returnHome);
brandHome.addEventListener("click", event => { event.preventDefault(); returnHome(); });

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? "♫" : "♪";
  soundBtn.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) {
    initAudio();
    tone(700, 0.1, "sine", 0.035, 950);
  }
});

// -----------------------------------------------------
// UPDATE & RENDER LOOPS
// -----------------------------------------------------

function update(dt) {
  elapsed += dt;

  if (floatingScoreTimer > 0) {
    floatingScoreTimer -= dt;
    if (floatingScoreTimer <= 0) floatingScore.classList.add("hidden");
  }

  if (state === "playing") {
    bird.vy = Math.min(bird.vy + GRAVITY * dt, MAX_FALL_SPEED);
    bird.y += bird.vy * dt;

    updatePipes(dt);
    updateCoins(dt);

    if (state === "playing") checkCollisions();
  }

  updateParticles(dt);
}

function render(dt) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(dt);

  if (state === "playing" || state === "gameover") {
    pipes.forEach(drawPipe);
    coins.forEach(drawCoin);
  } else if (state === "ready" || state === "countdown") {
    drawPipe({ x: W - 122, gapY: H * 0.45 });
    drawCoin({ x: W - 80, y: H * 0.45, r: COIN_R, collected: false, phase: 0 });
  }

  drawGround();
  drawBird();
  drawParticles();
}

let accumulatedTime = 0;
const FIXED_DT = 1 / 60;

function gameLoop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const frameDelta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  accumulatedTime += Math.min(frameDelta, 0.1);

  while (accumulatedTime >= FIXED_DT) {
    update(FIXED_DT);
    accumulatedTime -= FIXED_DT;
  }

  render(frameDelta);
  requestAnimationFrame(gameLoop);
}

function initializeGame() {
  canvas.width = W;
  canvas.height = H;
  handCanvas.width = 320;
  handCanvas.height = 240;

  initBackground();
  updateHUD();
  setTrackingStatus("Camera not started");
  requestAnimationFrame(gameLoop);
}

initializeGame();