/* ===== 配置 ===== */
const CARD_IMAGES = [
  '小樱卡片/1774582442715.png','小樱卡片/1774582448138.png','小樱卡片/1774582452433.png',
  '小樱卡片/1774582457953.png','小樱卡片/1774582462348.png','小樱卡片/1774582466893.png',
  '小樱卡片/1774582472949.png','小樱卡片/1774582477793.png',
];
const CARD_BACKS = ['小樱卡片/背面1.jpeg','小樱卡片/背面2.jpeg'];
const CARD_NAMES = ['风','水','火','光','影','花','雷','时'];
const NUM_CARDS = 8;
const ST = { IDLE:'idle', STACKED:'stacked', SPREAD:'spread', FLIPPED:'flipped' };

/* ===== 星空 ===== */
function initStars() {
  const c = document.getElementById('starfield'), x = c.getContext('2d');
  let stars = [];
  function resize() {
    c.width = innerWidth; c.height = innerHeight;
    stars = [];
    for (let i = 0; i < 300; i++)
      stars.push({ x: Math.random()*c.width, y: Math.random()*c.height, r: Math.random()*1.2+.2, a: Math.random()*.7+.2, sp: Math.random()*.01+.003, ph: Math.random()*6.28 });
  }
  resize(); addEventListener('resize', resize);
  (function loop() {
    x.clearRect(0, 0, c.width, c.height);
    const bg = x.createRadialGradient(c.width*.5, c.height*.4, 0, c.width*.5, c.height*.4, c.width*.8);
    bg.addColorStop(0, '#110e28'); bg.addColorStop(.5, '#0a0818'); bg.addColorStop(1, '#050410');
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    const gl = x.createRadialGradient(c.width*.5, c.height*.75, 0, c.width*.5, c.height*.75, c.width*.4);
    gl.addColorStop(0, 'rgba(180,140,20,0.06)'); gl.addColorStop(1, 'transparent');
    x.fillStyle = gl; x.fillRect(0, 0, c.width, c.height);
    const t = Date.now() * .001;
    for (const s of stars) {
      const tw = Math.sin(t * s.sp * 60 + s.ph) * .3 + .7;
      x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.28);
      x.fillStyle = `rgba(220,210,255,${s.a*tw})`; x.fill();
    }
    requestAnimationFrame(loop);
  })();
}

/* ===== 刻度 ===== */
function genTicks() {
  const g = document.getElementById('tick-marks'); if (!g) return;
  for (let i = 0; i < 72; i++) {
    const a = (i/72)*6.28 - 1.5708, big = i%6===0, len = big?12:5, r = 270;
    const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('x1', 300+Math.cos(a)*(r-len)); ln.setAttribute('y1', 300+Math.sin(a)*(r-len));
    ln.setAttribute('x2', 300+Math.cos(a)*r); ln.setAttribute('y2', 300+Math.sin(a)*r);
    ln.setAttribute('stroke', `rgba(212,160,23,${big?.5:.25})`);
    ln.setAttribute('stroke-width', big?'1.5':'0.8');
    g.appendChild(ln);
  }
}

/* ===== 金色粒子（精简） ===== */
function initParticles() {
  const c = document.getElementById('particles'), x = c.getContext('2d');
  let ps = [];
  function resize() { c.width = innerWidth; c.height = innerHeight; }
  resize(); addEventListener('resize', resize);
  (function loop() {
    x.clearRect(0, 0, c.width, c.height);
    if (ps.length < 50 && Math.random() < .25)
      ps.push({ x: Math.random()*c.width, y: c.height+5, vy: -.4-Math.random()*1.2, s: Math.random()*2+.5, life: 1, d: .003+Math.random()*.004 });
    ps = ps.filter(p => {
      p.y += p.vy; p.life -= p.d;
      if (p.life <= 0) return false;
      x.beginPath(); x.arc(p.x, p.y, p.s*p.life, 0, 6.28);
      x.fillStyle = `rgba(212,170,40,${p.life*.5})`; x.fill();
      return true;
    });
    requestAnimationFrame(loop);
  })();
}

