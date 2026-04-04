/* ========================================
   星空背景渲染系统 v2 — 性能优化版
   Safari/Chrome 双端流畅
   - 离屏缓存星云（避免每帧 createRadialGradient）
   - 星星分批渲染 + 降频闪烁
   - resize 防抖
   ======================================== */

class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.stars = [];
    this.shootingStars = [];
    this._nebulaCanvas = null; // 离屏缓存
    this._resizeTimer = null;
    this._frameSkip = 0;       // 降频计数器
    this._resize();
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._resize(), 200);
    });
    this._createStars();
    this._createNebulaCache();
    this._animate();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._w = w;
    this._h = h;
    if (this.stars.length > 0) {
      this._createStars();
      this._createNebulaCache();
    }
  }

  _createStars() {
    const w = this._w;
    const h = this._h;
    // 限制最大数量，避免大屏幕爆星
    const count = Math.min(Math.floor((w * h) / 4000), 500);
    this.stars = [];

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.6 + 0.2,
        brightness: 0.1 + Math.random() * 0.5,
        twinkleSpeed: 0.003 + Math.random() * 0.012,
        twinklePhase: Math.random() * Math.PI * 2,
        colorIdx: Math.floor(Math.random() * 5),
      });
    }
  }

  // 离屏渲染星云（只在 resize 时重建一次）
  _createNebulaCache() {
    const w = this._w;
    const h = this._h;
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const octx = offscreen.getContext('2d');

    const nebulaColors = [
      { r: 212, g: 175, b: 55 },
      { r: 138, g: 43, b: 226 },
      { r: 30, g: 80, b: 180 },
      { r: 80, g: 40, b: 120 },
    ];

    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const nr = 150 + Math.random() * 250;
      const nc = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
      const op = 0.03 + Math.random() * 0.04;
      const grad = octx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      grad.addColorStop(0, `rgba(${nc.r},${nc.g},${nc.b},${op})`);
      grad.addColorStop(0.5, `rgba(${nc.r},${nc.g},${nc.b},${op * 0.4})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      octx.fillStyle = grad;
      octx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
    }
    this._nebulaCanvas = offscreen;
  }

  // 预计算的颜色前缀
  static STAR_COLORS = [
    'rgba(255,255,255,',
    'rgba(200,220,255,',
    'rgba(255,240,220,',
    'rgba(220,200,255,',
    'rgba(255,210,180,',
  ];

  _maybeSpawnShootingStar() {
    if (Math.random() > 0.998) {
      this.shootingStars.push({
        x: Math.random() * this._w,
        y: Math.random() * this._h * 0.4,
        length: 80 + Math.random() * 120,
        speed: 4 + Math.random() * 6,
        angle: Math.PI * 0.15 + Math.random() * 0.3,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
      });
    }
  }

  _animate() {
    const ctx = this.ctx;
    const w = this._w;
    const h = this._h;

    ctx.clearRect(0, 0, w, h);

    // 星云：直接贴缓存（零开销）
    if (this._nebulaCanvas) {
      ctx.drawImage(this._nebulaCanvas, 0, 0, w, h);
    }

    // 星星：每 2 帧重算 alpha，中间帧直接用缓存值
    const time = performance.now() * 0.001;
    const recalc = (this._frameSkip++ & 1) === 0;
    const colors = Starfield.STAR_COLORS;

    for (let i = 0, len = this.stars.length; i < len; i++) {
      const star = this.stars[i];
      let alpha;
      if (recalc) {
        alpha = star.brightness * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase)));
        star._cachedAlpha = alpha;
      } else {
        alpha = star._cachedAlpha || 0;
      }

      if (alpha < 0.05) continue;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, 6.2832);
      ctx.fillStyle = colors[star.colorIdx] + (alpha < 0.1 ? alpha.toFixed(2) : (alpha > 0.99 ? '1)' : alpha.toFixed(1) + ')'));
      ctx.fill();
    }

    // 流星
    this._maybeSpawnShootingStar();
    const ss = this.shootingStars;
    for (let i = ss.length - 1; i >= 0; i--) {
      const s = ss[i];
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life -= s.decay;
      if (s.life <= 0) { ss.splice(i, 1); continue; }

      const tailX = s.x - Math.cos(s.angle) * s.length * s.life;
      const tailY = s.y - Math.sin(s.angle) * s.length * s.life;

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, `rgba(255,255,255,${(s.life * 0.8).toFixed(2)})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, 6.2832);
      ctx.fillStyle = `rgba(255,255,255,${s.life.toFixed(2)})`;
      ctx.fill();
    }

    requestAnimationFrame(() => this._animate());
  }
}


