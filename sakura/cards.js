/* ========================================
   卡牌数据 & 圆形排列管理 v4
   10张卡牌均匀分布在半径200px的圆上
   ======================================== */

const CARDS = [
  {
    id: 'wind',
    name: '风',
    element: 'wind',
    symbol: '🌪️',
    color: '#4fc3f7',
    spell: 'WINDY',
    spellSub: '风之精灵，听从我的命令',
    bgGrad: 'radial-gradient(ellipse at center, rgba(79,195,247,0.3), transparent 70%)',
  },
  {
    id: 'water',
    name: '水',
    element: 'water',
    symbol: '💧',
    color: '#29b6f6',
    spell: 'WATERY',
    spellSub: '水之精灵，以你的力量净化一切',
    bgGrad: 'radial-gradient(ellipse at center, rgba(41,182,246,0.3), transparent 70%)',
  },
  {
    id: 'fire',
    name: '火',
    element: 'fire',
    symbol: '🔥',
    color: '#ff7043',
    spell: 'FIREY',
    spellSub: '火之精灵，燃烧一切阻碍',
    bgGrad: 'radial-gradient(ellipse at center, rgba(255,112,67,0.3), transparent 70%)',
  },
  {
    id: 'light',
    name: '光',
    element: 'light',
    symbol: '✨',
    color: '#fdd835',
    spell: 'LIGHT',
    spellSub: '光之精灵，照亮黑暗',
    bgGrad: 'radial-gradient(ellipse at center, rgba(253,216,53,0.3), transparent 70%)',
  },
  {
    id: 'shadow',
    name: '影',
    element: 'shadow',
    symbol: '🌑',
    color: '#7c4dff',
    spell: 'SHADOW',
    spellSub: '影之精灵，吞噬光明',
    bgGrad: 'radial-gradient(ellipse at center, rgba(124,77,255,0.3), transparent 70%)',
  },
  {
    id: 'earth',
    name: '地',
    element: 'earth',
    symbol: '🌍',
    color: '#8d6e63',
    spell: 'EARTHY',
    spellSub: '地之精灵，守护万物',
    bgGrad: 'radial-gradient(ellipse at center, rgba(141,110,99,0.3), transparent 70%)',
  },
  {
    id: 'thunder',
    name: '雷',
    element: 'thunder',
    symbol: '⚡',
    color: '#ffca28',
    spell: 'THUNDER',
    spellSub: '雷之精灵，降下天罚',
    bgGrad: 'radial-gradient(ellipse at center, rgba(255,202,40,0.3), transparent 70%)',
  },
  {
    id: 'flower',
    name: '花',
    element: 'flower',
    symbol: '🌸',
    color: '#f48fb1',
    spell: 'FLOWER',
    spellSub: '花之精灵，绽放美丽',
    bgGrad: 'radial-gradient(ellipse at center, rgba(244,143,177,0.3), transparent 70%)',
  },
  {
    id: 'snow',
    name: '雪',
    element: 'snow',
    symbol: '❄️',
    color: '#80deea',
    spell: 'SNOW',
    spellSub: '雪之精灵，冰封世界',
    bgGrad: 'radial-gradient(ellipse at center, rgba(128,222,234,0.3), transparent 70%)',
  },
  {
    id: 'time',
    name: '时',
    element: 'time',
    symbol: '⏳',
    color: '#ce93d8',
    spell: 'TIME',
    spellSub: '时之精灵，操纵时空',
    bgGrad: 'radial-gradient(ellipse at center, rgba(206,147,216,0.3), transparent 70%)',
  },
];


/* ========================================
   圆形排列卡牌管理器
   
   10 张卡牌围成一圈（2D 圆形排列）
   圆心在屏幕中心，半径200px
   每张卡牌之间角度间隔 36°（360/10）
   ======================================== */

class CardCarousel {
  constructor() {
    this.container = document.getElementById('carousel');
    this.currentIndex = 0;
    this.cardCount = CARDS.length;
    this.anglePerCard = 360 / this.cardCount; // 36°
    this.radius = 200; // 圆形排列半径 px
    this.cards = [];   // DOM 元素数组
  }

