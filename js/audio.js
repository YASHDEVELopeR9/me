/**
 * AUDIO.JS - Web Audio API Synthesizer
 * Zero external audio files. 100% procedurally synthesized Minecraft SFX.
 */

import { state } from './state.js';

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
    } catch (e) {
      console.warn('[Audio] Web Audio API not supported', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isEnabled() {
    return state.get('sfxEnabled');
  }

  /**
   * UI / Button Click SFX
   * Short crisp wooden click using bandpassed impulse
   */
  playClick() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * XP Orb Pickup Chime
   * Crisp harmonic ding with random subtle pitch variation
   */
  playXP() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 880 + (Math.random() * 140 - 70); // A5 area
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.12);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Villager "Hrrr!" SFX
   * Low nasal formant sweep with subtle vibrato
   */
  playVillager() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(160, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.45);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.linearRampToValueAtTime(700, t + 0.2);
    filter.frequency.linearRampToValueAtTime(380, t + 0.45);
    filter.Q.value = 4.5;

    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  /**
   * Advancement Made Fanfare
   * Triumphant brass-like 2-tone Minecraft challenge fanfare
   */
  playAdvancement() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 523.25, time: 0.0, dur: 0.14 }, // C5
      { f: 659.25, time: 0.14, dur: 0.14 }, // E5
      { f: 783.99, time: 0.28, dur: 0.45 }  // G5
    ];

    notes.forEach(n => {
      const start = t + n.time;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, start);

      gain.gain.setValueAtTime(0.0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + n.dur);
    });
  }

  /**
   * Pop / Item Pickup
   */
  playPop() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Clap SFX (for Clap emote)
   */
  playClap() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.45;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  /**
   * Swoosh / Flip SFX
   */
  playWhoosh() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(900, t + 0.15);
    filter.frequency.linearRampToValueAtTime(200, t + 0.3);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Chest Creak Open
   */
  playChest() {
    if (!this.isEnabled()) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }
}

export const audio = new AudioSynthesizer();
