# SURVIVAL GUIDE V1.0.0
### Minecraft-Themed 3D Developer Portfolio for Yash Vishwakarma
**Web Designer, Full-Stack Developer & AI Creator**

[![Live Realm](https://img.shields.io/badge/Realm-Cherry%20Grove%20V1.0.0-ff758f?style=for-the-badge&logo=minecraft)](https://yashdeveloper9.github.io/me/)
[![Level](https://img.shields.io/badge/Player%20Level-38%20Hardcore-55ff55?style=for-the-badge)](https://github.com/YASHDEVELopeR9)
[![License](https://img.shields.io/badge/License-MIT-ffd166?style=for-the-badge)](LICENSE)

---

## 🌟 Overview

**SURVIVAL GUIDE V1.0.0** is an accessible, game-themed personal portfolio built for **Yash Vishwakarma** inspired by the aesthetics of Minecraft's **Cherry Grove** biome. It provides a survival HUD interface, an interactive 3D WebGL player model with expressions and keyframe emotes, procedural Web Audio SFX synthesis, an Ender Chest project inventory, and a Python Flask backend sentinel for contact and quest contracts.

---

## 🛠️ Architecture & Tech Stack

```
me/
├── index.html                  # Semantic HTML5, ARIA labels & Open Graph meta
├── css/
│   ├── themes.css              # Custom properties, Cherry Grove Day/Night & CRT scanlines
│   ├── main.css                # Bevel borders, typography, sections & pixel styling
│   ├── hud.css                 # 9-Slot hotbar, hearts, drumsticks, XP bar & advancement toasts
│   └── modals.css              # Dialog overlays, credentials tabs, book & quill, contract scroll
├── js/
│   ├── state.js                # Centralized reactive state store & localStorage sync
│   ├── audio.js                # Web Audio API procedural synthesizer (zero audio files)
│   ├── particles.js            # Cherry blossom falling petals & emote particle bursts
│   ├── character.js            # Three.js 3D blocky Minecraft character & 64x64 canvas skin
│   ├── emotes.js               # 11 Keyframe emotes & radial wheel UI
│   ├── hud.js                  # Hotbar navigation, keys 1-9 & scroll wheel
│   ├── modals.js               # Dialog controllers, tabs, Ender chest & API dispatch
│   └── main.js                 # App bootstrap, loading sequence & scroll observers
├── data/
│   └── profile.json            # Editable portfolio content, projects, certs, & trades
├── assets/
│   ├── cherry_grove_bg.jpg     # High-res Cherry Grove biome landscape
│   ├── certificates/           # Vector certificates (Google AI, Kaggle, WordPress)
│   └── icons/                  # Pixel-perfect Minecraft item SVG icons
├── server/
│   ├── app.py                  # Python Flask REST API with rate-limiting & SMTP dispatch
│   └── requirements.txt        # Flask & flask-cors dependencies
├── Dockerfile                  # Containerized deployment spec
└── README.md                   # Full documentation & run guide
```

---

## 🕹️ Controls & Keyboard Shortcuts

| Key / Action | Function |
|---|---|
| **Keys 1 - 9** | Switch active Hotbar slot (teleports to section & displays tooltip) |
| **Mouse Wheel** | Cycle through hotbar inventory slots |
| **Key B** | Open / close the radial **Emote Wheel** |
| **Key Esc** | Open / close Minecraft **Pause Menu** (or close active dialog) |
| **3D Drag** | Orbit around the 3D player avatar |
| **3D Scroll** | Zoom in / out within realistic limits |
| **Double Click 3D** | Open the Emote Wheel |
| **Top HUD Buttons** | Toggle Day/Night, SFX on/off, 3D on/off, Trades, and Options |

---

## 🚀 Running Locally

### 1. Static Front-End (Immediate Preview)
You can launch any static HTTP server from the project directory:

```bash
# Using Python's built-in HTTP server:
python -m http.server 8000
```
Then visit [http://localhost:8000](http://localhost:8000) in your browser.

### 2. Full-Stack with Python Flask Sentinel API
To enable the `/api/contact` and `/api/hire` dispatch endpoints:

```bash
# 1. Install dependencies
pip install -r server/requirements.txt

# 2. (Optional) Configure SMTP Credentials:
# On Windows PowerShell:
$env:SMTP_USER="your-email@gmail.com"
$env:SMTP_PASS="your-app-password"

# 3. Start Sentinel API
python server/app.py
```
Visit [http://localhost:5000](http://localhost:5000). 
*(Note: When SMTP credentials are not set, the API runs in safe simulation mode and logs dispatches to console without failing! If run statically on GitHub Pages, the front-end automatically falls back to formatted `mailto:` links).*

### 3. Docker Container
```bash
docker build -t survival-guide .
docker run -p 5000:5000 survival-guide
```

---

## 🌐 Deploying

### GitHub Pages (Static Hosting)
1. Push this repository to GitHub: `https://github.com/YASHDEVELopeR9/me`
2. Go to **Repository Settings -> Pages**
3. Set Source to `Deploy from a branch`, Branch to `main`, and Folder to `/ (root)`.
4. Click **Save**. Your realm will be live at `https://yashdeveloper9.github.io/me/`.
5. Contact and Hire submissions automatically fall back to pre-filled `mailto:` links when no backend is detected.

### Backend Hosting (Render / Railway / Fly.io)
Deploy `server/app.py` with `Dockerfile` or Python runtime. Set `SMTP_USER` and `SMTP_PASS` in your hosting dashboard's environment variables.

---

## 📋 Verification Checklist

- [x] **Top HUD**: Logo, Biome pill, Day counter, Trades, SFX toggle, 3D toggle, Day/Night theme, Pause, Config.
- [x] **Bottom HUD**: 10 hearts, 10 drumsticks, Level 38 XP bar, 9 hotbar slots with floating tooltip.
- [x] **3D Player Model**: BoxGeometry hierarchy, pivot joints, 64x64 dynamic skin, 8 facial expressions, random blinking, skin tint presets, auto-spin, and walk cycle.
- [x] **Emote Engine**: 11 keyframe emotes with matching SFX & particles + 8-slot radial wheel with page toggle.
- [x] **Standard Galactic Alphabet**: SGA runes hover-translated on the Enchantment Table.
- [x] **Ender Chest**: 27-slot grid with counts, item inspection pane, rarity styling, and links.
- [x] **Villager Trading**: 5 trade cards with emerald costs, villager "hrrr" audio, and contract pre-fill.
- [x] **Book & Quill**: 2-page parchment form with char counter and wax seal dispatch.
- [x] **Quest Contract**: Role and budget chips with Flask API + mailto fallback.
- [x] **Advancements**: Minecraft toast alerts triggered on section exploration.