/* ========================================
   粒子 & 魔法特效系统 v2 — 性能优化版
   移除 shadowBlur（Safari 性能杀手）
   粒子上限 + DPR 适配
   ======================================== */

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    // willReadFrequently: false — 纯写入场景无需此标志
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.particles = [];
    this.running = false;
    this._MAX_PARTICLES = 300;
    this._resizeTimer = null;
    this._resize();
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._resize(), 200);
    });
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._w = w;
    this._h = h;
  }

  /**
   * 添加召唤粒子（从中心向外扩散）
   */
  emitSummon(color = '#ffd700', count = 40) {
    const cx = this._w / 2;
    const cy = this._h * 0.6;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this._MAX_PARTICLES) break;
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
        size: 2 + Math.random() * 3,
        color,
        type: 'circle',
      });
    }
    this._ensureRunning();
  }

  /**
   * 添加环绕卡牌的闪烁粒子
   */
  emitCardGlow(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this._MAX_PARTICLES) break;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 1 + Math.random() * 2,
        color,
        type: 'circle',
      });
    }
    this._ensureRunning();
  }

  /**
   * 全屏魔法爆发
   */
  emitSpellBurst(color, count = 100) {
    const cx = this._w / 2;
    const cy = this._h / 2;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this._MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.005 + Math.random() * 0.008,
        size: 2 + Math.random() * 5,
        color,
        type: Math.random() > 0.5 ? 'circle' : 'star',
      });
    }
    this._ensureRunning();
  }

  _ensureRunning() {
    if (!this.running) {
      this.running = true;
      this._animate();
    }
  }

  _animate() {
    if (!this.running) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this._w, this._h);

    let alive = 0;
    const ps = this.particles;
    for (let i = 0, len = ps.length; i < len; i++) {
      const p = ps[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.vy += 0.02;

      if (p.life <= 0) continue;

      ctx.globalAlpha = p.life;

      if (p.type === 'star') {
        this._drawStar(p.x, p.y, p.size, p.color);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, 6.2832);
        ctx.fillStyle = p.color;
        // 不使用 shadowBlur — Safari 上极慢
        ctx.fill();
      }

      ps[alive++] = p;
    }
    ctx.globalAlpha = 1;
    ps.length = alive;

    if (alive > 0) {
      requestAnimationFrame(() => this._animate());
    } else {
      this.running = false;
    }
  }

  _drawStar(x, y, size, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size * 2, Math.sin(angle) * size * 2);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  clear() {
    this.particles.length = 0;
    this.ctx.clearRect(0, 0, this._w, this._h);
    this.running = false;
  }
}

/**
 * 全屏魔法释放特效 v2 — 性能优化版
 */
class SpellEffect {
  constructor(fxCanvas) {
    this.canvas = fxCanvas;
    this.ctx = fxCanvas.getContext('2d', { alpha: true });
    this.running = false;
    this._resizeTimer = null;
    this._resize();
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._resize(), 200);
    });
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._w = w;
    this._h = h;
  }

  /**
   * 播放魔法释放特效
   * @param {object} cardData - 卡牌数据
   * @param {number} duration - 持续时间 ms
   * @returns {Promise}
   */
  play(cardData, duration = 4000) {
    return new Promise(resolve => {
      this.running = true;
      const startTime = performance.now();
      const w = this._w;
      const h = this._h;
      const cx = w / 2;
      const cy = h / 2;

      const animate = (now) => {
        if (!this.running) {
          this.ctx.clearRect(0, 0, w, h);
          resolve();
          return;
        }

        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.ctx.clearRect(0, 0, w, h);

        // 背景光晕
        const glowRadius = Math.max(w, h) * progress;
        const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, cardData.color + '40');
        gradient.addColorStop(0.5, cardData.color + '15');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);

        // 魔法阵
        this._drawMagicCircle(cx, cy, 80 + progress * 120, cardData.color, elapsed);

        // 元素特效
        this._drawElementEffect(cardData.element, cx, cy, elapsed, progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 淡出
          setTimeout(() => {
            this.ctx.clearRect(0, 0, w, h);
            this.running = false;
            resolve();
          }, 300);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  _drawMagicCircle(cx, cy, radius, color, time) {
    const ctx = this.ctx;
    const rotation = time * 0.001;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // 外圈
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color + '60';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内圈
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = color + '40';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 星芒
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3);
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawElementEffect(element, cx, cy, time, progress) {
    const ctx = this.ctx;
    const w = this._w;
    const h = this._h;

    switch (element) {
      case 'wind':
        // 风：螺旋线
        for (let i = 0; i < 5; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(time * 0.002 + i * Math.PI * 0.4);
          ctx.beginPath();
          for (let t = 0; t < 100; t++) {
            const r = t * 2 * progress;
            const a = t * 0.15;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.strokeStyle = `rgba(79,195,247,${0.3 - i * 0.05})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        break;

      case 'water':
        // 水：波纹扩散
        for (let i = 0; i < 4; i++) {
          const r = (progress * 300 + i * 60) % 350;
          const alpha = 1 - r / 350;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(41,182,246,${alpha * 0.6})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        break;

      case 'fire':
        // 火：上升的火焰粒子
        for (let i = 0; i < 30; i++) {
          const x = cx + (Math.random() - 0.5) * 200 * progress;
          const y = cy + 100 - Math.random() * 300 * progress;
          const size = 3 + Math.random() * 8;
          const alpha = 0.3 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,${Math.floor(80 + Math.random() * 100)},30,${alpha})`;
          ctx.fill();
        }
        break;

      case 'light':
        // 光：放射状光线
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI / 6) * i + time * 0.001;
          const len = 100 + progress * 200;
          const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
          gradient.addColorStop(0, 'rgba(253,216,53,0.6)');
          gradient.addColorStop(1, 'rgba(253,216,53,0)');
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle - 0.05) * len, Math.sin(angle - 0.05) * len);
          ctx.lineTo(Math.cos(angle + 0.05) * len, Math.sin(angle + 0.05) * len);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        ctx.restore();
        break;

      case 'shadow':
        // 影：暗色漩涡
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-time * 0.002);
        for (let i = 0; i < 60; i++) {
          const angle = (i / 60) * Math.PI * 4;
          const r = i * 3 * progress;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const alpha = (1 - i / 60) * 0.7;
          ctx.beginPath();
          ctx.arc(x, y, 4 + (1 - i / 60) * 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(124,77,255,${alpha})`;
          ctx.fill();
        }
        ctx.restore();
        break;
    }
  }

  stop() {
    this.running = false;
  }
}
