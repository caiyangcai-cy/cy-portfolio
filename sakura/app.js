/* ========================================
   百变小樱魔法卡 - 主应用逻辑 v3
   
   状态流程：
   IDLE → (张开手掌) → SUMMONED (3D环形旋转木马)
     → (左右滑动) → 旋转木马快速切换
     → (食指选定) → SELECTED (卡牌定格放大居中)
     → (双指指着) → FLIPPED (3D翻转展示)
     → (双指指着) → CASTING (释放魔法特效)
   任何状态 → (握拳) → IDLE
   ======================================== */

const STATE = {
  IDLE: 'idle',
  SUMMONED: 'summoned',   // 3D旋转木马展示
  SELECTED: 'selected',   // 卡牌定格放大
  FLIPPED: 'flipped',     // 3D翻转展示
  CASTING: 'casting',     // 魔法释放中
};

class App {
  constructor() {
    this.state = STATE.IDLE;
    this.selectedCard = null;
    this.gestureEngine = new GestureEngine();
    this.particles = null;
    this.spellEffect = null;
    this.carousel = null;

    // DOM
    this.els = {};
  }

  async boot() {
    this._cacheDom();
    this._initEffects();
    this._bindUI();
    await this._initCamera();
    await this._initGesture();
    this._hideLoading();

    // 创建旋转木马
    this.carousel = new CardCarousel();
    this.carousel.create();
  }

  _cacheDom() {
    this.els = {
      app: document.getElementById('app'),
      loading: document.getElementById('loading-screen'),
      loadingStatus: document.getElementById('loading-status'),
      camera: document.getElementById('camera'),
      cameraOverlay: document.getElementById('camera-overlay'),
      gestureHint: document.getElementById('gesture-hint'),
      hintIcon: document.querySelector('#gesture-hint .hint-icon'),
      hintText: document.querySelector('#gesture-hint .hint-text'),
      stateBadge: document.getElementById('state-badge'),
      magicCircleBg: document.getElementById('magic-circle-bg'),
      carouselStage: document.getElementById('carousel-stage'),
      carousel: document.getElementById('carousel'),
      selectedView: document.getElementById('card-selected-view'),
      flipDisplay: document.getElementById('flip-card-display'),
      fxCanvas: document.getElementById('fx-canvas'),
      particleCanvas: document.getElementById('particle-canvas'),
      debugPanel: document.getElementById('debug-panel'),
      debugCanvas: document.getElementById('debug-canvas'),
      dbgGesture: document.getElementById('dbg-gesture'),
      dbgState: document.getElementById('dbg-state'),
      dbgHands: document.getElementById('dbg-hands'),
      dbgFps: document.getElementById('dbg-fps'),
      dbgConfidence: document.getElementById('dbg-confidence'),
    };
  }

  _initEffects() {
    this.particles = new ParticleSystem(this.els.particleCanvas);
    this.spellEffect = new SpellEffect(this.els.fxCanvas);
  }

  _bindUI() {
    document.getElementById('btn-debug').addEventListener('click', () => {
      this.els.debugPanel.classList.toggle('hidden');
    });
    document.getElementById('debug-close').addEventListener('click', () => {
      this.els.debugPanel.classList.add('hidden');
    });
    document.getElementById('btn-mirror').addEventListener('click', () => {
      const cam = this.els.camera;
      const isMirrored = cam.style.transform === 'scaleX(-1)' || cam.style.transform === '';
      cam.style.transform = isMirrored ? 'scaleX(1)' : 'scaleX(-1)';
      this.gestureEngine.mirrored = !isMirrored;
    });
    document.getElementById('btn-sound').addEventListener('click', () => {
      // TODO: 音效
    });
  }

  async _initCamera() {
    this._setLoading('正在请求摄像头权限…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      this.els.camera.srcObject = stream;
      await new Promise(resolve => { this.els.camera.onloadedmetadata = resolve; });
      await this.els.camera.play();
      this._setLoading('摄像头已就绪');
    } catch (err) {
      console.error('摄像头初始化失败:', err);
      this._setLoading('⚠️ 摄像头访问失败: ' + err.message);
      throw err;
    }
  }

