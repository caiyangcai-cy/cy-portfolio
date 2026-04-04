/* ========================================
   粒子 & 魔法特效系统
   ======================================== */

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    // 限制 canvas 像素密度，减少 Retina 屏上的绘制开销
    this.canvas.width = Math.round(window.innerWidth * 0.75);
    this.canvas.height = Math.round(window.innerHeight * 0.75);
  }

  /**
   * 添加召唤粒子（从中心向外扩散）
   */
  emitSummon(color = '#ffd700', count = 40) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height * 0.6;

    for (let i = 0; i < count; i++) {
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
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    for (let i = 0; i < count; i++) {
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

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.vy += 0.02; // 轻微重力

      if (p.life <= 0) return false;

      this.ctx.globalAlpha = p.life;

      if (p.type === 'star') {
        this._drawStar(p.x, p.y, p.size, p.color);
      } else {
        // 用双层圆代替shadowBlur，性能好10倍
        const r = p.size * p.life;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color + '30';
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      }

      this.ctx.globalAlpha = 1;
      return true;
    });

    if (this.particles.length > 0) {
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
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.running = false;
  }
}

/**
 * 全屏魔法释放特效
 */
class SpellEffect {
  constructor(fxCanvas) {
    this.canvas = fxCanvas;
    this.ctx = fxCanvas.getContext('2d');
    this.running = false;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    // 限制 canvas 像素密度
    this.canvas.width = Math.round(window.innerWidth * 0.75);
    this.canvas.height = Math.round(window.innerHeight * 0.75);
  }

  /**
   * 播放魔法释放特效
   * @param {object} cardData - 卡牌数据
   * @param {number} duration - 持续时间 ms
   * @param {{ showTextOverlay?: boolean }} [options] - 仅当 showTextOverlay === true 时才叠加 spell 文案（默认不显示，避免盖住卡图）
   * @returns {Promise}
   */
  play(cardData, duration = 4000, options = {}) {
    const showTextOverlay = options.showTextOverlay === true;
    return new Promise(resolve => {
      this.running = true;
      const startTime = performance.now();
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      let overlay = null;
      if (showTextOverlay) {
        overlay = document.createElement('div');
        overlay.className = 'spell-overlay';
        overlay.style.color = cardData.color;
        overlay.innerHTML = `
        <div class="spell-name">${cardData.spell}</div>
        <div class="spell-subtitle">${cardData.spellSub}</div>
      `;
        document.body.appendChild(overlay);
      }

      const finishCleanup = () => {
        this.ctx.clearRect(0, 0, w, h);
        overlay?.remove();
        this.running = false;
        resolve();
      };

      const animate = (now) => {
        if (!this.running) {
          this.ctx.clearRect(0, 0, w, h);
          overlay?.remove();
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
        } else if (!showTextOverlay) {
          setTimeout(finishCleanup, 300);
        } else {
          setTimeout(() => {
            overlay.style.animation = 'none';
            overlay.style.transition = 'opacity 0.5s';
            overlay.style.opacity = '0';
            this.ctx.clearRect(0, 0, w, h);
            setTimeout(finishCleanup, 500);
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
    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (element) {
      case 'wind':
        // 风：螺旋线
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(time * 0.002 + i * Math.PI * 0.67);
          ctx.beginPath();
          for (let t = 0; t < 60; t++) {
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
        for (let i = 0; i < 15; i++) {
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
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 4;
          const r = i * 3 * progress;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const alpha = (1 - i / 30) * 0.7;
          ctx.beginPath();
          ctx.arc(x, y, 4 + (1 - i / 30) * 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(124,77,255,${alpha})`;
          ctx.fill();
        }
        ctx.restore();
        break;

      case 'earth':
        // 地：地面裂纹扩散
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i + time * 0.0005;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          let px = 0, py = 0;
          for (let j = 0; j < 10; j++) {
            px += Math.cos(angle + (Math.random() - 0.5) * 0.5) * 20 * progress;
            py += Math.sin(angle + (Math.random() - 0.5) * 0.5) * 20 * progress;
            ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(141,110,99,${0.5 - i * 0.05})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
        break;

      case 'thunder':
        // 雷：闪电效果
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          const startAngle = (Math.PI / 2) * i + time * 0.003;
          ctx.beginPath();
          let tx = 0, ty = 0;
          ctx.moveTo(tx, ty);
          for (let j = 0; j < 8; j++) {
            tx += (Math.random() - 0.5) * 60 * progress;
            ty += (Math.random() * 40 + 10) * progress * (Math.random() > 0.5 ? 1 : -1);
            ctx.lineTo(tx, ty);
          }
          ctx.strokeStyle = `rgba(255,202,40,${0.6 + Math.random() * 0.3})`;
          ctx.lineWidth = 2 + Math.random() * 2;
          ctx.stroke();
          ctx.restore();
        }
        break;

      case 'flower':
        // 花：花瓣飘落
        for (let i = 0; i < 10; i++) {
          const fx = cx + (Math.random() - 0.5) * 400 * progress;
          const fy = cy - 200 + Math.random() * 400 * progress;
          const size = 4 + Math.random() * 6;
          const alpha = 0.3 + Math.random() * 0.5;
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(time * 0.002 + i);
          ctx.beginPath();
          ctx.ellipse(0, 0, size, size / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(244,143,177,${alpha})`;
          ctx.fill();
          ctx.restore();
        }
        break;

      case 'snow':
        // 雪：雪花飘落
        for (let i = 0; i < 15; i++) {
          const sx = cx + (Math.random() - 0.5) * 300 * progress;
          const sy = cy - 200 + Math.random() * 400 * progress;
          const size = 2 + Math.random() * 4;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(128,222,234,${0.3 + Math.random() * 0.4})`;
          ctx.fill();
        }
        break;

      case 'time':
        // 时：时钟齿轮旋转
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.002);
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI / 6) * i;
          const innerR = 40 * progress;
          const outerR = 100 * progress;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
          ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
          ctx.strokeStyle = `rgba(206,147,216,${0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        // 时钟指针
        ctx.beginPath();
        ctx.arc(0, 0, 80 * progress, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(206,147,216,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        break;
    }
  }

  stop() {
    this.running = false;
  }
}
