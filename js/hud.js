/**
 * HUD.JS - Minecraft Survival HUD Manager
 * Controls top status bar, bottom 9-slot hotbar, keys 1-9, wheel scrolling,
 * hearts, hunger, XP level 38, tooltips, and advancement toasts.
 */

import { state } from './state.js';
import { audio } from './audio.js';

class HUDManager {
  constructor() {
    this.hotbarSlots = [
      { slot: 1, name: 'Grass Block', lore: 'Spawn Point • Home', target: '#hero', icon: 'assets/icons/grass_block.svg' },
      { slot: 2, name: 'Player Head', lore: 'Crafter Stats • Profile', target: '#profile', icon: 'assets/icons/player_head.svg' },
      { slot: 3, name: 'Enchanted Book', lore: 'Standard Galactic Runes • Skills', target: '#skills', icon: 'assets/icons/enchanted_book.svg' },
      { slot: 4, name: 'Chest', lore: 'Ender Inventory • 27 Projects', target: '#projects', icon: 'assets/icons/chest.svg' },
      { slot: 5, name: 'Clock', lore: 'Timeflow & Milestones • Journey', target: '#credentials', tab: 'quests', icon: 'assets/icons/clock.svg' },
      { slot: 6, name: 'Nether Star', lore: 'Google & Kaggle Credentials', target: '#credentials', tab: 'certs', icon: 'assets/icons/nether_star.svg' },
      { slot: 7, name: 'Emerald', lore: 'Village Market • Services', target: '#trades', icon: 'assets/icons/emerald.svg' },
      { slot: 8, name: 'Book & Quill', lore: 'Parchment & Seal • Contact', target: '#contact', icon: 'assets/icons/book_and_quill.svg' },
      { slot: 9, name: 'Ender Pearl', lore: 'Teleport to Resume Parchment', target: 'modal:resume', icon: 'assets/icons/ender_pearl.svg' }
    ];

    this.tooltipTimeout = null;
  }

  init() {
    this.renderHeartsAndHunger();
    this.setupHotbar();
    this.setupKeyboardControls();
    this.setupWheelScroll();
    this.setupTopHUDButtons();
    this.setupAdvancementListener();
    this.startDayClock();
  }

  renderHeartsAndHunger() {
    const heartsRow = document.getElementById('hud-hearts-row');
    const hungerRow = document.getElementById('hud-hunger-row');

    if (heartsRow) {
      heartsRow.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const img = document.createElement('img');
        img.src = 'assets/icons/heart.svg';
        img.alt = 'Health';
        img.className = 'heart-unit';
        heartsRow.appendChild(img);
      }
    }