  async _initGesture() {
    this._setLoading('正在加载手势识别模型…（首次可能需要几秒）');
    await this.gestureEngine.init(this.els.camera);
    this.gestureEngine.onGesture = (gesture, landmarks) => {
      this._handleGesture(gesture, landmarks);
    };
    this.gestureEngine.onHandUpdate = (results) => {
      this._drawDebug(results);
    };
    this.gestureEngine.start();
    this._setLoading('魔法系统已就绪！');
  }

  _setLoading(text) {
    this.els.loadingStatus.textContent = text;
  }

  _hideLoading() {
    this.els.loading.style.transition = 'opacity 0.5s';
    this.els.loading.style.opacity = '0';
    setTimeout(() => {
      this.els.loading.style.display = 'none';
      this.els.app.classList.remove('hidden');
    }, 500);
  }

  // ===== 核心状态机 =====

  _handleGesture(gesture, landmarks) {
    switch (this.state) {

      case STATE.IDLE:
        if (gesture === GESTURE.OPEN_PALM) {
          this._summonCards();
        }
        break;

      case STATE.SUMMONED:
        if (gesture === GESTURE.SWIPE_LEFT) {
          this._rotateCarousel(-1);
        } else if (gesture === GESTURE.SWIPE_RIGHT) {
          this._rotateCarousel(1);
        } else if (gesture === GESTURE.POINT) {
          this._selectCard();
        } else if (gesture === GESTURE.FIST) {
          this._dismissAll();
        }
        break;

      case STATE.SELECTED:
        if (gesture === GESTURE.TWO_POINT) {
          this._flipCard();
        } else if (gesture === GESTURE.OPEN_PALM) {
          this._backToCarousel();
        } else if (gesture === GESTURE.FIST) {
          this._dismissAll();
        }
        break;

      case STATE.FLIPPED:
        if (gesture === GESTURE.TWO_POINT) {
          this._castSpell();
        } else if (gesture === GESTURE.OPEN_PALM) {
          this._backToCarousel();
        } else if (gesture === GESTURE.FIST) {
          this._dismissAll();
        }
        break;

      case STATE.CASTING:
        // 不响应
        break;
    }
  }

  // ===== 交互动作 =====

  /**
   * 召唤卡牌：显示魔法阵 + 3D环形旋转木马
   */
  _summonCards() {
    this.state = STATE.SUMMONED;

    // 显示魔法阵
    this.els.magicCircleBg.classList.remove('hidden');
    this.els.magicCircleBg.classList.add('summoning');

    // 显示旋转木马
    this.els.carouselStage.classList.remove('hidden');
    this.carousel.rotateTo(0, false);
    this.carousel.playEnterAnimation();

    this.particles.emitSummon('#ffd700', 50);

    this._updateHint('👈👉', '左右滑动切换 · ☝️ 食指选定');
    this._updateBadge('卡牌召唤');
  }

  /**
   * 旋转木马切换
   */
  _rotateCarousel(dir) {
    this.carousel.rotateBy(dir);
    const card = this.carousel.getCurrentCard();

    this.particles.emitCardGlow(
      window.innerWidth / 2,
      window.innerHeight / 2,
      card.color, 8
    );

    this._updateHint('👈👉', `${card.spell} · ☝️ 食指选定`);
    this._updateBadge(`浏览: ${card.spell}`);
  }

  /**
   * 食指选定：卡牌定格放大展示
   */
  _selectCard() {
    const card = this.carousel.getCurrentCard();
    this.selectedCard = card;
    this.state = STATE.SELECTED;

    // 隐藏旋转木马
    this.els.carouselStage.classList.add('hidden');

    // 显示定格放大视图
    showSelectedCard(card);

    this.particles.emitSummon(card.color, 30);

    this._updateHint('✌️', `双指指着翻转 ${card.spell} · ✋ 取消`);
    this._updateBadge(`选定: ${card.spell}`);
  }

