/**
 * EMOTES.JS - Minecraft Player Emote Engine & Radial Wheel UI
 * Keyframe animations with smooth 200ms blending, matching synthesized SFX,
 * particle spawns, and dynamic expression triggers.
 */

import { character } from './character.js';
import { audio } from './audio.js';
import { particles } from './particles.js';
import { state } from './state.js';

class EmoteEngine {
  constructor() {
    this.currentEmote = null;
    this.animStartTime = 0;
    this.animDuration = 0;
    this.animFrameId = null;
    this.blending = false;

    // Emote catalog definition
    this.catalog = {
      wave: {
        id: 'wave',
        name: 'Wave',
        icon: '👋',
        duration: 2000,
        expression: 'happy',
        sfx: 'pop',
        particles: 'hearts',
        animate: (p) => {
          // Right arm raised, oscillates
          character.rightArmGroup.rotation.x = -Math.PI * 0.85;
          character.rightArmGroup.rotation.z = Math.sin(p * Math.PI * 8) * 0.4 - 0.3;
          character.leftArmGroup.rotation.z = 0.1;
          character.headGroup.rotation.z = Math.sin(p * Math.PI * 4) * 0.1;
        }
      },
      cheer: {
        id: 'cheer',
        name: 'Cheer',
        icon: '🎉',
        duration: 2200,
        expression: 'laugh',
        sfx: 'xp',
        particles: 'confetti',
        animate: (p) => {
          // Both arms up, rhythmic jump
          character.rightArmGroup.rotation.x = -Math.PI * 0.9 + Math.sin(p * Math.PI * 6) * 0.2;
          character.leftArmGroup.rotation.x = -Math.PI * 0.9 + Math.sin(p * Math.PI * 6) * 0.2;
          character.rightArmGroup.rotation.z = -0.3;
          character.leftArmGroup.rotation.z = 0.3;
          // Jump
          const jump = Math.abs(Math.sin(p * Math.PI * 6)) * 3;
          character.root.position.y = jump;
        }
      },
      disco: {
        id: 'disco',
        name: 'Disco',
        icon: '🕺',
        duration: 2600,
        expression: 'cool',
        sfx: 'xp',
        particles: 'notes',
        animate: (p) => {
          const beat = Math.sin(p * Math.PI * 8);
          character.rightArmGroup.rotation.x = beat > 0 ? -Math.PI * 0.8 : 0.2;
          character.leftArmGroup.rotation.x = beat <= 0 ? -Math.PI * 0.8 : 0.2;
          character.root.rotation.y = Math.sin(p * Math.PI * 4) * 0.4;
          character.bodyGroup.rotation.z = Math.sin(p * Math.PI * 8) * 0.15;
        }
      },
      bow: {
        id: 'bow',
        name: 'Bow',
        icon: '🙇',
        duration: 2200,
        expression: 'neutral',
        sfx: 'chest',
        particles: 'stars',
        animate: (p) => {
          // Torso pitches forward 60 deg, hold, return
          let pitch = 0;
          if (p < 0.3) {
            pitch = (p / 0.3) * (Math.PI / 3);
          } else if (p < 0.7) {
            pitch = Math.PI / 3;
          } else {
            pitch = (1 - (p - 0.7) / 0.3) * (Math.PI / 3);
          }
          character.bodyGroup.rotation.x = pitch;
          character.headGroup.rotation.x = pitch * 0.5;
          character.rightArmGroup.rotation.x = -pitch * 0.5;
          character.leftArmGroup.rotation.x = -pitch * 0.5;
        }
      },
      clap: {
        id: 'clap',
        name: 'Clap',
        icon: '👏',
        duration: 2000,
        expression: 'happy',
        sfx: 'clap',
        particles: 'stars',
        animate: (p) => {
          character.rightArmGroup.rotation.x = -Math.PI * 0.45;
          character.leftArmGroup.rotation.x = -Math.PI * 0.45;
          const clapCycle = Math.sin(p * Math.PI * 12);
          character.rightArmGroup.rotation.y = 0.4 + clapCycle * 0.25;
          character.leftArmGroup.rotation.y = -0.4 - clapCycle * 0.25;
        }
      },
      flip: {
        id: 'flip',
        name: 'Flip',
        icon: '🤸',
        duration: 1800,
        expression: 'surprised',
        sfx: 'whoosh',
        particles: 'stars',
        animate: (p) => {
          // Jump and 360 deg backflip
          const jumpY = Math.sin(p * Math.PI) * 8;
          character.root.position.y = jumpY;
          character.root.rotation.x = p * Math.PI * 2;
          // Tucked arms and legs during flip
          character.rightArmGroup.rotation.x = -Math.PI * 0.5;
          character.leftArmGroup.rotation.x = -Math.PI * 0.5;
          character.rightLegGroup.rotation.x = Math.PI * 0.3;
          character.leftLegGroup.rotation.x = Math.PI * 0.3;
        }
      },
      point: {
        id: 'point',
        name: 'Point',
        icon: '👉',
        duration: 1800,
        expression: 'cool',
        sfx: 'click',
        particles: 'stars',
        animate: (p) => {
          // Arm extends toward camera
          character.rightArmGroup.rotation.x = -Math.PI * 0.5;
          character.rightArmGroup.rotation.y = 0.2;
          character.headGroup.rotation.y = 0.15;
          character.leftArmGroup.rotation.x = 0.1;
        }
      },
      spin: {
        id: 'spin',
        name: 'Spin',
        icon: '🌪️',
        duration: 1800,
        expression: 'laugh',
        sfx: 'whoosh',
        particles: 'confetti',
        animate: (p) => {
          // Fast Y-rotation with ease-out
          const eased = Math.sin(p * Math.PI * 0.5);
          character.root.rotation.y = eased * Math.PI * 4;
          character.rightArmGroup.rotation.z = -0.5;
          character.leftArmGroup.rotation.z = 0.5;
        }
      },
      cool: {
        id: 'cool',
        name: 'Cool',
        icon: '😎',
        duration: 2400,
        expression: 'cool',
        sfx: 'pop',
        particles: 'stars',
        animate: (p) => {
          character.headGroup.rotation.z = 0.1;
          character.headGroup.rotation.x = -0.15;
          character.rightArmGroup.rotation.x = -Math.PI * 0.2;
          character.rightArmGroup.rotation.z = -0.15;
          character.leftArmGroup.rotation.x = -Math.PI * 0.2;
          character.leftArmGroup.rotation.z = 0.15;
        }
      },
      dance: {
        id: 'dance',
        name: 'Dance',
        icon: '💃',
        duration: 2500,
        expression: 'happy',
        sfx: 'xp',
        particles: 'notes',
        animate: (p) => {
          const groove = Math.sin(p * Math.PI * 10);
          character.rightArmGroup.rotation.z = -0.3 + groove * 0.3;
          character.leftArmGroup.rotation.z = 0.3 - groove * 0.3;
          character.rightLegGroup.rotation.z = groove * 0.1;
          character.leftLegGroup.rotation.z = -groove * 0.1;
          character.root.rotation.y = Math.sin(p * Math.PI * 5) * 0.3;
        }
      },
      think: {
        id: 'think',
        name: 'Think',
        icon: '🤔',
        duration: 2400,
        expression: 'neutral',
        sfx: 'click',
        particles: 'notes',
        animate: (p) => {
          // Hand to chin, head tilted
          character.headGroup.rotation.z = 0.2;
          character.headGroup.rotation.x = 0.15;
          character.rightArmGroup.rotation.x = -Math.PI * 0.65;
          character.rightArmGroup.rotation.y = -0.4;
          character.leftArmGroup.rotation.x = -0.1;
        }
      }
    };

    // Wheel paging
    this.wheelPage = 1;
    this.wheelSlotsPerPage = 8;
  }