  /**
   * 创建10张卡牌并排列成圆
   */
  create() {
    this.container.innerHTML = '';
    this.cards = [];

    CARDS.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'carousel-card';
      el.dataset.element = card.element;
      el.dataset.index = i;
      el.innerHTML = `
        <div class="card-inner" style="background: linear-gradient(180deg, ${card.color}18, ${card.color}08);">
          <div class="card-glow"></div>
          <div class="card-circle"></div>
          <div class="card-symbol">${card.symbol}</div>
          <div class="card-name">${card.name}</div>
        </div>
      `;

      // 每张卡牌按角度分布在圆上
      // 从顶部(-90°)开始，顺时针排列
      const angle = (this.anglePerCard * i - 90) * (Math.PI / 180);
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.dataset.angle = this.anglePerCard * i;

      this.container.appendChild(el);
      this.cards.push(el);
    });

    // 初始高亮 index=0
    this._updateHighlight();
  }

  /**
   * 旋转到指定索引
   * @param {number} index
   * @param {boolean} animate - 是否带动画
   */
  rotateTo(index, animate = true) {
    this.currentIndex = ((index % this.cardCount) + this.cardCount) % this.cardCount;
    this._updateHighlight(animate);
  }

  /**
   * 向左/右旋转一格
   * @param {number} dir - +1=下一张, -1=上一张
   */
  rotateBy(dir) {
    this.currentIndex = ((this.currentIndex + dir) % this.cardCount + this.cardCount) % this.cardCount;
    this._updateHighlight(true);
  }

  /**
   * 获取当前选中卡牌数据
   */
  getCurrentCard() {
    return CARDS[this.currentIndex];
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * 更新卡牌高亮状态
   * 选中的卡牌高亮，其他卡牌变暗
   */
  _updateHighlight(animate = false) {
    this.cards.forEach((card, i) => {
      const isSelected = i === this.currentIndex;
      card.classList.toggle('front-card', isSelected);
      card.classList.toggle('dimmed-card', !isSelected);

      if (animate) {
        card.style.transition = 'filter 0.4s ease, opacity 0.4s ease, transform 0.4s ease';
      }
    });
  }

  /**
   * 入场动画 —— 卡牌从中心散开到各自位置
   */
  playEnterAnimation() {
    this.cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translate(0, 0) scale(0.3)';

      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        const angle = (this.anglePerCard * i - 90) * (Math.PI / 180);
        const x = Math.cos(angle) * this.radius;
        const y = Math.sin(angle) * this.radius;
        card.style.transform = `translate(${x}px, ${y}px)`;
        card.style.opacity = '1';
      }, i * 80);
    });

    // 入场完毕后更新高亮
    setTimeout(() => {
      this._updateHighlight(true);
    }, this.cardCount * 80 + 600);
  }
}


/* ========================================
   选定卡牌放大展示
   ======================================== */

function showSelectedCard(cardData) {
  const view = document.getElementById('card-selected-view');
  const card = document.getElementById('selected-card');
  const name = document.getElementById('selected-card-name');
  const glow = document.getElementById('selected-glow');

  card.style.color = cardData.color;
  card.style.borderColor = cardData.color;
  card.style.boxShadow = `0 0 40px ${cardData.color}40, 0 0 80px ${cardData.color}15, 0 20px 60px rgba(0,0,0,0.5)`;
  card.style.background = `linear-gradient(180deg, ${cardData.color}20, ${cardData.color}08)`;
  card.innerHTML = `
    <div class="selected-card-inner">
      <div class="sel-circle"></div>
      <div class="sel-symbol">${cardData.symbol}</div>
      <div class="sel-label">${cardData.name}</div>
    </div>
  `;

  glow.style.background = `radial-gradient(circle, ${cardData.color}18 0%, transparent 70%)`;

  name.textContent = cardData.spell;
  name.style.color = cardData.color;

  // 重新触发入场动画
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'selectedCardEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

  view.classList.remove('hidden');
}

function hideSelectedCard() {
  document.getElementById('card-selected-view').classList.add('hidden');
}


/* ========================================
   3D翻转展示
   ======================================== */

function showFlipCard(cardData) {
  const display = document.getElementById('flip-card-display');
  const front = document.getElementById('flip-card-front');
  const name = document.getElementById('flip-card-name');

  front.style.background = `linear-gradient(135deg, ${cardData.color}30, ${cardData.color}10)`;
  front.style.color = cardData.color;
  front.innerHTML = `
    <div class="magic-circle-deco"></div>
    <div class="big-symbol">${cardData.symbol}</div>
    <div class="element-label">${cardData.name}</div>
  `;
  front.style.borderColor = cardData.color;
  front.style.boxShadow = `0 0 40px ${cardData.color}50, 0 0 80px ${cardData.color}20`;

  name.textContent = cardData.spell;
  name.style.color = cardData.color;

  display.classList.remove('hidden');

  // 重新触发翻转动画
  const card3d = display.querySelector('.card-3d');
  card3d.style.animation = 'none';
  card3d.offsetHeight;
  card3d.style.animation = 'cardFlipIn 0.8s ease forwards';
}

function hideFlipCard() {
  document.getElementById('flip-card-display').classList.add('hidden');
}
