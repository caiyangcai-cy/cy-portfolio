/* ========================================
   塔罗牌手势占卜系统 - 主应用逻辑 v6
   
   状态流程：
   IDLE → (握拳) → SUMMONED (3D环+立体底盘)
     → (张开手掌连续滑动) → 旋转木马丝滑旋转
     → (食指指向 POINT) → FOCUSED (选中高亮，等待捏合确认)
     → (捏合 PINCH) → HOLDING (卡牌翻转展示，等待松手)
     → (松手 PINCH_RELEASE) → 卡牌飞入槽位
     → 若未满3张 → SUMMONED
     → 选满3张 → RESULT (占卜结果页)
   ======================================== */

const STATE = {
  IDLE: 'idle',
  SUMMONED: 'summoned',
  FOCUSED: 'focused',    // 食指选中了一张牌，等待捏合确认
  HOLDING: 'holding',    // 捏住卡牌中，等待松开拇指食指
  RELEASED: 'released',  // 松开了，卡牌飞入方框，等待张开手掌继续
  SELECTING: 'selecting', // 释放动画过渡中
  RESULT: 'result',
};

class App {
  constructor() {
    this.state = STATE.IDLE;
    this.collectedCards = [];
    this.gestureEngine = new GestureEngine();
    this.particles = null;
    this.spellEffect = null;
    this.carousel = null;
    this.userQuestion = ''; // 用户提的问题

    // DOM
    this.els = {};
    this._questionReady = false; // 是否已完成提问
  }

  async boot() {
    this._cacheDom();
    this._initEffects();
    this._initStarfield();
    this._bindUI();
    this._initPlatform();

    // 【关键】先隐藏 loading、显示提问面板，不等摄像头和手势模型
    this._hideLoading();

    // 创建旋转木马
    this.carousel = new CardCarousel();
    this.carousel.create();

    // 滑动停下后自动跳过已收集的牌
    this.carousel.onSnap = () => {
      if (this.state === STATE.SUMMONED && this.collectedCards.length > 0) {
        this._skipCollected();
      }
    };

    // 异步初始化摄像头和手势（在后台进行，不阻塞提问面板）
    this._initCameraAndGesture();
  }

  /**
   * 后台异步初始化摄像头 + 手势引擎
   */
  async _initCameraAndGesture() {
    try {
      await this._initCamera();
    } catch (e) {
      console.error('摄像头初始化失败:', e);
      this._showGlobalError('摄像头无法开启，请允许权限或检查设备。');
    }
    try {
      await this._initGesture();
    } catch (e) {
      console.error('手势引擎初始化失败:', e);
      this._showGlobalError('手势模型初始化失败：' + (e.message || String(e)));
    }
  }

  _showGlobalError(msg) {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(255,50,50,0.8);color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;pointer-events:none;';
    errDiv.innerHTML = '⚠️ <strong>占卜仪式异常</strong><br>' + msg;
    document.body.appendChild(errDiv);
  }

  _showCameraError(detail) {
    // 在手势提示区域显示醒目的摄像头错误
    const hint = this.els.gestureHint;
    if (hint) {
      hint.classList.remove('hidden');
      hint.innerHTML = '';
      const icon = document.createElement('div');
      icon.className = 'hint-icon';
      icon.textContent = '📷';
      const text = document.createElement('div');
      text.className = 'hint-text';
      text.style.cssText = 'color: #ff6b6b; font-size: 14px;';
      text.textContent = detail;
      hint.appendChild(icon);
      hint.appendChild(text);
    }
    // 同时在页面顶部加一个带重试按钮的提示条
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:14px 20px;background:rgba(180,40,40,0.92);color:white;z-index:10000;text-align:center;font-size:14px;display:flex;align-items:center;justify-content:center;gap:16px;';
    bar.innerHTML = '<span>📷 摄像头未开启：' + detail + '</span>';
    const btn = document.createElement('button');
    btn.textContent = '🔄 刷新重试';
    btn.style.cssText = 'padding:8px 18px;border:1px solid rgba(255,255,255,0.5);background:rgba(255,255,255,0.15);color:white;border-radius:6px;cursor:pointer;font-size:13px;';
    btn.onclick = () => location.reload();
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }

  _cacheDom() {
    this.els = {
      app: document.getElementById('app'),
      loading: document.getElementById('loading-screen'),
      loadingStatus: document.getElementById('loading-status'),
      camera: document.getElementById('camera'),
      cameraOverlay: document.getElementById('camera-overlay'),
      questionPanel: document.getElementById('question-panel'),
      gestureHint: document.getElementById('gesture-hint'),
      hintIcon: document.querySelector('#gesture-hint .hint-icon'),
      hintText: document.querySelector('#gesture-hint .hint-text'),
      stateBadge: document.getElementById('state-badge'),
      platform3d: document.getElementById('platform-3d'),
      carouselStage: document.getElementById('carousel-stage'),
      carousel: document.getElementById('carousel'),
      selectedView: document.getElementById('card-selected-view'),
      selectedFlipper: document.getElementById('selected-card-flipper'),
      selectedFront: document.getElementById('selected-card-front'),
      selectedCardName: document.getElementById('selected-card-name'),
      selectedGlow: document.getElementById('selected-glow'),
      releaseHint: document.getElementById('release-hint'),
      tarotCollection: document.getElementById('tarot-collection'),
      resultView: document.getElementById('tarot-result-view'),
      resultCards: document.getElementById('result-cards'),
      resultShowcase: document.getElementById('result-showcase'),
      fxCanvas: document.getElementById('fx-canvas'),
      particleCanvas: document.getElementById('particle-canvas'),
      starfieldCanvas: document.getElementById('starfield-canvas'),
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

  _initStarfield() {
    if (this.els.starfieldCanvas) {
      this.starfield = new Starfield(this.els.starfieldCanvas);
    }
  }

  _initPlatform() {
    // 初始化底盘符文点
    if (typeof initPlatformRunes === 'function') {
      initPlatformRunes();
    }
  }

  _bindUI() {
    document.getElementById('btn-debug').addEventListener('click', () => {
      this.els.debugPanel.classList.toggle('hidden');
    });
    document.getElementById('debug-close').addEventListener('click', () => {
      this.els.debugPanel.classList.add('hidden');
    });
    document.getElementById('btn-mirror').addEventListener('click', () => {
      this.gestureEngine.mirrored = !this.gestureEngine.mirrored;
    });
    document.getElementById('btn-restart-reading').addEventListener('click', () => {
      this._resetAll();
    });

    // 提问面板 — 默念开始按钮（click + touchend 双保险）
    const silentBtn = document.getElementById('btn-silent-start');
    if (silentBtn) {
      const handler = (e) => {
        e.preventDefault();
        this._startAfterQuestion();
      };
      silentBtn.addEventListener('click', handler);
      silentBtn.addEventListener('touchend', handler);
    }
  }

  /**
   * 提问完毕，隐藏面板，显示手势提示 + badge + 收集区
   */
  _startAfterQuestion() {
    this.userQuestion = '';
    this._questionReady = true;

    // 淡出提问面板
    const qp = document.getElementById('question-panel');
    if (qp) {
      qp.style.transition = 'opacity 0.4s ease';
      qp.style.opacity = '0';
      qp.style.pointerEvents = 'none';
      setTimeout(() => { qp.style.display = 'none'; }, 400);
    }

    // 显示手势提示
    this.els.gestureHint.classList.remove('hidden');
    this.els.gestureHint.style.display = '';
    this.els.gestureHint.style.opacity = '1';
    this.els.gestureHint.style.pointerEvents = '';

    // 显示状态标签和收集区
    this.els.stateBadge.classList.remove('hidden');
    this.els.stateBadge.style.display = '';
    this.els.stateBadge.style.opacity = '1';
    this.els.tarotCollection.classList.remove('hidden');
    this.els.tarotCollection.style.display = '';
    this.els.tarotCollection.style.opacity = '1';
    this.els.tarotCollection.style.pointerEvents = '';
  }

  async _initCamera() {
    this._setLoading('正在开启灵视之眼…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      this.els.camera.srcObject = stream;
      await new Promise(resolve => { this.els.camera.onloadedmetadata = resolve; });
      await this.els.camera.play();
      this._setLoading('塔罗牌灵已就绪');
    } catch (err) {
      console.error('摄像头初始化失败:', err);
      let detail = err.message || String(err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        detail = '已拒绝摄像头权限，请在地址栏旁点击 🔒 图标允许摄像头，然后刷新页面';
      } else if (!window.isSecureContext) {
        detail = '当前不是安全来源，请用本地服务器打开（如 http://127.0.0.1:8765），勿用 file://';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        detail = '未检测到摄像头设备';
      }
      this._showCameraError(detail);
      throw err; // 向上抛出，阻止手势引擎在无摄像头时初始化
    }
  }

  async _initGesture() {
    this._setLoading('正在加载手势模型…（首次约 8MB，请稍候）');
    await this.gestureEngine.init(this.els.camera, {
      onStatus: (msg) => this._setLoading(msg),
    });
    this.gestureEngine.onGesture = (gesture, landmarks) => {
      this._handleGesture(gesture, landmarks);
    };
    this.gestureEngine.onHandUpdate = (results) => {
      this._drawDebug(results);
    };
    this.gestureEngine.start();
    this._setLoading('牌灵已就绪，准备开始占卜');
  }

  _setLoading(text) {
    this.els.loadingStatus.textContent = text;
  }

  _hideLoading() {
    const self = this;
    this.els.loading.style.transition = 'opacity 0.5s';
    this.els.loading.style.opacity = '0';
    setTimeout(() => {
      self.els.loading.style.display = 'none';
      // 显示 app 背景（星空等）
      self.els.app.classList.remove('hidden');
      self.els.app.style.display = '';
      // 显示提问面板（它在 #app 外面，独立控制）
      const qp = document.getElementById('question-panel');
      if (qp) {
        qp.classList.remove('hidden');
        qp.style.display = '';
        qp.style.opacity = '1';
        qp.style.pointerEvents = 'auto';
      }
    }, 500);
  }

  // ===== 核心状态机 =====

  _handleGesture(gesture, landmarks) {
    switch (this.state) {

      case STATE.IDLE:
        if (gesture === GESTURE.FIST && this._questionReady) {
          this._summonCards();
        }
        break;

      case STATE.SUMMONED:
        if (gesture === GESTURE.SWIPE_CONTINUOUS) {
          // 连续滑动 — 丝滑（降低灵敏度，避免太快）
          const delta = this.gestureEngine.getSwipeDelta();
          // delta 映射到角速度 (正数向右) — 系数从150降到50
          this.carousel.addVelocity(delta * 50);
        } else if (gesture === GESTURE.OPEN_PALM && !this._cardsSpread) {
          // 张开手掌展开牌阵
          this._spreadCards();
        } else if (gesture === GESTURE.POINT && this._cardsSpread) {
          // 食指指向 — 选中当前牌（进入 FOCUSED）
          this._focusCard();
        }
        break;

      case STATE.FOCUSED:
        // 已选中一张牌，等待捏合确认
        if (gesture === GESTURE.PINCH) {
          // 捏合 — 确认选中，翻转展示
          this._holdCard();
        } else if (gesture === GESTURE.OPEN_PALM || gesture === GESTURE.SWIPE_CONTINUOUS) {
          // 张开手掌或滑动 — 取消选中，回到浏览
          this._unfocusCard();
          if (gesture === GESTURE.SWIPE_CONTINUOUS) {
            const delta2 = this.gestureEngine.getSwipeDelta();
            this.carousel.addVelocity(delta2 * 50);
          }
        }
        break;

      case STATE.HOLDING:
        // 只有拇指食指彻底松开才释放卡牌
        if (gesture === GESTURE.PINCH_RELEASE) {
          this._releaseCard();
        }
        break;

      case STATE.RELEASED:
        // 卡牌已飞入方框，必须张开手掌才能继续抽下一张
        if (gesture === GESTURE.OPEN_PALM) {
          this._continueAfterRelease();
        }
        break;

      case STATE.SELECTING:
        // 动画过渡中，不响应
        break;

      case STATE.RESULT:
        // 结果页不响应手势，仅通过鼠标按钮控制
        break;
    }
  }

  // ===== 交互动作 =====

  /**
   * 召唤卡牌：显示底盘 + 旋转木马（叠牌状态）
   * 注意：不再显示中间魔法阵
   */
  _summonCards() {
    this.state = STATE.SUMMONED;
    this._cardsSpread = false;

    // 显示3D底盘
    this.els.platform3d.classList.remove('hidden');

    // 显示旋转木马（叠放状态）
    this.els.carouselStage.classList.remove('hidden');
    this.carousel.create(); // 重新创建为叠放状态
    
    this.particles.emitSummon('#d4af37', 50);

    this._updateHint('🖐️', '张开手掌展开牌阵');
    this._updateBadge('牌堆已就绪');
  }

  /**
   * 张开手掌 — 展开牌阵
   */
  _spreadCards() {
    this._cardsSpread = true;
    this.carousel.spreadOut();
    this.particles.emitSummon('#d4af37', 30);

    const round = this.collectedCards.length + 1;
    this._updateHint('☝️', `左右滑动浏览 · ☝️ 食指选定 (第${round}/3张)`);
    this._updateBadge('感知牌阵');
  }

  /**
   * 食指选中 — 进入 FOCUSED 状态，高亮当前牌
   * 注意：已收集的牌不会出现在正面位置（由 _skipCollected 保证）
   */
  _focusCard() {
    const card = this.carousel.getCurrentCard();

    this.state = STATE.FOCUSED;
    this._focusedCard = card;

    // 旋转木马高亮选中牌
    this.carousel.setFocused(true);

    // 小粒子反馈
    this.particles.emitSummon(card.color || '#d4af37', 20);

    const round = this.collectedCards.length + 1;
    this._updateHint('🤏', `已锁定 · 捏合确认翻牌 (第${round}/3张)`);
    this._updateBadge('已选中');
  }

  /**
   * 取消选中 — 回到 SUMMONED 继续浏览
   */
  _unfocusCard() {
    this.state = STATE.SUMMONED;
    this._focusedCard = null;

    // 取消旋转木马高亮
    this.carousel.setFocused(false);

    const round = this.collectedCards.length + 1;
    this._updateHint('☝️', `左右滑动浏览 · ☝️ 食指选定 (第${round}/3张)`);
    this._updateBadge('感知牌阵');
  }

  /**
   * 捏合确认 — 进入 HOLDING 状态，展示翻转
   */
  _holdCard() {
    // 使用 FOCUSED 状态锁定的牌
    const card = this._focusedCard || this.carousel.getCurrentCard();

    this.state = STATE.HOLDING;
    this._holdingCard = card;
    this._focusedCard = null;

    // 取消旋转木马高亮
    this.carousel.setFocused(false);

    // 隐藏旋转木马
    this.els.carouselStage.classList.add('hidden');

    // 隐藏底部提示和收集区域，避免遮挡卡牌名字
    this.els.gestureHint.style.opacity = '0';
    this.els.gestureHint.style.pointerEvents = 'none';
    this.els.tarotCollection.style.opacity = '0';
    this.els.tarotCollection.style.pointerEvents = 'none';

    // 显示选中视图（先展示背面）
    this.els.selectedView.classList.remove('hidden');
    this.els.selectedFlipper.classList.remove('flipped');
    this.els.selectedCardName.classList.remove('show');
    this.els.releaseHint.style.display = 'none';

    // 翻牌展示的背面也使用随机图片
    const backImg = document.querySelector('#selected-card-back .selected-back-img');
    if (backImg) {
      const randomBack = CARD_BACK_IMAGES[Math.floor(Math.random() * CARD_BACK_IMAGES.length)];
      backImg.src = randomBack;
    }

    // 重置翻转特效
    const flipBurst = document.getElementById('flip-burst');
    const flipRing = document.getElementById('flip-ring');
    if (flipBurst) { flipBurst.classList.remove('active'); flipBurst.style.background = ''; }
    if (flipRing) flipRing.classList.remove('active');

    // 设置正面内容 — 使用图片
    this.els.selectedFront.style.borderColor = card.color;
    this.els.selectedFront.style.boxShadow = `0 0 40px ${card.color}40, 0 20px 60px rgba(0,0,0,0.8)`;
    this.els.selectedFront.innerHTML = `
      <img src="${card.image}" alt="${card.name}" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:7px;">
    `;

    this.els.selectedGlow.style.background = `radial-gradient(ellipse, ${card.color}20 0%, transparent 60%)`;
    this.els.selectedCardName.textContent = `${card.name} · ${card.nameEn}`;
    // 不再用卡牌颜色设置名字，使用 CSS 默认淡白色

    this.particles.emitSummon(card.color, 40);

    // 延迟翻转 — 先看背面0.5s，然后翻到正面 + 特效爆发
    setTimeout(() => {
      this.els.selectedFlipper.classList.add('flipped');

      // 触发翻转光芒爆发
      if (flipBurst) {
        flipBurst.style.background = `radial-gradient(circle, ${card.color}60 0%, ${card.color}20 40%, transparent 70%)`;
        flipBurst.classList.add('active');
      }
      // 触发光环扩散
      if (flipRing) {
        flipRing.style.borderColor = card.color;
        flipRing.style.boxShadow = `0 0 30px ${card.color}80`;
        flipRing.classList.add('active');
      }

      // 爆发粒子特效
      this.particles.emitSpellBurst(card.color, 60);

      // 根据卡牌元素类型播放全屏魔法特效（3-5秒）
      this.spellEffect.play(card, 4000);

      // 翻转完成后显示名字和释放提示
      setTimeout(() => {
        this.els.selectedCardName.classList.add('show');
        this.els.releaseHint.style.display = 'block';
      }, 800);
    }, 500);

    this._updateHint('🤏→🖐️', '松开手指释放卡牌');
    this._updateBadge('揭示真相');
  }

  /**
   * 松手释放 — 卡牌飞入槽位
   */
  _releaseCard() {
    if (!this._holdingCard) return;
    const card = this._holdingCard;
    const currentSlot = this.collectedCards.length + 1; // 即将收入的是第几张
    this.state = STATE.SELECTING;

    // 恢复提示和收集区显示
    this.els.gestureHint.style.opacity = '1';
    this.els.gestureHint.style.pointerEvents = '';
    this.els.tarotCollection.style.opacity = '1';
    this.els.tarotCollection.style.pointerEvents = '';

    this._updateHint('✨', `${card.name} 已记录`);
    this._updateBadge(`第${currentSlot}张已就位`);

    // 延迟一点播放收集动画
    setTimeout(() => {
      this._collectCard(card);
    }, 600);
  }

  /**
   * 收入槽位
   */
  _collectCard(card) {
    const slotIndex = this.collectedCards.length;
    this.collectedCards.push(card);

    // 更新 UI 槽位
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    slotEl.classList.add('filled');
    slotEl.querySelector('.slot-content').innerHTML = `<img src="${card.image}" alt="${card.name}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`;
    slotEl.style.borderColor = 'rgba(255, 255, 255, 0.25)';
    slotEl.style.boxShadow = `0 0 10px ${card.color}20`;

    // 隐藏选定视图
    this.els.selectedView.classList.add('hidden');
    this._holdingCard = null;

    // 检查是否抽满 3 张
    if (this.collectedCards.length >= 3) {
      // 延迟1秒让用户看到三张牌都收集完，再出解读
      setTimeout(() => this._showResult(), 1000);
    } else {
      // 进入 RELEASED 状态，等待用户张开手掌
      const remaining = 3 - this.collectedCards.length;
      this.state = STATE.RELEASED;
      this._updateHint('🖐️', `张开手掌抽取第${this.collectedCards.length + 1}张`);
      this._updateBadge(`还剩${remaining}张`);
    }
  }

  /**
   * 张开手掌后继续回到旋转木马
   */
  _continueAfterRelease() {
    this._backToCarousel();
  }

  /**
   * 显示占卜结果
   */
  _showResult() {
    this.state = STATE.RESULT;
    this.els.platform3d.classList.add('hidden');
    this.els.carouselStage.classList.add('hidden');

    // 隐藏手势提示和顶部收集区（结果页有自己的展示）
    this.els.gestureHint.style.opacity = '0';
    this.els.gestureHint.style.pointerEvents = 'none';
    this.els.tarotCollection.style.opacity = '0';
    this.els.tarotCollection.style.pointerEvents = 'none';
    this.els.stateBadge.style.opacity = '0';

    // 使用解读引擎生成完整解读
    const reading = generateReading(this.collectedCards);

    // 渲染三张牌居中大图（方便截图）
    this.els.resultShowcase.innerHTML = '';
    if (this.userQuestion) {
      this.els.resultShowcase.innerHTML += `<div class="showcase-question">「${this.userQuestion}」</div>`;
    }
    const showcaseRow = document.createElement('div');
    showcaseRow.className = 'showcase-row';
    const posLabels = ['过去', '现在', '未来'];
    this.collectedCards.forEach((card, i) => {
      showcaseRow.innerHTML += `
        <div class="showcase-card" style="animation-delay: ${i * 0.2}s">
          <div class="showcase-label">${posLabels[i]}</div>
          <img src="${card.image}" alt="${card.name}">
          <div class="showcase-name">${card.name}</div>
        </div>
      `;
    });
    this.els.resultShowcase.appendChild(showcaseRow);

    // 渲染三张牌 + 单牌解读
    // 隐藏掉原本的解读项与建议赋值逻辑，不再渲染
    // this.els.resultCards.innerHTML = '';
    // reading.cardReadings.forEach((cr, i) => {...});

    // 综合解读（合并了整体流动 + 元素共鸣）
    const insightEl = document.getElementById('result-insight-text');
    // insight 包含两段，用 \n\n 分隔，转为 <p> 标签
    insightEl.innerHTML = reading.insight.split('\n\n').map(p => `<p>${p}</p>`).join('');

    // 行动建议
    const adviceList = document.getElementById('result-advice-list');
    adviceList.innerHTML = '';
    reading.actionAdvice.forEach(advice => {
      adviceList.innerHTML += `<div class="advice-item"><span class="advice-bullet">·</span>${advice}</div>`;
    });

    // 智慧提示
    document.getElementById('result-wisdom-text').textContent = reading.wisdom;

    this.els.resultView.classList.remove('hidden');

    // 大粒子特效
    this.particles.emitSpellBurst('#d4af37', 150);
  }

  /**
   * 回到旋转木马继续抽牌
   */
  _backToCarousel() {
    this.state = STATE.SUMMONED;
    this._cardsSpread = true; // 回来时已展开
    this.els.carouselStage.classList.remove('hidden');

    // 自动跳过已收集的牌，确保正面位置不是已抽过的牌
    this._skipCollected();

    const round = this.collectedCards.length + 1;
    this._updateHint('☝️', `左右滑动浏览 · ☝️ 食指选定 (第${round}/3张)`);
    this._updateBadge('感知牌阵');

    this.carousel.playEnterAnimation();
  }

  /**
   * 自动跳过已收集的牌 — 如果当前正面是已抽过的牌，旋转到下一张未抽过的牌
   */
  _skipCollected() {
    const collectedIds = new Set(this.collectedCards.map(c => c.id));
    if (collectedIds.size === 0) return;

    let card = this.carousel.getCurrentCard();
    let attempts = 0;

    // 最多尝试总牌数次，避免死循环
    while (collectedIds.has(card.id) && attempts < CARDS.length) {
      this.carousel.rotateTo(this.carousel.getCurrentIndex() + 1, false);
      card = this.carousel.getCurrentCard();
      attempts++;
    }
  }

  /**
   * 收回全部，回到 IDLE
   */
  _resetAll() {
    this.state = STATE.IDLE;
    this.collectedCards = [];
    this._holdingCard = null;
    this._focusedCard = null;
    this._cardsSpread = false;
    this._questionReady = false;
    this.userQuestion = '';

    // 清空槽位UI
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      slotEl.classList.remove('filled');
      slotEl.querySelector('.slot-content').innerHTML = '';
      slotEl.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      slotEl.style.boxShadow = 'none';
    }

    // 不再操作中间魔法阵
    this.els.platform3d.classList.add('hidden');
    this.els.carouselStage.classList.add('hidden');
    this.els.resultView.classList.add('hidden');
    this.els.selectedView.classList.add('hidden');

    // 恢复所有 UI 元素显示
    this.els.gestureHint.style.opacity = '1';
    this.els.gestureHint.style.pointerEvents = '';
    this.els.gestureHint.classList.add('hidden');
    this.els.tarotCollection.style.opacity = '1';
    this.els.tarotCollection.style.pointerEvents = '';
    this.els.tarotCollection.classList.add('hidden');
    this.els.stateBadge.style.opacity = '1';
    this.els.stateBadge.classList.add('hidden');

    // 重新显示提问面板
    const qp = document.getElementById('question-panel');
    if (qp) {
      qp.style.display = '';
      qp.style.opacity = '1';
      qp.style.pointerEvents = 'auto';
      qp.classList.remove('hidden');
    }

    this._updateHint('✊', '握拳开始仪式');
    this._updateBadge('塔罗占卜');
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

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
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
          ctx.fillStyle = [4, 8].includes(i) ? '#ff6baf' : '#00e5ff';
          ctx.fill();
        }
      }
    }
  }
}