/* ===== 星尘系统 ===== */
class Stardust {
  constructor() {
    this.c = document.getElementById('stardust');
    this.x = this.c.getContext('2d');
    this.ps = [];
    this._resize(); addEventListener('resize', () => this._resize());
    this._loop();
  }
  _resize() { this.c.width = innerWidth; this.c.height = innerHeight; }
  burst(cx, cy, n = 20) {
    const cols = ['#ffd700','#ff6b9d','#ffb3d1','#fff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random()*6.28, sp = 1+Math.random()*3;
      this.ps.push({ x:cx, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1, s:Math.random()*2.5+1, life:1, d:.015+Math.random()*.02, col:cols[i%cols.length] });
    }
  }
  fullBurst(n = 40) {
    const cx = this.c.width/2, cy = this.c.height/2;
    for (let i = 0; i < n; i++) {
      const a = Math.random()*6.28, d = Math.random()*150;
      this.burst(cx+Math.cos(a)*d, cy+Math.sin(a)*d, 2);
    }
  }
  _loop() {
    this.x.clearRect(0, 0, this.c.width, this.c.height);
    this.ps = this.ps.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .04; p.life -= p.d;
      if (p.life <= 0) return false;
      this.x.globalAlpha = p.life;
      this.x.beginPath(); this.x.arc(p.x, p.y, p.s*p.life, 0, 6.28);
      this.x.fillStyle = p.col; this.x.fill();
      this.x.globalAlpha = 1;
      return true;
    });
    requestAnimationFrame(() => this._loop());
  }
}

/* ===== 卡牌3D圆环 ===== */
class CardRing {
  constructor(sd) {
    this.ring = document.getElementById('ring');
    this.container = document.getElementById('card-ring-container');
    this.sd = sd;
    this.cards = [];
    this.state = ST.IDLE;
    this.allFlipped = false;
    this._recalling = false;
    this.spinAngle = 0;
    this.autoSpin = false;
    this.autoSpeed = 0.12;
    this._lastPalmX = undefined;
    this._momentum = 0;
    this._dragMoved = false;
    this._selectedIdx = -1;

    this._setupTouch();
  }

  _getRadius() {
    // 魔法阵 CSS 宽度 → 圆周半径
    // 魔法阵 SVG viewBox=600, 外圈 r=290 (96.7%)
    // CSS: width = min(92vw, 520px)
    // 实际外圈半径 = CSS宽度/2 * (290/300) ≈ CSS宽度/2 * 0.967
    const circleW = Math.min(innerWidth * 0.92, 520);
    const magicR = circleW / 2 * 0.95; // 卡牌站在魔法阵最外圈上
    const w = innerWidth;
    if (w <= 480) return Math.min(magicR, 160);
    if (w <= 768) return Math.min(magicR, 210);
    return Math.min(magicR, 250);
  }

  /**
   * 魔法阵局部坐标（#card-ring-container 在 #magic-circle-wrap 内，与 SVG 共面）：
   * - XY：阵面；Z：过圆心的法线
   * - 卡牌圆周在 XY 上，牌面与阵面垂直（rotateX(-90deg)）
   * - 整圈公转由 #ring 的 rotateZ(spinAngle) 完成（绕法线）
   */
  _cardTransform(baseAngle, radius) {
    const rad = baseAngle * Math.PI / 180;
    const x = Math.sin(rad) * radius;
    const y = -Math.cos(rad) * radius;
    return `translate3d(${x}px, ${y}px, 0) rotateZ(${baseAngle}deg) rotateX(-90deg)`;
  }