  /**
   * 双指指着：3D翻转展示
   */
  _flipCard() {
    const card = this.selectedCard;
    if (!card) return;

    this.state = STATE.FLIPPED;

    // 隐藏选定视图
    hideSelectedCard();

    // 显示3D翻转
    showFlipCard(card);

    this.particles.emitSummon(card.color, 35);

    this._updateHint('✌️', `再次双指指着释放魔法 · ✋ 取消`);
    this._updateBadge(`翻转: ${card.spell}`);
  }

  /**
   * 释放魔法
   */
  async _castSpell() {
    if (!this.selectedCard) return;

    this.state = STATE.CASTING;
    const card = this.selectedCard;

    hideFlipCard();

    this._updateHint('✨', `${card.spell} 释放中…`);
    this._updateBadge(`施法: ${card.spell}`);

    this.els.magicCircleBg.classList.add('hidden');

    this.particles.emitSpellBurst(card.color, 120);
    await this.spellEffect.play(card, 4000);

    // 回到待命
    this.selectedCard = null;
    this.state = STATE.IDLE;

    this._updateHint('✊', '张开手掌，召唤卡牌');
    this._updateBadge('待命');
  }

  /**
   * 回到旋转木马
   */
  _backToCarousel() {
    this.state = STATE.SUMMONED;
    this.selectedCard = null;

    hideSelectedCard();
    hideFlipCard();

    this.els.carouselStage.classList.remove('hidden');

    this._updateHint('👈👉', '左右滑动切换 · ☝️ 食指选定');
    this._updateBadge('卡牌召唤');
  }

  /**
   * 收回全部，回到 IDLE
   */
  _dismissAll() {
    this.state = STATE.IDLE;
    this.selectedCard = null;

    this.els.magicCircleBg.classList.add('hidden');
    this.els.magicCircleBg.classList.remove('summoning');
    this.els.carouselStage.classList.add('hidden');
    hideSelectedCard();
    hideFlipCard();
    this.spellEffect.stop();

    this._updateHint('✊', '张开手掌，召唤卡牌');
    this._updateBadge('待命');
  }

  // ===== UI =====

  _updateHint(icon, text) {
    this.els.hintIcon.textContent = icon;
    this.els.hintText.textContent = text;
  }

  _updateBadge(text) {
    this.els.stateBadge.textContent = text;
  }

  // ===== 调试面板 =====

  _drawDebug(results) {
    const ge = this.gestureEngine;
    this.els.dbgGesture.textContent = ge.debugData.gesture;
    this.els.dbgState.textContent = this.state;
    this.els.dbgHands.textContent = ge.debugData.handsCount;
    this.els.dbgFps.textContent = ge.fps;
    this.els.dbgConfidence.textContent = ge.debugData.confidence + '%';

    const canvas = this.els.debugCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.els.camera.readyState >= 2) {
      ctx.save();
      if (this.gestureEngine.mirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(this.els.camera, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    if (results.landmarks) {
      for (const hand of results.landmarks) {
        const connections = [
          [0,1],[1,2],[2,3],[3,4],
          [0,5],[5,6],[6,7],[7,8],
          [0,9],[9,10],[10,11],[11,12],
          [0,13],[13,14],[14,15],[15,16],
          [0,17],[17,18],[18,19],[19,20],
          [5,9],[9,13],[13,17],
        ];

        ctx.strokeStyle = '#ffd70080';
        ctx.lineWidth = 1;
        for (const [a, b] of connections) {
          const pa = hand[a], pb = hand[b];
          const ax = this.gestureEngine.mirrored ? (1 - pa.x) * canvas.width : pa.x * canvas.width;
          const ay = pa.y * canvas.height;
          const bx = this.gestureEngine.mirrored ? (1 - pb.x) * canvas.width : pb.x * canvas.width;
          const by = pb.y * canvas.height;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        for (let i = 0; i < hand.length; i++) {
          const p = hand[i];
          const x = this.gestureEngine.mirrored ? (1 - p.x) * canvas.width : p.x * canvas.width;
          const y = p.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = [4,8,12,16,20].includes(i) ? '#ff6baf' : '#00e5ff';
          ctx.fill();
        }
      }
    }
  }
}

// App 类由 bootstrap.js 中的 ESM 模块实例化并启动
