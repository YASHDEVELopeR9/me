/**
 * MODALS.JS - Dialog Controller, Tab Navigation, Forms & Backend Dispatch
 * Handles Ender Chest item inspection, Villager trading, Book & Quill contact,
 * Quest Contract submission with Flask API + automatic mailto fallback.
 */

import { state } from './state.js';
import { audio } from './audio.js';
import { character } from './character.js';

class ModalController {
  constructor() {
    this.selectedProject = null;
    this.selectedRole = 'Web Dev';
    this.selectedBudget = '$500 - $1500';
  }

  init() {
    this.setupTabs();
    this.setupCertLightbox();
    this.setupEnderChestInteraction();
    this.setupVillagerTrading();
    this.setupBookAndQuill();
    this.setupQuestContract();
    this.setupOptionsModal();
    this.setupCloseButtons();
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.mc-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
        audio.playClick();
      });
    });

    window.addEventListener('switch-tab', (e) => {
      this.switchTab(e.detail);
    });
  }

  switchTab(tabId) {
    const tabButtons = document.querySelectorAll('.mc-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    tabPanes.forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
  }

  setupCertLightbox() {
    const dialog = document.getElementById('cert-lightbox-dialog');
    if (!dialog) return;

    window.openCertLightbox = (certData) => {
      const imgEl = document.getElementById('cert-lightbox-img');
      const titleEl = document.getElementById('cert-lightbox-title');
      const issuerEl = document.getElementById('cert-lightbox-issuer');
      const dateEl = document.getElementById('cert-lightbox-date');
      const descEl = document.getElementById('cert-lightbox-desc');
      const verifyLink = document.getElementById('cert-lightbox-verify');

      if (imgEl) imgEl.src = certData.img;
      if (titleEl) titleEl.textContent = certData.title;
      if (issuerEl) issuerEl.textContent = certData.issuer;
      if (dateEl) dateEl.textContent = certData.date;
      if (descEl) descEl.textContent = certData.description;
      if (verifyLink) verifyLink.href = certData.verifyUrl;

      dialog.showModal();
      audio.playChest();
    };
  }

  setupEnderChestInteraction() {
    const profile = state.get('profileData');
    if (!profile || !profile.projects) return;

    const slots = document.querySelectorAll('.ender-slot');
    const detailTitle = document.getElementById('ender-detail-title');
    const detailRarity = document.getElementById('ender-detail-rarity');
    const detailDesc = document.getElementById('ender-detail-desc');
    const detailTags = document.getElementById('ender-detail-tags');
    const detailDemo = document.getElementById('ender-detail-demo');
    const detailGithub = document.getElementById('ender-detail-github');

    const selectProject = (proj, slotEl) => {
      slots.forEach(s => s.classList.remove('selected'));
      if (slotEl) slotEl.classList.add('selected');

      state.unlockAdvancement('adv-projects', 'Acquire Hardware', 'Opened the 27-slot Ender Chest to inspect builds.', '💎');
      audio.playPop();

      if (detailTitle) detailTitle.textContent = proj.title;
      if (detailRarity) {
        detailRarity.textContent = proj.rarity;
        detailRarity.className = `item-rarity text-${this.getRarityClass(proj.rarity)}`;
      }
      if (detailDesc) detailDesc.textContent = proj.desc;
      if (detailTags) {
        detailTags.innerHTML = proj.tech.map(t => `<span class="item-tech-tag">${t}</span>`).join('');
      }
      if (detailDemo) detailDemo.href = proj.demo;
      if (detailGithub) detailGithub.href = proj.github;
    };

    slots.forEach(slotEl => {
      const idx = parseInt(slotEl.dataset.index, 10);
      const proj = profile.projects.find(p => p.slot === idx);
      if (proj) {
        slotEl.addEventListener('click', () => selectProject(proj, slotEl));
      }
    });

    // Select first featured project by default
    if (profile.projects.length > 0) {
      selectProject(profile.projects[0], slots[0]);
    }
  }

  getRarityClass(rarity) {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'gold';
      case 'epic': return 'purple';
      case 'rare': return 'aqua';
      default: return 'green';
    }
  }

  setupVillagerTrading() {
    const tradeButtons = document.querySelectorAll('.btn-trade-hire');
    tradeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const service = btn.dataset.service;
        const emeralds = btn.dataset.cost;

        audio.playVillager();
        state.unlockAdvancement('adv-trades', 'What a Deal!', 'Negotiated custom craft with the Village Merchant.', '🟢');

        // Open Hire dialog pre-filled
        const hireDialog = document.getElementById('hire-dialog');
        const roleChip = document.querySelector(`.contract-chip[data-role="${service}"]`);
        if (roleChip) {
          document.querySelectorAll('.contract-chip[data-role]').forEach(c => c.classList.remove('selected'));
          roleChip.classList.add('selected');
          this.selectedRole = service;
        }

        const briefInput = document.getElementById('hire-brief');
        if (briefInput) {
          briefInput.value = `Offering ${emeralds} Emeralds for: ${service}. Looking forward to discussing details!`;
        }

        if (hireDialog) hireDialog.showModal();
      });
    });
  }

  setupBookAndQuill() {
    const form = document.getElementById('book-quill-form');
    const msgInput = document.getElementById('book-message');
    const countEl = document.getElementById('book-char-count');

    if (msgInput && countEl) {
      msgInput.addEventListener('input', () => {
        countEl.textContent = `${msgInput.value.length} / 2000`;
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.wax-seal-btn');
        const originalText = submitBtn ? submitBtn.textContent : 'Sign & Send';
        if (submitBtn) submitBtn.textContent = 'Dispacthing Raven...';

        const name = document.getElementById('book-name').value.trim();
        const contact = document.getElementById('book-contact').value.trim();
        const reqType = document.getElementById('book-type').value;
        const message = document.getElementById('book-message').value.trim();

        const payload = { name, contact, type: reqType, message };

        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (res.ok && data.success) {
            audio.playXP();
            state.unlockAdvancement('adv-contact', 'Signed & Sealed', 'Dispatched parchment through the Book & Quill.', '🪶');
            alert(`📜 Message Delivered!\n\n${data.message}`);
            form.reset();
            if (countEl) countEl.textContent = '0 / 2000';
          } else {
            throw new Error(data.error || 'Server error');
          }
        } catch (err) {
          console.warn('[Contact Fallback to Mailto]', err);
          // Seamless GitHub Pages mailto fallback
          const subject = encodeURIComponent(`[Survival Realm] ${reqType} from ${name}`);
          const body = encodeURIComponent(`Adventurer: ${name}\nCoordinates: ${contact}\nRequisition: ${reqType}\n\nMessage:\n${message}`);
          window.location.href = `mailto:yashvishwakarma968@gmail.com?subject=${subject}&body=${body}`;
        } finally {
          if (submitBtn) submitBtn.textContent = originalText;
        }
      });
    }
  }

  setupQuestContract() {
    // Role chips
    const roleChips = document.querySelectorAll('.contract-chip[data-role]');
    roleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        roleChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedRole = chip.dataset.role;
        audio.playClick();
      });
    });

    // Budget chips
    const budgetChips = document.querySelectorAll('.contract-chip[data-budget]');
    budgetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        budgetChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedBudget = chip.dataset.budget;
        audio.playClick();
      });
    });

    const form = document.getElementById('hire-quest-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('hire-name').value.trim();
        const contact = document.getElementById('hire-contact').value.trim();
        const brief = document.getElementById('hire-brief').value.trim();

        const payload = {
          name,
          contact,
          role: this.selectedRole,
          budget: this.selectedBudget,
          brief
        };

        const submitBtn = form.querySelector('.mc-button.primary');
        const originalText = submitBtn ? submitBtn.textContent : 'Seal Contract';
        if (submitBtn) submitBtn.textContent = 'Sealing...';

        try {
          const res = await fetch('/api/hire', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (res.ok && data.success) {
            audio.playAdvancement();
            alert(`⚔️ Quest Contract Sealed!\n\n${data.message}`);
            form.reset();
            const hireDialog = document.getElementById('hire-dialog');
            if (hireDialog) hireDialog.close();
          } else {
            throw new Error(data.error || 'Server error');
          }
        } catch (err) {
          console.warn('[Hire Fallback to Mailto]', err);
          const subject = encodeURIComponent(`⚔️ Quest Contract: ${this.selectedRole} (${this.selectedBudget}) - ${name}`);
          const body = encodeURIComponent(`Employer / Guild: ${name}\nCoordinates: ${contact}\nRole: ${this.selectedRole}\nBudget: ${this.selectedBudget}\n\nProject Brief:\n${brief}`);
          window.location.href = `mailto:yashvishwakarma968@gmail.com?subject=${subject}&body=${body}`;
        } finally {
          if (submitBtn) submitBtn.textContent = originalText;
        }
      });
    }
  }

  setupOptionsModal() {
    const densitySlider = document.getElementById('opt-petal-density');
    const densityVal = document.getElementById('opt-density-val');
    if (densitySlider) {
      densitySlider.value = state.get('petalDensity');
      if (densityVal) densityVal.textContent = densitySlider.value;

      densitySlider.addEventListener('input', () => {
        const val = parseInt(densitySlider.value, 10);
        state.set('petalDensity', val);
        if (densityVal) densityVal.textContent = val;
      });
    }

    const scanlinesCheck = document.getElementById('opt-scanlines');
    if (scanlinesCheck) {
      scanlinesCheck.checked = state.get('scanlines');
      scanlinesCheck.addEventListener('change', () => {
        state.set('scanlines', scanlinesCheck.checked);
        document.documentElement.setAttribute('data-scanlines', scanlinesCheck.checked ? 'true' : 'false');
      });
    }

    // Color preset buttons
    const colorButtons = document.querySelectorAll('.btn-skin-color');
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.color;
        character.setColor(preset);
        audio.playClick();
      });
    });
  }

  setupCloseButtons() {
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dialog = btn.closest('dialog');
        if (dialog) dialog.close();
        audio.playClick();
      });
    });
  }
}

export const modals = new ModalController();