    if (hungerRow) {
      hungerRow.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const img = document.createElement('img');
        img.src = 'assets/icons/drumstick.svg';
        img.alt = 'Hunger';
        img.className = 'hunger-unit';
        hungerRow.appendChild(img);
      }
    }
  }

  setupHotbar() {
    const container = document.getElementById('hotbar-slots');
    if (!container) return;

    container.innerHTML = '';

    this.hotbarSlots.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `hotbar-slot ${item.slot === 1 ? 'active' : ''}`;
      slot.dataset.slot = item.slot;
      slot.setAttribute('role', 'button');
      slot.setAttribute('tabindex', '0');
      slot.setAttribute('aria-label', `Slot ${item.slot}: ${item.name}`);

      slot.innerHTML = `
        <span class="slot-key-number">${item.slot}</span>
        <img src="${item.icon}" alt="${item.name}">
      `;

      slot.addEventListener('click', () => {
        this.selectSlot(item.slot);
      });

      slot.addEventListener('mouseenter', () => {
        this.showTooltip(item.name, item.lore);
      });

      slot.addEventListener('mouseleave', () => {
        const currentActive = this.hotbarSlots.find(s => s.slot === state.get('currentSlot'));
        if (currentActive) {
          this.showTooltip(currentActive.name, currentActive.lore);
        }
      });

      container.appendChild(slot);
    });

    // Initial tooltip display
    this.showTooltip(this.hotbarSlots[0].name, this.hotbarSlots[0].lore);
  }

  selectSlot(slotNum) {
    if (slotNum < 1 || slotNum > 9) return;
    state.set('currentSlot', slotNum);
    audio.playClick();

    // Update active class
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.slot, 10) === slotNum);
    });

    const item = this.hotbarSlots.find(s => s.slot === slotNum);
    if (!item) return;

    this.showTooltip(item.name, item.lore);

    // Navigation action
    if (item.target === 'modal:resume') {
      const resumeModal = document.getElementById('resume-dialog');
      if (resumeModal) resumeModal.showModal();
    } else {
      const el = document.querySelector(item.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      if (item.tab) {
        window.dispatchEvent(new CustomEvent('switch-tab', { detail: item.tab }));
      }
    }
  }

  showTooltip(name, lore) {
    const tooltip = document.getElementById('hotbar-tooltip');
    const nameEl = document.getElementById('tooltip-name');
    const loreEl = document.getElementById('tooltip-lore');

    if (!tooltip || !nameEl || !loreEl) return;

    nameEl.textContent = name;
    loreEl.textContent = lore;
    tooltip.classList.remove('hidden');

    if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      tooltip.classList.add('hidden');
    }, 3500);
  }

  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      // Keys 1 to 9
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        this.selectSlot(num);
      }

      // Esc key for pause menu
      if (e.key === 'Escape') {
        const anyOpenDialog = document.querySelector('dialog[open]');
        if (!anyOpenDialog) {
          e.preventDefault();
          this.togglePauseMenu();
        }
      }
    });
  }

  setupWheelScroll() {
    window.addEventListener('wheel', (e) => {
      // If hovering hotbar or alt key pressed
      if (e.target.closest('#bottom-hud') || e.ctrlKey || e.altKey) {
        e.preventDefault();
        let current = state.get('currentSlot');
        if (e.deltaY > 0) {
          current = current >= 9 ? 1 : current + 1;
        } else {
          current = current <= 1 ? 9 : current - 1;
        }
        this.selectSlot(current);
      }
    }, { passive: false });
  }

  setupTopHUDButtons() {
    // SFX Button
    const sfxBtn = document.getElementById('btn-sfx-toggle');
    if (sfxBtn) {
      this.updateSFXButtonText(sfxBtn);
      sfxBtn.addEventListener('click', () => {
        const next = !state.get('sfxEnabled');
        state.set('sfxEnabled', next);
        this.updateSFXButtonText(sfxBtn);
        audio.playClick();
      });
    }

    // 3D Toggle Button
    const threeDBtn = document.getElementById('btn-3d-toggle');
    if (threeDBtn) {
      this.update3DButtonText(threeDBtn);
      threeDBtn.addEventListener('click', () => {
        const next = !state.get('threeDEnabled');
        state.set('threeDEnabled', next);
        this.update3DButtonText(threeDBtn);
        audio.playClick();
      });
    }

    // Day/Night Button
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = state.get('theme');
        const next = current === 'night' ? 'day' : 'night';
        state.set('theme', next);
        document.documentElement.setAttribute('data-theme', next);
        themeBtn.innerHTML = next === 'night' ? '🌙 Night' : '☀️ Day';
        audio.playClick();
      });
    }

    // Pause Menu Button
    const pauseBtn = document.getElementById('btn-pause-menu');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.togglePauseMenu();
      });
    }

    // Config / Options Button
    const configBtn = document.getElementById('btn-config-dialog');
    if (configBtn) {
      configBtn.addEventListener('click', () => {
        const optDialog = document.getElementById('options-dialog');
        if (optDialog) optDialog.showModal();
        audio.playClick();
      });
    }

    // Trades HUD button
    const tradesBtn = document.getElementById('btn-hud-trades');
    if (tradesBtn) {
      tradesBtn.addEventListener('click', () => {
        const el = document.getElementById('trades');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        this.selectSlot(7);
      });
    }

    // Pause menu backdrop buttons
    const backToGameBtn = document.getElementById('btn-resume-game');
    if (backToGameBtn) {
      backToGameBtn.addEventListener('click', () => this.togglePauseMenu(false));
    }

    const respawnBtn = document.getElementById('btn-respawn');
    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.togglePauseMenu(false);
        this.selectSlot(1);
      });
    }
  }

  updateSFXButtonText(btn) {
    const enabled = state.get('sfxEnabled');
    btn.innerHTML = enabled ? '🔊 SFX' : '🔇 Mute';
  }

  update3DButtonText(btn) {
    const enabled = state.get('threeDEnabled');
    btn.innerHTML = enabled ? '🧊 3D: ON' : '⬛ 3D: OFF';
  }

  togglePauseMenu(forceState) {
    const overlay = document.getElementById('pause-menu-overlay');
    if (!overlay) return;

    const isOpen = forceState !== undefined ? forceState : !overlay.classList.contains('open');
    if (isOpen) {
      overlay.classList.add('open');
      audio.playChest();
    } else {
      overlay.classList.remove('open');
      audio.playClick();
    }
  }

  setupAdvancementListener() {
    state.on('advancement:unlocked', ({ title, desc, icon }) => {
      this.showAdvancement(title, desc, icon);
    });
  }

  showAdvancement(title, desc, icon = '🌸') {
    audio.playAdvancement();

    const container = document.getElementById('advancement-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'advancement-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="adv-icon-frame">${icon}</div>
      <div class="adv-texts">
        <span class="adv-headline">Advancement Made!</span>
        <span class="adv-title">${title}</span>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('dismissing');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  startDayClock() {
    const dayEl = document.getElementById('hud-day-counter');
    if (!dayEl) return;

    // In-game day counter based on elapsed timestamp
    const startDay = 1337;
    const updateDay = () => {
      const minutes = Math.floor(Date.now() / 60000);
      const day = startDay + (minutes % 100);
      dayEl.textContent = `Day ${day}`;
    };
    updateDay();
    setInterval(updateDay, 30000);
  }
}

export const hud = new HUDManager();
