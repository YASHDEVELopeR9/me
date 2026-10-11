/**
 * STATE.JS - Centralized Reactive State Store
 * Manages game UI state, user settings, persistent storage, and event dispatching.
 */

class StateManager {
  constructor() {
    this.storageKey = 'survival_guide_v1_settings';
    this.listeners = new Map();

    const saved = this.loadSettings();

    this.state = {
      theme: saved.theme || 'day',
      sfxEnabled: saved.sfxEnabled !== undefined ? saved.sfxEnabled : true,
      threeDEnabled: saved.threeDEnabled !== undefined ? saved.threeDEnabled : true,
      petalDensity: saved.petalDensity !== undefined ? saved.petalDensity : 45,
      scanlines: saved.scanlines !== undefined ? saved.scanlines : false,
      currentSlot: 1, // Hotbar slot 1-9
      currentExpression: 'neutral',
      characterColor: saved.characterColor || 'default',
      autoSpin: false,
      walkCycle: false,
      health: 20,
      hunger: 20,
      xpLevel: 38,
      advancements: new Set(saved.advancements || ['adv-root']),
      profileData: null
    };
  }

  loadSettings() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('[State] Failed to read localStorage', e);
      return {};
    }
  }

  saveSettings() {
    try {
      const dataToSave = {
        theme: this.state.theme,
        sfxEnabled: this.state.sfxEnabled,
        threeDEnabled: this.state.threeDEnabled,
        petalDensity: this.state.petalDensity,
        scanlines: this.state.scanlines,
        characterColor: this.state.characterColor,
        advancements: Array.from(this.state.advancements)
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('[State] Failed to persist settings', e);
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const prev = this.state[key];
    this.state[key] = value;
    this.saveSettings();
    this.emit(`change:${key}`, { value, prev });
    this.emit('change', { key, value, prev });
  }

  unlockAdvancement(id, title, desc, icon) {
    if (!this.state.advancements.has(id)) {
      this.state.advancements.add(id);
      this.saveSettings();
      this.emit('advancement:unlocked', { id, title, desc, icon });
      return true;
    }
    return false;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(handler => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[State Event Error: ${event}]`, err);
        }
      });
    }
  }
}

export const state = new StateManager();
