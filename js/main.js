/**
 * MAIN.JS - App Bootstrap & Lifecycle Orchestrator
 * Loads profile.json, executes blocky loading bar, initializes Three.js character,
 * binds section scroll observers, and wires Standard Galactic Alphabet rune translations.
 */

import { state } from './state.js';
import { audio } from './audio.js';
import { particles } from './particles.js';
import { character } from './character.js';
import { emotes } from './emotes.js';
import { hud } from './hud.js';
import { modals } from './modals.js';

class App {
  async init() {
    this.setupAudioWakeup();

    // Direct click-to-dismiss on loader
    const loader = document.getElementById('realm-loader');
    if (loader) {
      loader.addEventListener('click', () => this.hideLoader());
    }

    // Safety timeout: Guarantee loader dismisses even if anything hangs
    setTimeout(() => this.hideLoader(), 2500);

    try {
      // Parallelize data fetch and loader sequence
      const dataPromise = this.loadData();
      const loaderPromise = this.runLoader();

      await dataPromise;
      this.initComponents();
      this.setupScrollObserver();
      this.setupCharacterBar();
      this.setupRunicHover();

      await loaderPromise;
    } catch (err) {
      console.error('[App] Init encountered error:', err);
    } finally {
      this.hideLoader();
    }
  }

  setupAudioWakeup() {
    const unlock = () => {
      audio.ensureContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  async loadData() {
    try {
      const res = await fetch('data/profile.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.set('profileData', data);
    } catch (err) {
      console.warn('[App] Failed to load data/profile.json, using fallback', err);
    }
  }

  async runLoader() {
    const barFill = document.getElementById('loader-bar-fill');
    const statusText = document.getElementById('loader-status');

    const stages = [
      { progress: 25, text: 'GENERATING CHERRY CANOPY...' },
      { progress: 50, text: 'SYNTHESIZING WEB AUDIO FREQUENCIES...' },
      { progress: 75, text: 'SUMMONING 3D VOXEL AVATAR...' },
      { progress: 100, text: 'REALM READY! SPAWNING CRAFTER...' }
    ];

    for (const stage of stages) {
      if (barFill) barFill.style.width = `${stage.progress}%`;
      if (statusText) statusText.textContent = stage.text;
      await new Promise(r => setTimeout(r, 120));
    }

    await new Promise(r => setTimeout(r, 150));
    this.hideLoader();
  }

  hideLoader() {
    const loader = document.getElementById('realm-loader');
    if (loader && !loader.classList.contains('hidden')) {
      const barFill = document.getElementById('loader-bar-fill');
      if (barFill) barFill.style.width = '100%';
      const statusText = document.getElementById('loader-status');
      if (statusText) statusText.textContent = 'REALM READY! SPAWNING CRAFTER...';
      loader.classList.add('hidden');
      try {
        audio.playXP();
      } catch (e) {}
    }
  }

  initComponents() {
    // 1. Initial theme setup
    document.documentElement.setAttribute('data-theme', state.get('theme'));
    document.documentElement.setAttribute('data-scanlines', state.get('scanlines') ? 'true' : 'false');

    // 2. Petals engine
    particles.init('petals-canvas');

    // 3. Three.js character
    if (state.get('threeDEnabled')) {
      character.init('character-container', 'character-canvas');
      character.setColor(state.get('characterColor'));
    }

    // 4. Emotes & Wheel
    emotes.init();

    // 5. HUD & Hotbar
    hud.init();

    // 6. Modals & Forms
    modals.init();
  }

  setupScrollObserver() {
    const sections = document.querySelectorAll('section[id]');
    const sectionToSlotMap = {
      hero: 1,
      profile: 2,
      skills: 3,
      projects: 4,
      credentials: 5,
      trades: 7,
      contact: 8
    };

    const sectionAdvancements = {
      hero: { id: 'adv-root', title: 'Taking Inventory', desc: 'Spawned into the Cherry Grove Realm.', icon: '🌸' },
      profile: { id: 'adv-profile', title: 'Know Your Crafter', desc: 'Inspected player stats and credentials.', icon: '👤' },
      skills: { id: 'adv-skills', title: 'Enchanter', desc: 'Decoded runic enchantments.', icon: '✨' },
      projects: { id: 'adv-projects', title: 'Acquire Hardware', desc: 'Inspected the Ender Chest project inventory.', icon: '💎' },
      trades: { id: 'adv-trades', title: 'What a Deal!', desc: 'Consulted the Village Merchant.', icon: '🟢' },
      contact: { id: 'adv-contact', title: 'Signed & Sealed', desc: 'Readied parchment and ink.', icon: '🪶' }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const slot = sectionToSlotMap[id];
          if (slot && !document.querySelector('dialog[open]')) {
            // Update active hotbar slot
            const slots = document.querySelectorAll('.hotbar-slot');
            slots.forEach(s => s.classList.toggle('active', parseInt(s.dataset.slot, 10) === slot));
            state.set('currentSlot', slot);
          }

          const adv = sectionAdvancements[id];
          if (adv) {
            state.unlockAdvancement(adv.id, adv.title, adv.desc, adv.icon);
          }
        }
      });
    }, { threshold: 0.35 });

    sections.forEach(s => observer.observe(s));
  }

  setupCharacterBar() {
    const spinBtn = document.getElementById('char-btn-spin');
    const walkBtn = document.getElementById('char-btn-walk');
    const resetBtn = document.getElementById('char-btn-reset');
    const emoteBtn = document.getElementById('char-btn-emote');
    const canvas = document.getElementById('character-canvas');

    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        const spinning = character.toggleAutoSpin();
        spinBtn.style.background = spinning ? '#52b788' : '#373737';
        audio.playClick();
      });
    }

    if (walkBtn) {
      walkBtn.addEventListener('click', () => {
        const walking = character.toggleWalkCycle();
        walkBtn.style.background = walking ? '#52b788' : '#373737';
        audio.playClick();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        character.resetCamera();
        audio.playClick();
      });
    }

    if (emoteBtn) {
      emoteBtn.addEventListener('click', () => {
        emotes.toggleWheel();
      });
    }

    if (canvas) {
      // Click character canvas opens emote wheel
      canvas.addEventListener('dblclick', () => {
        emotes.toggleWheel();
      });
    }

    // Wheel Prev / Next pagination buttons
    const wheelPrev = document.getElementById('wheel-prev-btn');
    const wheelNext = document.getElementById('wheel-next-btn');
    if (wheelPrev) wheelPrev.addEventListener('click', () => emotes.prevPage());
    if (wheelNext) wheelNext.addEventListener('click', () => emotes.nextPage());
  }

  setupRunicHover() {
    const enchantRows = document.querySelectorAll('.enchant-row');
    enchantRows.forEach(row => {
      const runes = row.querySelector('.sga-runes');
      const originalText = runes ? runes.textContent : '';
      const english = row.dataset.english || '';

      row.addEventListener('mouseenter', () => {
        if (runes) runes.textContent = `[ ${english} ]`;
        audio.playClick();
      });

      row.addEventListener('mouseleave', () => {
        if (runes) runes.textContent = originalText;
      });

      row.addEventListener('click', () => {
        audio.playXP();
        alert(`✨ Enchantment Inspected: ${row.dataset.name}\n\nCost: ${row.dataset.cost}\nEffect: ${row.dataset.desc}`);
      });
    });
  }
}

// Global bootstrap with state check
function startApp() {
  const app = new App();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