  init() {
    this.setupWheelEvents();
  }

  play(emoteName) {
    const emote = this.catalog[emoteName];
    if (!emote) return;

    // Trigger unlocked achievement
    state.unlockAdvancement('adv-emote', 'Time to Strike a Pose!', 'Triggered a 3D player emote.', '🕺');

    // SFX
    if (emote.sfx === 'xp') audio.playXP();
    else if (emote.sfx === 'clap') audio.playClap();
    else if (emote.sfx === 'whoosh') audio.playWhoosh();
    else if (emote.sfx === 'chest') audio.playChest();
    else audio.playPop();

    // Expression
    character.setExpression(emote.expression);

    // Particles
    const rect = character.container ? character.container.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    particles.spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, emote.particles);

    // Cancel existing loop
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    this.currentEmote = emote;
    this.animStartTime = performance.now();
    this.animDuration = emote.duration;
    character.activeEmote = emote;

    this.loop();
  }

  loop() {
    if (!this.currentEmote) return;

    const elapsed = performance.now() - this.animStartTime;
    const progress = Math.min(1, elapsed / this.animDuration);

    this.currentEmote.animate(progress);

    if (progress < 1) {
      this.animFrameId = requestAnimationFrame(() => this.loop());
    } else {
      this.stop();
    }
  }

  stop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.currentEmote = null;
    character.activeEmote = null;

    // Smooth return to idle pose
    this.resetPose();
    character.setExpression('neutral');
  }

  resetPose() {
    if (!character.root) return;
    character.root.position.set(0, 0, 0);
    character.root.rotation.set(0, 0, 0);
    character.bodyGroup.position.set(0, 0, 0);
    character.bodyGroup.rotation.set(0, 0, 0);
    character.headGroup.rotation.set(0, 0, 0);
    character.rightArmGroup.rotation.set(0, 0, 0);
    character.leftArmGroup.rotation.set(0, 0, 0);
    character.rightLegGroup.rotation.set(0, 0, 0);
    character.leftLegGroup.rotation.set(0, 0, 0);
  }

  setupWheelEvents() {
    // Press 'B' to open/close emote wheel
    window.addEventListener('keydown', (e) => {
      if (e.key === 'b' || e.key === 'B') {
        // If not in input / textarea
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          this.toggleWheel();
        }
      }
    });
  }

  toggleWheel() {
    const dialog = document.getElementById('emote-wheel-dialog');
    if (!dialog) return;

    if (dialog.open) {
      dialog.close();
    } else {
      this.renderWheel();
      dialog.showModal();
      audio.playClick();
    }
  }

  renderWheel() {
    const container = document.getElementById('emote-wheel-slots');
    if (!container) return;

    container.innerHTML = '';
    const allEmotes = Object.values(this.catalog);
    const startIdx = (this.wheelPage - 1) * this.wheelSlotsPerPage;
    const currentList = allEmotes.slice(startIdx, startIdx + this.wheelSlotsPerPage);

    const radius = 135; // px from center
    const center = 210; // center offset in 420px container

    currentList.forEach((emote, i) => {
      const angle = (i / currentList.length) * Math.PI * 2 - Math.PI / 2;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;

      const slot = document.createElement('button');
      slot.className = 'wheel-slot';
      slot.style.left = `${x}px`;
      slot.style.top = `${y}px`;
      slot.setAttribute('aria-label', `Emote ${emote.name}`);
      slot.innerHTML = `
        <span class="wheel-slot-icon">${emote.icon}</span>
        <span class="wheel-slot-label">${emote.name}</span>
      `;

      slot.addEventListener('click', () => {
        const dialog = document.getElementById('emote-wheel-dialog');
        if (dialog) dialog.close();
        this.play(emote.id);
      });

      container.appendChild(slot);
    });
  }

  nextPage() {
    const totalPages = Math.ceil(Object.values(this.catalog).length / this.wheelSlotsPerPage);
    this.wheelPage = this.wheelPage >= totalPages ? 1 : this.wheelPage + 1;
    this.renderWheel();
    audio.playClick();
  }

  prevPage() {
    const totalPages = Math.ceil(Object.values(this.catalog).length / this.wheelSlotsPerPage);
    this.wheelPage = this.wheelPage <= 1 ? totalPages : this.wheelPage - 1;
    this.renderWheel();
    audio.playClick();
  }
}

export const emotes = new EmoteEngine();
