/**
 * CHARACTER.JS - Three.js 3D Minecraft Player Model & Skin Texture Engine
 * Hierarchical BoxGeometry (head, body, arms, legs + 2nd outer layer).
 * Dynamic 64x64 CanvasTexture with expressions, blinking, customizable colors,
 * breathing idle, cursor tracking, OrbitControls, and performance guards.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { state } from './state.js';

class MinecraftCharacter {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;

    // Limb groups for hierarchical rotation
    this.root = null;
    this.headGroup = null;
    this.bodyGroup = null;
    this.leftArmGroup = null;
    this.rightArmGroup = null;
    this.leftLegGroup = null;
    this.rightLegGroup = null;

    // Outer layers
    this.headOverlay = null;
    this.bodyOverlay = null;

    // Skin & Expressions
    this.skinCanvas = null;
    this.skinCtx = null;
    this.skinTexture = null;
    this.material = null;
    this.overlayMaterial = null;

    this.currentExpression = 'neutral';
    this.isBlinking = false;
    this.blinkTimer = null;
    this.currentColorPreset = 'default';

    // Animation & Tracking
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.animTime = 0;
    this.autoSpin = false;
    this.walkCycle = false;
    this.activeEmote = null;
    this.isRunning = false;
    this.disposed = false;
  }

  init(containerId = 'character-container', canvasId = 'character-canvas') {
    this.container = document.getElementById(containerId);
    this.canvas = document.getElementById(canvasId);
    if (!this.container || !this.canvas) return;

    try {
      this.setupRenderer();
      this.setupScene();
      this.setupCamera();
      this.setupLights();
      this.createSkinTexture();
      this.buildModel();
      this.setupControls();
      this.setupEvents();
      this.startBlinkLoop();
      this.start();
    } catch (err) {
      console.error('[Character 3D Error]', err);
      this.renderFallback();
    }
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(0, 4, 38);
  }

  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffe5ec, 1.2);
    this.scene.add(ambient);

    // Directional sunlight
    const sunLight = new THREE.DirectionalLight(0xfff0f5, 1.8);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    this.scene.add(sunLight);

    // Rim light from behind
    const rimLight = new THREE.DirectionalLight(0xff758f, 1.2);
    rimLight.position.set(-15, 10, -20);
    this.scene.add(rimLight);

    // Ground contact shadow disc
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x160814,
      transparent: true,
      opacity: 0.45
    });
    const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -12;
    this.scene.add(groundShadow);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableZoom = true;
    this.controls.minDistance = 24;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.target.set(0, 0, 0);
  }

  /**
   * Generates a genuine 64x64 Minecraft Skin Canvas
   */
  createSkinTexture() {
    this.skinCanvas = document.createElement('canvas');
    this.skinCanvas.width = 64;
    this.skinCanvas.height = 64;
    this.skinCtx = this.skinCanvas.getContext('2d');

    this.renderSkinTexture();

    this.skinTexture = new THREE.CanvasTexture(this.skinCanvas);
    this.skinTexture.magFilter = THREE.NearestFilter;
    this.skinTexture.minFilter = THREE.NearestFilter;
    this.skinTexture.generateMipmaps = false;

    this.material = new THREE.MeshStandardMaterial({
      map: this.skinTexture,
      roughness: 0.85,
      metalness: 0.05
    });

    this.overlayMaterial = new THREE.MeshStandardMaterial({
      map: this.skinTexture,
      transparent: true,
      alphaTest: 0.3,
      roughness: 0.8,
      metalness: 0.05
    });
  }

  /**
   * Draws the pixel-art skin colors onto the 64x64 canvas
   */
  renderSkinTexture() {
    const ctx = this.skinCtx;
    ctx.clearRect(0, 0, 64, 64);

    // Color palettes based on preset
    let hoodiePrimary = '#b81440';
    let hoodieSecondary = '#e63946';
    let pantsColor = '#1d3557';
    let hairColor = '#241410';
    let skinTone = '#e2b192';

    if (this.currentColorPreset === 'dark') {
      hoodiePrimary = '#1a1820';
      hoodieSecondary = '#332d40';
      pantsColor = '#0f0e13';
      hairColor = '#120f17';
    } else if (this.currentColorPreset === 'cyan') {
      hoodiePrimary = '#0077b6';
      hoodieSecondary = '#00b4d8';
      pantsColor = '#03045e';
    } else if (this.currentColorPreset === 'gold') {
      hoodiePrimary = '#f59e0b';
      hoodieSecondary = '#fbbf24';
      pantsColor = '#78350f';
    }

    // --- BASE LAYER ---
    // Head Base (skin: 0,0 to 32,16)
    ctx.fillStyle = skinTone;
    ctx.fillRect(0, 0, 32, 16);

    // Hair base top & back
    ctx.fillStyle = hairColor;
    ctx.fillRect(8, 0, 8, 8); // Top of head
    ctx.fillRect(24, 8, 8, 8); // Back of head
    ctx.fillRect(0, 8, 8, 8); // Right side
    ctx.fillRect(16, 8, 8, 8); // Left side
    // Hair bangs on forehead
    ctx.fillRect(8, 8, 8, 3);
    ctx.fillRect(8, 11, 2, 2);
    ctx.fillRect(14, 11, 2, 2);

    // Torso Base (20,20 to 40,32)
    ctx.fillStyle = hoodiePrimary;
    ctx.fillRect(16, 16, 24, 16);
    // Torso highlights & zipper/strings
    ctx.fillStyle = hoodieSecondary;
    ctx.fillRect(20, 20, 8, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 21, 1, 4);
    ctx.fillRect(24, 21, 1, 4);

    // Right Arm Base (40,16 to 56,32)
    ctx.fillStyle = hoodiePrimary;
    ctx.fillRect(40, 16, 16, 16);
    // Right Hand (skin tone)
    ctx.fillStyle = skinTone;
    ctx.fillRect(44, 28, 4, 4);
    ctx.fillRect(48, 28, 4, 4);

    // Left Arm Base (32,48 to 48,64)
    ctx.fillStyle = hoodiePrimary;
    ctx.fillRect(32, 48, 16, 16);
    // Left Hand (skin tone)
    ctx.fillStyle = skinTone;
    ctx.fillRect(36, 60, 4, 4);
    ctx.fillRect(40, 60, 4, 4);

    // Right Leg Base (0,16 to 16,32)
    ctx.fillStyle = pantsColor;
    ctx.fillRect(0, 16, 16, 16);
    // Shoes
    ctx.fillStyle = '#222222';
    ctx.fillRect(4, 28, 4, 4);
    ctx.fillRect(8, 28, 4, 4);

    // Left Leg Base (16,48 to 32,64)
    ctx.fillStyle = pantsColor;
    ctx.fillRect(16, 48, 16, 16);
    // Shoes
    ctx.fillStyle = '#222222';
    ctx.fillRect(20, 60, 4, 4);
    ctx.fillRect(24, 60, 4, 4);

    // --- OVERLAY LAYER (Outer Jacket & Hair 32,0 to 64,16) ---
    // Hair/hood overlay
    ctx.fillStyle = hairColor;
    ctx.fillRect(40, 0, 8, 8); // Top
    ctx.fillRect(32, 8, 8, 8); // Right
    ctx.fillRect(48, 8, 8, 8); // Left
    ctx.fillRect(56, 8, 8, 8); // Back

    // Draw Expression on Face (Front head: 8,8 to 16,16)
    this.drawExpression(ctx);
  }

  /**
   * Draws facial features for current expression & blink
   */
  drawExpression(ctx) {
    const expr = this.isBlinking ? 'blink' : this.currentExpression;
    const skinTone = '#e2b192';

    // Clear face area (8,8 to 16,16)
    ctx.fillStyle = skinTone;
    ctx.fillRect(8, 8, 8, 8);

    // Hair fringe on top of face
    ctx.fillStyle = '#241410';
    ctx.fillRect(8, 8, 8, 3);
    ctx.fillRect(8, 11, 2, 2);
    ctx.fillRect(14, 11, 2, 2);

    // Eye & Mouth coordinates
    const leftEye = { x: 9, y: 12 };
    const rightEye = { x: 13, y: 12 };
    const mouth = { x: 11, y: 14 };

    if (expr === 'blink') {
      // Closed line eyes
      ctx.fillStyle = '#3a2016';
      ctx.fillRect(leftEye.x, leftEye.y + 1, 2, 1);
      ctx.fillRect(rightEye.x, rightEye.y + 1, 2, 1);
      ctx.fillRect(mouth.x, mouth.y, 2, 1);
    } else if (expr === 'happy') {
      // Happy curved eyes ^ ^
      ctx.fillStyle = '#1e3d59';
      ctx.fillRect(leftEye.x, leftEye.y, 2, 1);
      ctx.fillRect(rightEye.x, rightEye.y, 2, 1);
      // Smile
      ctx.fillStyle = '#8c2d19';
      ctx.fillRect(10, 14, 4, 1);
      ctx.fillRect(10, 13, 1, 1);
      ctx.fillRect(13, 13, 1, 1);
    } else if (expr === 'wink') {
      // Left eye open, right eye wink
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(leftEye.x, leftEye.y, 2, 1);
      ctx.fillStyle = '#1e3d59';
      ctx.fillRect(leftEye.x, leftEye.y, 1, 1);
      ctx.fillStyle = '#3a2016';
      ctx.fillRect(rightEye.x, rightEye.y + 1, 2, 1);
      ctx.fillRect(11, 14, 2, 1);
    } else if (expr === 'surprised') {
      // Big open eyes & round mouth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(leftEye.x, leftEye.y, 2, 2);
      ctx.fillRect(rightEye.x, rightEye.y, 2, 2);
      ctx.fillStyle = '#1e3d59';
      ctx.fillRect(leftEye.x, leftEye.y + 1, 1, 1);
      ctx.fillRect(rightEye.x + 1, rightEye.y + 1, 1, 1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(11, 14, 2, 2);
    } else if (expr === 'angry') {
      // Slanted angry eyebrows
      ctx.fillStyle = '#3a2016';
      ctx.fillRect(leftEye.x, leftEye.y - 1, 2, 1);
      ctx.fillRect(rightEye.x, rightEye.y - 1, 2, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(leftEye.x, leftEye.y, 2, 1);
      ctx.fillRect(rightEye.x, rightEye.y, 2, 1);
      ctx.fillStyle = '#a8201a';
      ctx.fillRect(leftEye.x + 1, leftEye.y, 1, 1);
      ctx.fillRect(rightEye.x, rightEye.y, 1, 1);
      ctx.fillRect(11, 14, 2, 1);
    } else if (expr === 'sad') {
      // Downcast eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(leftEye.x, leftEye.y + 1, 2, 1);
      ctx.fillRect(rightEye.x, rightEye.y + 1, 2, 1);
      ctx.fillStyle = '#1e3d59';
      ctx.fillRect(leftEye.x, leftEye.y + 1, 1, 1);
      ctx.fillRect(rightEye.x + 1, rightEye.y + 1, 1, 1);
      // Frown
      ctx.fillStyle = '#8c2d19';
      ctx.fillRect(11, 14, 2, 1);
      ctx.fillRect(10, 15, 1, 1);
      ctx.fillRect(13, 15, 1, 1);
    } else if (expr === 'laugh') {
      // Closed laugh eyes
      ctx.fillStyle = '#222222';
      ctx.fillRect(leftEye.x, leftEye.y, 2, 1);
      ctx.fillRect(rightEye.x, rightEye.y, 2, 1);
      // Big open laugh smile
      ctx.fillStyle = '#8c2d19';
      ctx.fillRect(10, 13, 4, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 13, 2, 1);
    } else if (expr === 'cool') {
      // Pixel Sunglasses!
      ctx.fillStyle = '#111111';
      ctx.fillRect(8, 11, 8, 3);
      // White glare reflection
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 11, 1, 1);
      ctx.fillRect(13, 11, 1, 1);
      // Smirk
      ctx.fillStyle = '#8c2d19';
      ctx.fillRect(12, 14, 2, 1);
    } else {
      // Neutral default
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(leftEye.x, leftEye.y, 2, 2);
      ctx.fillRect(rightEye.x, rightEye.y, 2, 2);
      ctx.fillStyle = '#1e3d59';
      ctx.fillRect(leftEye.x, leftEye.y, 1, 2);
      ctx.fillRect(rightEye.x + 1, rightEye.y, 1, 2);
      // Small mouth
      ctx.fillStyle = '#8c2d19';
      ctx.fillRect(mouth.x, mouth.y, 2, 1);
    }

    if (this.skinTexture) {
      this.skinTexture.needsUpdate = true;
    }
  }

  /**
   * Helper to set UV coordinates for standard Minecraft boxes
   */
  setBoxUVs(geometry, u, v, w, h, d, texW = 64, texH = 64) {
    const uvAttr = geometry.attributes.uv;
    // BoxGeometry faces order: Right (+X), Left (-X), Top (+Y), Bottom (-Y), Front (+Z), Back (-Z)
    // 4 vertices per face: 0:(u0,v1), 1:(u1,v1), 2:(u0,v0), 3:(u1,v0)
    const setFace = (faceIndex, x, y, width, height) => {
      const u0 = x / texW;
      const u1 = (x + width) / texW;
      const v0 = 1 - (y + height) / texH;
      const v1 = 1 - y / texH;

      const idx = faceIndex * 4;
      uvAttr.setXY(idx + 0, u0, v1);
      uvAttr.setXY(idx + 1, u1, v1);
      uvAttr.setXY(idx + 2, u0, v0);
      uvAttr.setXY(idx + 3, u1, v0);
    };

    setFace(0, u, v + d, d, h);           // Right
    setFace(1, u + d + w, v + d, d, h);   // Left
    setFace(2, u + d, v, w, d);           // Top
    setFace(3, u + d + w, v, w, d);       // Bottom
    setFace(4, u + d, v + d, w, h);       // Front
    setFace(5, u + d + w + d, v + d, w, h); // Back

    uvAttr.needsUpdate = true;
  }

  /**
   * Builds the Minecraft character hierarchy with BoxGeometries and joints
   */
  buildModel() {
    this.root = new THREE.Group();

    // 1. HEAD (8 x 8 x 8)
    const headGeo = new THREE.BoxGeometry(8, 8, 8);
    this.setBoxUVs(headGeo, 0, 0, 8, 8, 8);
    const headMesh = new THREE.Mesh(headGeo, this.material);
    headMesh.castShadow = true;
    headMesh.position.y = 4; // Center relative to pivot at neck

    // Head outer layer (hair / hat)
    const headOverGeo = new THREE.BoxGeometry(8.8, 8.8, 8.8);
    this.setBoxUVs(headOverGeo, 32, 0, 8, 8, 8);
    this.headOverlay = new THREE.Mesh(headOverGeo, this.overlayMaterial);
    this.headOverlay.position.y = 4;

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 6, 0); // Neck pivot at top of body
    this.headGroup.add(headMesh);
    this.headGroup.add(this.headOverlay);

    // 2. BODY / TORSO (8 x 12 x 4)
    const bodyGeo = new THREE.BoxGeometry(8, 12, 4);
    this.setBoxUVs(bodyGeo, 16, 16, 8, 12, 4);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.material);
    bodyMesh.castShadow = true;

    // Body outer jacket layer
    const bodyOverGeo = new THREE.BoxGeometry(8.6, 12.6, 4.6);
    this.setBoxUVs(bodyOverGeo, 16, 32, 8, 12, 4);
    this.bodyOverlay = new THREE.Mesh(bodyOverGeo, this.overlayMaterial);

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0, 0);
    this.bodyGroup.add(bodyMesh);
    this.bodyGroup.add(this.bodyOverlay);

    // 3. RIGHT ARM (4 x 12 x 4)
    const rightArmGeo = new THREE.BoxGeometry(4, 12, 4);
    this.setBoxUVs(rightArmGeo, 40, 16, 4, 12, 4);
    const rightArmMesh = new THREE.Mesh(rightArmGeo, this.material);
    rightArmMesh.castShadow = true;
    rightArmMesh.position.y = -4; // Pivot at shoulder

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(-6, 4, 0); // Right shoulder
    this.rightArmGroup.add(rightArmMesh);

    // 4. LEFT ARM (4 x 12 x 4)
    const leftArmGeo = new THREE.BoxGeometry(4, 12, 4);
    this.setBoxUVs(leftArmGeo, 32, 48, 4, 12, 4);
    const leftArmMesh = new THREE.Mesh(leftArmGeo, this.material);
    leftArmMesh.castShadow = true;
    leftArmMesh.position.y = -4; // Pivot at shoulder

    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(6, 4, 0); // Left shoulder
    this.leftArmGroup.add(leftArmMesh);

    // 5. RIGHT LEG (4 x 12 x 4)
    const rightLegGeo = new THREE.BoxGeometry(4, 12, 4);
    this.setBoxUVs(rightLegGeo, 0, 16, 4, 12, 4);
    const rightLegMesh = new THREE.Mesh(rightLegGeo, this.material);
    rightLegMesh.castShadow = true;
    rightLegMesh.position.y = -6; // Pivot at hip

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(-2, -6, 0); // Right hip
    this.rightLegGroup.add(rightLegMesh);

    // 6. LEFT LEG (4 x 12 x 4)
    const leftLegGeo = new THREE.BoxGeometry(4, 12, 4);
    this.setBoxUVs(leftLegGeo, 16, 48, 4, 12, 4);
    const leftLegMesh = new THREE.Mesh(leftLegGeo, this.material);
    leftLegMesh.castShadow = true;
    leftLegMesh.position.y = -6; // Pivot at hip

    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(2, -6, 0); // Left hip
    this.leftLegGroup.add(leftLegMesh);

    // Assemble root
    this.root.add(this.headGroup);
    this.root.add(this.bodyGroup);
    this.root.add(this.rightArmGroup);
    this.root.add(this.leftArmGroup);
    this.root.add(this.rightLegGroup);
    this.root.add(this.leftLegGroup);

    this.scene.add(this.root);
  }

  setupEvents() {
    // Window Resize
    window.addEventListener('resize', () => this.onResize());

    // Cursor tracking on canvas / container
    window.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 2 - 1;
      const y = -(e.clientY - rect.top) / rect.height * 2 + 1;
      this.mouse.targetX = Math.max(-1.5, Math.min(1.5, x));
      this.mouse.targetY = Math.max(-1.5, Math.min(1.5, y));
    });

    // Pause on hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else if (state.get('threeDEnabled')) {
        this.start();
      }
    });

    // Listen to state 3D toggle
    state.on('change:threeDEnabled', ({ value }) => {
      if (value) {
        this.container.style.display = 'block';
        this.start();
      } else {
        this.stop();
        this.container.style.display = 'none';
      }
    });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  startBlinkLoop() {
    const scheduleNextBlink = () => {
      const delay = Math.random() * 3000 + 3000; // 3 to 6 seconds
      this.blinkTimer = setTimeout(() => {
        this.isBlinking = true;
        this.renderSkinTexture();
        setTimeout(() => {
          this.isBlinking = false;
          this.renderSkinTexture();
          scheduleNextBlink();
        }, 150);
      }, delay);
    };
    scheduleNextBlink();
  }

  setExpression(expr) {
    this.currentExpression = expr;
    this.renderSkinTexture();
  }

  setColor(preset) {
    this.currentColorPreset = preset;
    state.set('characterColor', preset);
    this.renderSkinTexture();
  }

  toggleAutoSpin() {
    this.autoSpin = !this.autoSpin;
    return this.autoSpin;
  }

  toggleWalkCycle() {
    this.walkCycle = !this.walkCycle;
    if (!this.walkCycle) {
      // Reset limbs
      this.leftArmGroup.rotation.set(0, 0, 0);
      this.rightArmGroup.rotation.set(0, 0, 0);
      this.leftLegGroup.rotation.set(0, 0, 0);
      this.rightLegGroup.rotation.set(0, 0, 0);
    }
    return this.walkCycle;
  }

  resetCamera() {
    if (this.controls && this.camera) {
      this.camera.position.set(0, 4, 38);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      this.root.rotation.set(0, 0, 0);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop() {
    if (!this.isRunning || this.disposed) return;
    requestAnimationFrame(() => this.loop());

    this.animTime += 0.035;

    // Smooth head follow cursor
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    if (this.headGroup && !this.activeEmote) {
      // Clamp head yaw to ±40° and pitch to ±25°
      this.headGroup.rotation.y = this.mouse.x * 0.7;
      this.headGroup.rotation.x = -this.mouse.y * 0.45;
    }

    // Idle breathing bobbing
    if (!this.activeEmote) {
      const breath = Math.sin(this.animTime * 1.5) * 0.08;
      this.bodyGroup.position.y = breath;
      this.headGroup.position.y = 6 + breath;
      this.leftArmGroup.position.y = 4 + breath * 0.5;
      this.rightArmGroup.position.y = 4 + breath * 0.5;

      // Gentle arm sway
      if (!this.walkCycle) {
        this.leftArmGroup.rotation.z = Math.sin(this.animTime * 1.5) * 0.03;
        this.rightArmGroup.rotation.z = -Math.sin(this.animTime * 1.5) * 0.03;
      }
    }

    // Walking cycle preview
    if (this.walkCycle && !this.activeEmote) {
      const walk = Math.sin(this.animTime * 4) * 0.6;
      this.leftArmGroup.rotation.x = walk;
      this.rightArmGroup.rotation.x = -walk;
      this.leftLegGroup.rotation.x = -walk;
      this.rightLegGroup.rotation.x = walk;
    }

    // Auto-spin
    if (this.autoSpin && this.root) {
      this.root.rotation.y += 0.015;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  renderFallback() {
    if (this.container) {
      this.container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #ff9ebb; font-family: var(--font-pixel); font-size: 0.8rem; padding: 20px;">
          <img src="assets/icons/player_head.svg" alt="Yash Avatar" style="width: 96px; height: 96px; image-rendering: pixelated; margin-bottom: 16px;">
          <p>YASH VISHWAKARMA</p>
          <span style="font-size: 0.65rem; color: #ffff55; margin-top: 8px;">[3D Canvas Fallback Mode]</span>
        </div>
      `;
    }
  }

  dispose() {
    this.disposed = true;
    this.stop();
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

export const character = new MinecraftCharacter();