  create() {
    this.ring.innerHTML = '';
    this.cards = [];
    const radius = this._getRadius();
    
    for (let i = 0; i < NUM_CARDS; i++) {
      const angle = (360 / NUM_CARDS) * i;
      const bk = CARD_BACKS[i % CARD_BACKS.length];
      
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.index = i;
      
      // 竖立在圆周上
      el.style.transform = this._cardTransform(angle, radius);
      el.dataset.angle = angle;
      
      el.innerHTML = `
        <div class="card-inner">
          <div class="face face-front"><img src="${CARD_IMAGES[i]}" loading="lazy"></div>
          <div class="face face-back"><img src="${bk}" loading="lazy"></div>
        </div>
        <div class="card-name">${CARD_NAMES[i] || '卡牌'+(i+1)}</div>`;
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._dragMoved) return;
        this._onTap(i);
      });
      
      this.ring.appendChild(el);
      this.cards.push({ el, angle, bk, radius });
    }
    
    this._dragMoved = false;
    this._updateAllCards();
    this._loop();
    addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    const radius = this._getRadius();
    this.cards.forEach(c => {
      c.radius = radius;
    });
    this._updateAllCards();
  }

  /**
   * 更新每张卡在阵面上的方位；公转角速度写在 #ring 的 rotateZ(spinAngle)
   */
  _updateAllCards() {
    const radius = this._getRadius();
    this.cards.forEach((c) => {
      if (c.el.style.getPropertyValue('--collapsed') === '1') return;
      c.el.style.transform = this._cardTransform(c.angle, radius);
    });
    if (this.ring) {
      this.ring.style.transform = `rotateZ(${this.spinAngle}deg)`;
    }
  }

  /* 触摸/鼠标滑动旋转 + 点击检测（重写） */
  _setupTouch() {
    const scene = document.getElementById('scene');
    
    let pointerDown = false;
    let startX = 0, startAngle = 0;
    let totalDragDist = 0;
    let lastMomentum = 0;
    
    const onDown = (clientX) => {
      if (this.state !== ST.SPREAD && this.state !== ST.FLIPPED) return;
      pointerDown = true;
      startX = clientX;
      startAngle = this.spinAngle;
      totalDragDist = 0;
      lastMomentum = 0;
      this._dragMoved = false;
      this.autoSpin = false;
    };
    
    const onMove = (clientX) => {
      if (!pointerDown) return;
      const dx = clientX - startX;
      totalDragDist = Math.abs(dx);
      
      // 超过8px认为是拖动
      if (totalDragDist > 8) {
        this._dragMoved = true;
      }
      
      const newAngle = startAngle + dx * 0.4;
      lastMomentum = (newAngle - this.spinAngle);
      this.spinAngle = newAngle;
      this._updateSpin();
    };
    
    const onUp = (clientX, clientY) => {
      if (!pointerDown) return;
      pointerDown = false;
      
      if (this._dragMoved) {
        // 滑动结束 → 惯性
        this._momentum = lastMomentum;
        this._inertia();
      }
      // 如果没有dragMoved，卡牌上的click事件会自动触发翻转
    };
    
    // === Touch ===
    scene.addEventListener('touchstart', e => {
      onDown(e.touches[0].clientX);
    }, { passive: true });

    scene.addEventListener('touchmove', e => {
      onMove(e.touches[0].clientX);
    }, { passive: true });

    scene.addEventListener('touchend', e => {
      const ct = e.changedTouches[0];
      onUp(ct.clientX, ct.clientY);
    }, { passive: true });

    // === Mouse ===
    scene.addEventListener('mousedown', e => {
      onDown(e.clientX);
    });
    addEventListener('mousemove', e => {
      onMove(e.clientX);
    });
    addEventListener('mouseup', e => {
      onUp(e.clientX, e.clientY);
    });
  }

  /* 惯性衰减 */
  _inertia() {
    const decay = () => {
      if (Math.abs(this._momentum) < 0.05) {
        if (this.state === ST.SPREAD || this.state === ST.FLIPPED) {
          this.autoSpin = true;
        }
        return;
      }
      this._momentum *= 0.92;
      this.spinAngle += this._momentum;
      this._updateSpin();
      requestAnimationFrame(decay);
    };
    requestAnimationFrame(decay);
  }

  _updateSpin() {
    this._updateAllCards();
  }

  /* 点击卡牌 */
  _onTap(i) {
    if (this.state !== ST.SPREAD && this.state !== ST.FLIPPED) return;
    const c = this.cards[i];
    if (!c.el.classList.contains('flipped')) {
      // 关键：清除inline transform，让CSS class的transition生效
      c.el.querySelector('.card-inner').style.transform = '';
      c.el.classList.add('flipped', 'flip-anim');
      const r = c.el.getBoundingClientRect();
      this.sd.burst(r.left + r.width/2, r.top + r.height/2, 15);
      if (navigator.vibrate) navigator.vibrate([30, 20, 60]);
      setTimeout(() => c.el.classList.remove('flip-anim'), 800);
    } else {
      this._showDetail(i);
    }
  }

  _showDetail(i) {
    const d = document.getElementById('detail');
    const img = document.getElementById('det-img');
    const nm = document.getElementById('det-name');
    img.innerHTML = `<img src="${CARD_IMAGES[i]}">`;
    nm.textContent = CARD_NAMES[i] || '卡牌'+(i+1);
    d.classList.add('show');
    d.onclick = e => {
      if (e.target === d || e.target.classList.contains('detail-hint')) {
        d.classList.remove('show');
      }
    };
  }

  /* 食指选中卡牌（手势） */
  selectByPoint(screenX, screenY) {
    if (this.state !== ST.SPREAD && this.state !== ST.FLIPPED) return;
    
    let closest = -1, minDist = Infinity;
    this.cards.forEach((c, i) => {
      const rect = c.el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // 隐藏的卡牌跳过
      const cardCx = rect.left + rect.width / 2;
      const cardCy = rect.top + rect.height / 2;
      const dist = Math.sqrt((screenX - cardCx) ** 2 + (screenY - cardCy) ** 2);
      // 大幅增加命中范围：1.8倍卡牌对角线
      const hitThreshold = Math.sqrt(rect.width ** 2 + rect.height ** 2) * 1.8;
      if (dist < hitThreshold && dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    
    // 只有选中的卡发生变化时才更新DOM
    if (closest !== this._selectedIdx) {
      // 取消上一个选中
      if (this._selectedIdx >= 0 && this._selectedIdx < this.cards.length) {
        this.cards[this._selectedIdx].el.classList.remove('selected');
      }
      if (closest >= 0) {
        this.cards[closest].el.classList.add('selected');
      }
      this._selectedIdx = closest;
    }
  }

  /* 食指选中后确认翻转 */
  confirmSelect() {
    if (this._selectedIdx >= 0 && this._selectedIdx < this.cards.length) {
      this._onTap(this._selectedIdx);
      this.cards[this._selectedIdx].el.classList.remove('selected');
      this._selectedIdx = -1;
    }
  }

  clearSelect() {
    if (this._selectedIdx >= 0 && this._selectedIdx < this.cards.length) {
      this.cards[this._selectedIdx].el.classList.remove('selected');
    }
    this._selectedIdx = -1;
  }

  /* 召唤：卡牌堆叠出现 */
  summon() {
    if (this.state !== ST.IDLE) return;
    this.state = ST.STACKED;
    this.allFlipped = false;
    this.spinAngle = 0;
    this._updateSpin();

    document.getElementById('magic-circle-wrap').classList.add('show');
    const b = document.getElementById('burst');
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');

    // 卡牌堆在中心
    this.cards.forEach((c, i) => {
      c.el.classList.remove('flipped','show','flip-anim','selected');
      c.el.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
      c.el.style.transform = 'translate3d(0, 0, 0) rotateZ(0deg) rotateX(-90deg)';
      c.el.style.setProperty('--collapsed', '1');
      setTimeout(() => {
        c.el.classList.add('show');
      }, i * 50);
    });
  }

  /* 展开：散开成3D圆环 */
  spread() {
    if (this.state !== ST.STACKED && this.state !== ST.FLIPPED) return;
    this.state = ST.SPREAD;
    this.autoSpin = true;

    if (this.allFlipped) {
      this.cards.forEach(c => {
        c.el.classList.remove('flipped','flip-anim');
        c.el.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
      });
      this.allFlipped = false;
    }

    const radius = this._getRadius();
    this.cards.forEach((c, i) => {
      c.el.classList.add('entering');
      setTimeout(() => {
        c.el.style.removeProperty('--collapsed');
        c.el.style.transform = this._cardTransform(c.angle, radius);
      }, i * 40);
      setTimeout(() => {
        c.el.classList.remove('entering');
      }, 900);
    });
  }

  /* 全部翻转 */
  flipAll() {
    if (this.state !== ST.SPREAD) return;
    this.state = ST.FLIPPED;
    this.allFlipped = true;
    this.sd.fullBurst(40);

    this.cards.forEach((c, i) => {
      setTimeout(() => {
        c.el.querySelector('.card-inner').style.transform = '';
        c.el.classList.add('flipped', 'flip-anim');
        const r = c.el.getBoundingClientRect();
        this.sd.burst(r.left + r.width/2, r.top + r.height/2, 10);
        setTimeout(() => c.el.classList.remove('flip-anim'), 800);
      }, i * 80);
    });
    if (navigator.vibrate) setTimeout(() => navigator.vibrate([50, 30, 100]), 300);
  }

  /* 收回 */
  recall() {
    if (this.state === ST.IDLE || this._recalling) return;
    this._recalling = true;
    this.autoSpin = false;
    this.clearSelect();
    document.getElementById('detail').classList.remove('show');

    this.cards.forEach(c => {
      c.el.classList.add('entering');
      c.el.style.transform = 'translate3d(0, 0, 0) rotateZ(0deg) rotateX(-90deg)';
    });

    setTimeout(() => {
      this.cards.forEach((c, i) => {
        setTimeout(() => {
          c.el.classList.remove('show','entering','flipped','flip-anim','selected');
          c.el.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
        }, i * 30);
      });
      setTimeout(() => {
        this.state = ST.IDLE;
        this.allFlipped = false;
        this.spinAngle = 0;
        this._updateSpin();
        this._recalling = false;
        document.getElementById('magic-circle-wrap').classList.remove('show');
      }, NUM_CARDS * 30 + 400);
    }, 600);
  }

  /* 手势控制旋转 */
  setPalmX(px) {
    if (this.state !== ST.SPREAD && this.state !== ST.FLIPPED) return;
    if (this._lastPalmX !== undefined) {
      this.spinAngle += (px - this._lastPalmX) * 400;
      this._updateSpin();
    }
    this._lastPalmX = px;
  }
  clearPalmTracking() { this._lastPalmX = undefined; }

  /* 主循环 - 只处理自动旋转 */
  _loop() {
    const run = () => {
      if (this.autoSpin && (this.state === ST.SPREAD || this.state === ST.FLIPPED)) {
        this.spinAngle += this.autoSpeed;
        this._updateSpin();
      }
      requestAnimationFrame(run);
    };
    run();
  }
}

/* ===== 手势引擎 v2（移植自塔罗牌成熟方案） ===== */
const G = {
  NONE: 'none',
  FIST: 'fist',
  PALM: 'open_palm',
  POINT: 'point',
  VICTORY: 'victory',  // ✌️ 食指+中指 → 翻转全部卡牌
  SWIPE_CONTINUOUS: 'swipe_continuous',  // 连续滑动（带速度）
};

class GestureEngine {
  constructor() {
    this.hl = null;
    this.video = null;
    this.running = false;
    this.mirrored = true;

    // 回调
    this.onGesture = null;      // (gesture, hand) => void
    this.onPalmMove = null;     // (palmX, palmY) => void
    this.onPointMove = null;    // (screenX, screenY) => void
    this.onHandUpdate = null;   // (results) => void

    // 手势历史 & 状态
    this.lastG = G.NONE;
    this.palmHistory = [];
    
    // 连续滑动参数（从塔罗牌移植）
    this.lastPalmX = null;
    this._lastSwipeDelta = 0;

    // 防抖冷却
    this.cooldowns = {};
    this.COOLDOWN_MS = 600;

    // FPS
    this.fc = 0; this.lt = 0; this.fps = 0;
    
    // 调试
    this.dbg = { g:G.NONE, hands:0, cp:0, confidence:0 };
  }

  async init(v) {
    this.video = v;
    const { HandLandmarker:HL, FilesetResolver:FR } = window;
    const wp = window._wasmBasePath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
    const vs = await FR.forVisionTasks(wp);
    this.hl = await HL.createFromOptions(vs, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    return true;
  }

  start() { this.running = true; this.lt = performance.now(); this._detect(); }
  stop() { this.running = false; }

  /**
   * 获取最近一帧的连续滑动 delta 值
   */
  getSwipeDelta() {
    const d = this._lastSwipeDelta || 0;
    this._lastSwipeDelta = 0;
    return d;
  }

  _detect() {
    if (!this.running) return;
    const now = performance.now();

    // FPS
    this.fc++;
    if (now - this.lt >= 1000) { this.fps = this.fc; this.fc = 0; this.lt = now; }

    if (this.video.readyState >= 2) {
      const results = this.hl.detectForVideo(this.video, now);
      this.dbg.hands = results.landmarks?.length || 0;

      if (results.landmarks && results.landmarks.length > 0) {
        const hand = results.landmarks[0];
        const handedness = results.handednesses?.[0]?.[0];
        this.dbg.confidence = handedness ? (handedness.score * 100).toFixed(0) : 0;

        const gesture = this._analyzeGesture(hand, now);
        this.dbg.g = gesture;

        // === 回调分发 ===
        
        // 张开手掌 → 连续滑动：每帧传递，不走冷却
        if (gesture === G.SWIPE_CONTINUOUS) {
          if (this.onGesture) this.onGesture(gesture, hand);
        }
        // 张开手掌（静止不动）：首次触发 + 持续传掌心坐标
        else if (gesture === G.PALM) {
          if (this.onPalmMove) {
            const px = this.mirrored ? (1 - hand[9].x) : hand[9].x;
            this.onPalmMove(px, hand[9].y);
          }
          // 首次张开时触发一次（用于展开等操作）
          if (this.lastG !== G.PALM && this.lastG !== G.SWIPE_CONTINUOUS) {
            if (this.onGesture) this.onGesture(gesture, hand);
          }
        }
        // 食指指向：持续传坐标，首次触发手势
        else if (gesture === G.POINT) {
          if (this.onPointMove) {
            const tipX = this.mirrored ? (1 - hand[8].x) : hand[8].x;
            const tipY = hand[8].y;
            this.onPointMove(tipX * innerWidth, tipY * innerHeight);
          }
          if (this.lastG !== G.POINT) {
            if (this.onGesture) this.onGesture(gesture, hand);
          }
        }
        // 握拳、✌️等：走冷却
        else if (gesture !== G.NONE) {
          if (this.onGesture && this._checkCooldown(gesture, now)) {
            this.onGesture(gesture, hand);
          }
        }

        this.lastG = gesture;
      } else {
        // 手消失 — 清理所有状态
        this.dbg.g = G.NONE;
        this.dbg.confidence = 0;
        this.lastG = G.NONE;
        this.palmHistory = [];
        this.lastPalmX = null;
      }

      if (this.onHandUpdate) this.onHandUpdate(results);
    }

    requestAnimationFrame(() => this._detect());
  }

  /**
   * 手势分析（改进版：✌️替代画圆）
   */
  _analyzeGesture(hand, now) {
    const fingers = this._getFingerStates(hand);
    const { thumb, index, middle, ring, pinky } = fingers;

    // === 握拳 ===
    if (!thumb && !index && !middle && !ring && !pinky) {
      this.palmHistory = [];
      this.lastPalmX = null;
      return G.FIST;
    }

    // === ✌️ 剪刀手（食指+中指伸出，无名指和小指收起）→ 翻转 ===
    if (index && middle && !ring && !pinky) {
      this.palmHistory = [];
      this.lastPalmX = null;
      return G.VICTORY;
    }

    // === 食指指向（只有食指伸出）===
    if (index && !middle && !ring && !pinky) {
      this.palmHistory = [];
      this.lastPalmX = null;
      return G.POINT;
    }

    // === 张开手掌 — 检测连续滑动 ===
    if (index && middle && ring && pinky) {
      
      const palmCenter = hand[9];
      const currentX = palmCenter.x;

      // 连续滑动检测（与塔罗牌一致）
      if (this.lastPalmX !== null) {
        const deltaX = currentX - this.lastPalmX;
        
        // 有明显移动才触发连续滑动
        if (Math.abs(deltaX) > 0.003) {
          this.lastPalmX = currentX;
          this._lastSwipeDelta = this.mirrored ? -deltaX : deltaX;

          this.palmHistory.push({ x: palmCenter.x, y: palmCenter.y, time: now });
          this.palmHistory = this.palmHistory.filter(p => now - p.time < 600);

          return G.SWIPE_CONTINUOUS;
        }
      }

      this.lastPalmX = currentX;

      this.palmHistory.push({ x: palmCenter.x, y: palmCenter.y, time: now });
      this.palmHistory = this.palmHistory.filter(p => now - p.time < 600);

      return G.PALM;
    }

    // 其他手型
    this.lastPalmX = null;
    return G.NONE;
  }

  _getFingerStates(hand) {
    const wrist = hand[0];
    return {
      thumb: Math.abs(hand[4].x - wrist.x) > Math.abs(hand[3].x - wrist.x),
      index: hand[8].y < hand[6].y,
      middle: hand[12].y < hand[10].y,
      ring: hand[16].y < hand[14].y,
      pinky: hand[20].y < hand[18].y,
    };
  }

  _checkCooldown(gesture, now) {
    const lastTime = this.cooldowns[gesture] || 0;
    if (now - lastTime < this.COOLDOWN_MS) return false;
    this.cooldowns[gesture] = now;
    return true;
  }
}

/* ===== CDN ===== */
const CDN = ['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs','https://unpkg.com/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs'];
const WASM = ['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm','https://unpkg.com/@mediapipe/tasks-vision@0.10.18/wasm'];

/* ===== 启动 ===== */
document.addEventListener('DOMContentLoaded', () => {
  initStars(); genTicks(); initParticles();
  const sd = new Stardust(), ring = new CardRing(sd);
  ring.create();

  const hEl = document.getElementById('hint'), hI = document.getElementById('hint-icon'), hT = document.getElementById('hint-text');
  const bEl = document.getElementById('badge');
  let gEnabled = false, ge = null;

  const uH = (i,t) => { hI.textContent=i; hT.textContent=t; };
  const uB = t => { bEl.textContent=t; };
  const showUI = () => { hEl.classList.add('show'); bEl.classList.add('show'); };

  // 食指指向计时器（悬停1秒自动翻转）
  // 食指指向计时器
  let pointTimer = null;
  // 连续滑动速度映射
  let swipeVelocity = 0;

  /** 召唤(summon) 与 回收(recall) 两次生效之间至少间隔（毫秒） */
  const SUMMON_RECALL_GAP_MS = 5000;
  let lastSummonRecallAt = 0;

  function summonRecallReady() {
    if (lastSummonRecallAt === 0) return true;
    return Date.now() - lastSummonRecallAt >= SUMMON_RECALL_GAP_MS;
  }

  function summonRecallRemainSec() {
    if (lastSummonRecallAt === 0) return 0;
    const left = SUMMON_RECALL_GAP_MS - (Date.now() - lastSummonRecallAt);
    return left > 0 ? Math.ceil(left / 1000) : 0;
  }

  async function loadMP() {
    for (let i = 0; i < CDN.length; i++) {
      try {
        uH('⏳', `加载手势模型…(${i+1}/${CDN.length})`);
        const m = await Promise.race([import(CDN[i]), new Promise((_,rj) => setTimeout(() => rj(new Error('超时')), 15000))]);
        window._wasmBasePath = WASM[i]; return m;
      } catch(e) { console.warn('CDN失败:', e); if (i<CDN.length-1) { uH('⏳','切换备用源…'); await new Promise(r=>setTimeout(r,500)); } }
    }
    throw new Error('手势模型加载失败');
  }

  async function enableGesture() {
    if (gEnabled) return;
    showUI(); uH('⏳','初始化…'); uB('初始化中');
    try {
      uH('📷','请求摄像头…');
      const v = document.getElementById('gcam');
      v.srcObject = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}, audio:false });
      await new Promise(r => { v.onloadedmetadata = r; }); await v.play();
      uH('⏳','加载手势模型…');
      const { FilesetResolver:FR, HandLandmarker:HL } = await loadMP();
      window.FilesetResolver = FR; window.HandLandmarker = HL;
      ge = new GestureEngine(); await ge.init(v);
      ge.onGesture = (g, hand) => handleG(g, hand);
      ge.onPalmMove = (px) => {
        // 张开手掌时传递掌心坐标（用于简单旋转控制）
        ring.setPalmX(px);
      };
      ge.onPointMove = (sx, sy) => {
        // 食指指向时高亮最近的卡牌
        ring.selectByPoint(sx, sy);
      };
      ge.onHandUpdate = r => { drawDbg(r); };
      ge.start(); gEnabled = true;
      uH('✊','✊ 握拳召唤卡牌'); uB('手势就绪');
      document.getElementById('btn-start').classList.add('hide');
    } catch(e) {
      console.error(e); uH('⚠️','失败: '+e.message); uB('失败');
    }
  }

  let pointHoldStart = 0;
  function handleG(g, hand) {
    console.log('[手势]', g, '状态:', ring.state, '收回中:', ring._recalling);
    switch(g) {
      case G.FIST:
        ring.clearSelect();
        if (ring.state === ST.IDLE && !ring._recalling) {
          if (!summonRecallReady()) {
            const s = summonRecallRemainSec();
            uH('⏳', `距上次召唤/回收需间隔 ≥5 秒，约 ${s} 秒后可再试`);
            uB('冷却中');
            break;
          }
          lastSummonRecallAt = Date.now();
          ring.summon(); ring.clearPalmTracking();
          uH('✊','卡牌已召唤！✋ 张开手展开'); uB('召唤成功');
        } else if (ring.state === ST.SPREAD || ring.state === ST.FLIPPED) {
          if (!ring._recalling) {
            if (!summonRecallReady()) {
              const s = summonRecallRemainSec();
              uH('⏳', `距上次召唤/回收需间隔 ≥5 秒，约 ${s} 秒后可再试`);
              uB('冷却中');
              break;
            }
            lastSummonRecallAt = Date.now();
            ring.recall(); ring.clearPalmTracking();
            uH('✊','收回中…'); uB('收回');
            setTimeout(() => { if (ring.state===ST.IDLE) { uH('✊','✊ 握拳召唤'); uB('待命'); } }, 1500);
          }
        } else if (ring.state === ST.STACKED) {
          // 堆叠状态握拳 → 展开
          ring.spread(); uH('✋','滑动旋转 · ☝️选卡 · ✌️翻转'); uB('展开');
        }
        break;
        
      case G.SWIPE_CONTINUOUS:
        // 连续滑动 — 丝滑旋转
        if (ring.state === ST.SPREAD || ring.state === ST.FLIPPED) {
          const delta = ge.getSwipeDelta();
          ring.autoSpin = false;
          ring.spinAngle += delta * 180;
          ring._updateSpin();
          uH('✋','滑动旋转中'); uB('浏览中');
        } else if (ring.state === ST.STACKED) {
          ring.spread(); uH('✋','滑动旋转 · ☝️选卡 · ✌️翻转'); uB('展开');
        }
        break;
        
      case G.PALM:
        ring.clearSelect();
        if (ring.state === ST.STACKED) {
          ring.spread(); uH('✋','滑动旋转 · ☝️选卡 · ✌️翻转'); uB('展开');
        } else if (ring.state === ST.SPREAD || ring.state === ST.FLIPPED) {
          uH('✋','滑动旋转'); uB('浏览中');
        } else if (ring.state === ST.IDLE) {
          uH('✊','先 ✊ 握拳召唤'); uB('待命');
        }
        break;
        
      case G.POINT:
        if (ring.state === ST.SPREAD || ring.state === ST.FLIPPED) {
          if (pointHoldStart === 0) pointHoldStart = Date.now();
          if (pointTimer) clearTimeout(pointTimer);
          pointTimer = setTimeout(() => {
            ring.confirmSelect();
            pointHoldStart = 0;
          }, 800);
          uH('☝️','指向卡牌悬停选中'); uB('选卡');
        }
        break;
        
      case G.VICTORY:
        // ✌️ = 翻转食指选中的那张卡
        if (ring.state === ST.SPREAD || ring.state === ST.FLIPPED) {
          if (ring._selectedIdx >= 0) {
            ring.confirmSelect();
            uH('✌️','翻转！'); uB('已翻转');
          } else {
            uH('✌️','先 ☝️ 指向一张卡'); uB('请选卡');
          }
        }
        break;
    }
    // 非POINT手势时清除计时（但✌️不清除选中，因为需要翻转选中的卡）
    if (g !== G.POINT) {
      pointHoldStart = 0;
      if (pointTimer) { clearTimeout(pointTimer); pointTimer = null; }
    }
    // 非POINT且非VICTORY时才清除选中高亮
    if (g !== G.POINT && g !== G.VICTORY) {
      // ring.clearSelect() 已在各case中按需调用
    }
    const ds = document.getElementById('d-s'); if(ds) ds.textContent = ring.state;
  }

  setInterval(() => {
    if (ge && ge.dbg.hands===0) {
      ring.clearPalmTracking();
      ring.clearSelect();
      pointHoldStart = 0;
      if (pointTimer) { clearTimeout(pointTimer); pointTimer = null; }
      // 手消失后恢复自动旋转
      if (ring.state === ST.SPREAD || ring.state === ST.FLIPPED) {
        ring.autoSpin = true;
      }
    }
  }, 200);

  function drawDbg(r) {
    if (!ge) return;
    const dg=document.getElementById('d-g'), dh=document.getElementById('d-h'), df=document.getElementById('d-f'), ds=document.getElementById('d-s');
    if(dg) dg.textContent=ge.dbg.g; if(dh) dh.textContent=ge.dbg.hands;
    if(df) df.textContent=ge.fps; if(ds) ds.textContent=ring.state;
    // 置信度
    const dcf = document.getElementById('d-cf');
    if(dcf) dcf.textContent = ge.dbg.confidence + '%';
    const cv = document.getElementById('dp-cv');
    if (!cv || !document.getElementById('debug-panel').classList.contains('show')) return;
    const cx = cv.getContext('2d'); cx.clearRect(0,0,cv.width,cv.height);
    const v = document.getElementById('gcam');
    if (v.readyState>=2) {
      cx.save(); if(ge.mirrored){cx.translate(cv.width,0);cx.scale(-1,1)} cx.drawImage(v,0,0,cv.width,cv.height); cx.restore();
    }
    if (r.landmarks) for (const h of r.landmarks) {
      const cn = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
      cx.strokeStyle='#ffd70080'; cx.lineWidth=1;
      for (const[a,b] of cn) { cx.beginPath(); cx.moveTo(ge.mirrored?(1-h[a].x)*cv.width:h[a].x*cv.width,h[a].y*cv.height); cx.lineTo(ge.mirrored?(1-h[b].x)*cv.width:h[b].x*cv.width,h[b].y*cv.height); cx.stroke(); }
      for (let i=0;i<h.length;i++){const p=h[i],px=ge.mirrored?(1-p.x)*cv.width:p.x*cv.width;cx.beginPath();cx.arc(px,p.y*cv.height,2.5,0,6.28);cx.fillStyle=[4,8,12,16,20].includes(i)?'#ff6baf':'#00e5ff';cx.fill()}
    }
  }

  document.getElementById('btn-start').addEventListener('click', enableGesture);
  document.getElementById('title').addEventListener('dblclick', () => document.getElementById('debug-panel').classList.toggle('show'));
  document.getElementById('dp-close')?.addEventListener('click', () => document.getElementById('debug-panel').classList.remove('show'));
});
