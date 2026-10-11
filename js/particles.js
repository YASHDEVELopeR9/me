/**
 * PARTICLES.JS - Cherry Blossom Petals & Emote Effects Engine
 * Renders falling cherry petals on canvas with dynamic density (0-100)
 * Spawns particle bursts (hearts, music notes, stars, confetti) for emotes.
 */

import { state } from './state.js';

class ParticleEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.petals = [];
    this.bursts = [];
    this.running = false;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  init(canvasId = 'petals-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Listen for density changes
    state.on('change:petalDensity', () => this.adjustPetalCount());

    this.adjustPetalCount();
    this.start();

    // Pause on tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  adjustPetalCount() {
    const density = state.get('petalDensity');
    // Map 0-100 density to 0 - 150 petals
    const targetCount = Math.floor((density / 100) * 120);

    while (this.petals.length < targetCount) {
      this.petals.push(this.createPetal(true));
    }
    while (this.petals.length > targetCount) {
      this.petals.pop();
    }
  }

  createPetal(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -20,
      size: Math.floor(Math.random() * 6) + 6, // 6 to 12 px
      speedY: Math.random() * 1.5 + 1.2,
      speedX: Math.random() * 1.2 - 0.2, // slight wind drift
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      flutterSpeed: Math.random() * 0.03 + 0.01,
      flutterOffset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? '#ffccd5' : '#ff758f'
    };
  }

  /**
   * Spawn Emote particle burst
   * @param {number} x Screen center X
   * @param {number} y Screen center Y
   * @param {'hearts' | 'notes' | 'stars' | 'confetti'} type 
   */
  spawnBurst(x, y, type = 'stars') {
    const count = type === 'confetti' ? 32 : 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.bursts.push({
        x: x || this.width / 2,
        y: y || this.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        type,
        size: Math.random() * 6 + 8,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        color: this.getRandomColor(type),
        char: this.getParticleChar(type)
      });
    }
  }

  getRandomColor(type) {
    if (type === 'hearts') return '#ff4d6d';
    if (type === 'notes') return ['#55ffff', '#ff55ff', '#ffff55', '#55ff55'][Math.floor(Math.random() * 4)];
    if (type === 'stars') return '#ffd166';
    return ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'][Math.floor(Math.random() * 5)];
  }

  getParticleChar(type) {
    if (type === 'hearts') return '❤';
    if (type === 'notes') return Math.random() > 0.5 ? '♪' : '♫';
    if (type === 'stars') return '✦';
    return null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    // Update petals
    const time = Date.now() * 0.001;
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(time * 2 + p.flutterOffset) * 0.8;
      p.angle += p.rotationSpeed;

      if (p.y > this.height + 20 || p.x > this.width + 20 || p.x < -20) {
        this.petals[i] = this.createPetal(false);
      }
    }

    // Update bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.12; // gravity
      b.alpha -= b.decay;

      if (b.alpha <= 0) {
        this.bursts.splice(i, 1);
      }
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw petals (pixelated blocks)
    for (let p of this.petals) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);
      this.ctx.fillStyle = p.color;
      // Draw pixel square petal
      const s = Math.round(p.size);
      this.ctx.fillRect(-s / 2, -s / 2, s, s);
      // Subtle petal shading
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fillRect(-s / 2, -s / 2, s / 2, s / 2);
      this.ctx.restore();
    }

    // Draw bursts
    for (let b of this.bursts) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, b.alpha);
      this.ctx.fillStyle = b.color;

      if (b.char) {
        this.ctx.font = `bold ${Math.round(b.size * 1.5)}px monospace`;
        this.ctx.fillText(b.char, b.x, b.y);
      } else {
        // Confetti square
        this.ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
      }
      this.ctx.restore();
    }
  }
}

export const particles = new ParticleEngine();
