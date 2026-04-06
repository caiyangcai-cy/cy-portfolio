/* ========================================
   卡牌数据 & 3D 环形旋转木马管理 v7
   完整 78 张韦特塔罗 (Rider-Waite Tarot)
   22 大牌 + 14 宝剑 + 14 权杖 + 14 圣杯 + 14 星币
   ======================================== */

const CARDS = [
  // ============================================================
  // === 大牌 (Major Arcana) 0–21 ===
  // ============================================================
  { id: 'M00', name: '愚者',     nameEn: 'The Fool',            symbol: '🃏', color: '#fdd835', meaning: '新开始、冒险、自由、无限可能',       element: 'wind',  spell: '风之旅人', spellSub: 'Wind of Wanderer',   image: '塔罗牌完整/大牌/大牌00.jpg' },
  { id: 'M01', name: '魔术师',   nameEn: 'The Magician',        symbol: '🪄', color: '#ff7043', meaning: '创造力、意志力、技巧、资源整合',     element: 'fire',  spell: '焰之创造', spellSub: 'Fire of Creation',    image: '塔罗牌完整/大牌/大牌01.jpg' },
  { id: 'M02', name: '女祭司',   nameEn: 'The High Priestess',  symbol: '🌙', color: '#7986cb', meaning: '直觉、潜意识、神秘、内在智慧',       element: 'water', spell: '水之秘境', spellSub: 'Water of Mystery',    image: '塔罗牌完整/大牌/大牌02.jpg' },
  { id: 'M03', name: '女皇',     nameEn: 'The Empress',         symbol: '👑', color: '#4fc3f7', meaning: '丰饶、母性、感官享受、自然',         element: 'water', spell: '水之滋养', spellSub: 'Water of Nurture',    image: '塔罗牌完整/大牌/大牌03.jpg' },
  { id: 'M04', name: '皇帝',     nameEn: 'The Emperor',         symbol: '🏛️', color: '#ff5722', meaning: '权威、结构、秩序、领导力',           element: 'fire',  spell: '焰之秩序', spellSub: 'Fire of Order',       image: '塔罗牌完整/大牌/大牌04.jpg' },
  { id: 'M05', name: '教皇',     nameEn: 'The Hierophant',      symbol: '📿', color: '#8d6e63', meaning: '传统、信仰、教育、精神指导',         element: 'light', spell: '光之教化', spellSub: 'Light of Guidance',   image: '塔罗牌完整/大牌/大牌05.jpg' },
  { id: 'M06', name: '恋人',     nameEn: 'The Lovers',          symbol: '💞', color: '#ff6baf', meaning: '爱情、和谐、选择、结合',             element: 'wind',  spell: '风之缘结', spellSub: 'Wind of Bond',        image: '塔罗牌完整/大牌/大牌06.jpg' },
  { id: 'M07', name: '战车',     nameEn: 'The Chariot',         symbol: '🏇', color: '#42a5f5', meaning: '胜利、意志、征服、控制力',           element: 'water', spell: '水之战驱', spellSub: 'Water of Triumph',    image: '塔罗牌完整/大牌/大牌07.jpg' },
  { id: 'M08', name: '力量',     nameEn: 'Strength',            symbol: '🦁', color: '#ffa726', meaning: '勇气、内在力量、耐心、柔中带刚',     element: 'fire',  spell: '焰之心力', spellSub: 'Fire of Courage',     image: '塔罗牌完整/大牌/大牌08.jpg' },
  { id: 'M09', name: '隐士',     nameEn: 'The Hermit',          symbol: '🏔️', color: '#78909c', meaning: '内省、独处、智慧、寻求真理',         element: 'light', spell: '光之独行', spellSub: 'Light of Solitude',   image: '塔罗牌完整/大牌/大牌09.jpg' },
  { id: 'M10', name: '命运之轮', nameEn: 'Wheel of Fortune',    symbol: '🎡', color: '#fdd835', meaning: '周期、运气、转折点、命运',           element: 'light', spell: '光之轮转', spellSub: 'Wheel of Light',      image: '塔罗牌完整/大牌/大牌10.jpg' },
  { id: 'M11', name: '正义',     nameEn: 'Justice',             symbol: '⚖️', color: '#66bb6a', meaning: '公正、真相、因果、决断',             element: 'wind',  spell: '风之裁决', spellSub: 'Wind of Justice',     image: '塔罗牌完整/大牌/大牌11.jpg' },
  { id: 'M12', name: '倒吊人',   nameEn: 'The Hanged Man',      symbol: '🔄', color: '#29b6f6', meaning: '牺牲、新视角、等待、放下',           element: 'water', spell: '水之悬停', spellSub: 'Water of Surrender',  image: '塔罗牌完整/大牌/大牌12.jpg' },
  { id: 'M13', name: '死神',     nameEn: 'Death',               symbol: '🌑', color: '#455a64', meaning: '结束、转变、重生、放手旧事物',       element: 'shadow',spell: '影之蜕变', spellSub: 'Shadow of Rebirth',   image: '塔罗牌完整/大牌/大牌13.jpg' },
  { id: 'M14', name: '节制',     nameEn: 'Temperance',          symbol: '🕊️', color: '#29b6f6', meaning: '平衡、中庸、耐心、疗愈',             element: 'water', spell: '水之调和', spellSub: 'Water of Balance',    image: '塔罗牌完整/大牌/大牌14.jpg' },
  { id: 'M15', name: '恶魔',     nameEn: 'The Devil',           symbol: '⛓️', color: '#b71c1c', meaning: '束缚、诱惑、执念、物质沉迷',         element: 'shadow',spell: '影之锁链', spellSub: 'Shadow of Chains',    image: '塔罗牌完整/大牌/大牌15.jpg' },
  { id: 'M16', name: '塔',       nameEn: 'The Tower',           symbol: '⚡', color: '#d32f2f', meaning: '突变、崩塌、觉醒、破旧立新',         element: 'fire',  spell: '焰之破塔', spellSub: 'Fire of Collapse',    image: '塔罗牌完整/大牌/大牌16.jpg' },
  { id: 'M17', name: '星星',     nameEn: 'The Star',            symbol: '⭐', color: '#00e5ff', meaning: '希望、灵感、平静、治愈',             element: 'light', spell: '星之希望', spellSub: 'Star of Hope',        image: '塔罗牌完整/大牌/大牌17.jpg' },
  { id: 'M18', name: '月亮',     nameEn: 'The Moon',            symbol: '🌕', color: '#b39ddb', meaning: '幻象、不安、潜意识、直觉考验',       element: 'water', spell: '水之幻月', spellSub: 'Water of Illusion',   image: '塔罗牌完整/大牌/大牌18.jpg' },
  { id: 'M19', name: '太阳',     nameEn: 'The Sun',             symbol: '☀️', color: '#fdd835', meaning: '成功、快乐、活力、清晰',             element: 'fire',  spell: '焰之太阳', spellSub: 'Fire of Sun',         image: '塔罗牌完整/大牌/大牌19.jpg' },
  { id: 'M20', name: '审判',     nameEn: 'Judgement',           symbol: '📯', color: '#ab47bc', meaning: '觉醒、审视、重生、使命召唤',         element: 'fire',  spell: '焰之审判', spellSub: 'Fire of Judgement',   image: '塔罗牌完整/大牌/大牌20.jpg' },
  { id: 'M21', name: '世界',     nameEn: 'The World',           symbol: '🌍', color: '#4fc3f7', meaning: '完成、整合、圆满、成就',             element: 'light', spell: '光之世界', spellSub: 'World of Light',      image: '塔罗牌完整/大牌/大牌21.jpg' },

  // ============================================================
  // === 宝剑 (Swords) — 风元素 ===
  // ============================================================
  { id: 'Sw01', name: '宝剑王牌', nameEn: 'Ace of Swords',       symbol: '⚔️', color: '#90caf9', meaning: '真相、洞察、突破、清晰思维',     element: 'wind',  spell: '剑之真理', spellSub: 'Sword of Truth',      image: '塔罗牌完整/宝剑/宝剑01.jpg' },
  { id: 'Sw02', name: '宝剑二',   nameEn: 'Two of Swords',       symbol: '⚖️', color: '#78909c', meaning: '抉择、僵局、逃避、蒙蔽',         element: 'wind',  spell: '剑之两难', spellSub: 'Sword of Dilemma',    image: '塔罗牌完整/宝剑/宝剑02.jpg' },
  { id: 'Sw03', name: '宝剑三',   nameEn: 'Three of Swords',     symbol: '💔', color: '#e57373', meaning: '心碎、悲伤、失落、痛苦的领悟',     element: 'wind',  spell: '剑之心伤', spellSub: 'Sword of Heartbreak', image: '塔罗牌完整/宝剑/宝剑03.jpg' },
  { id: 'Sw04', name: '宝剑四',   nameEn: 'Four of Swords',      symbol: '🛏️', color: '#b0bec5', meaning: '休息、恢复、冥想、暂停充电',       element: 'wind',  spell: '剑之静养', spellSub: 'Sword of Rest',       image: '塔罗牌完整/宝剑/宝剑04.jpg' },
  { id: 'Sw05', name: '宝剑五',   nameEn: 'Five of Swords',      symbol: '😤', color: '#546e7a', meaning: '冲突、输赢、自私、空虚的胜利',     element: 'wind',  spell: '剑之争锋', spellSub: 'Sword of Conflict',   image: '塔罗牌完整/宝剑/宝剑05.jpg' },
  { id: 'Sw06', name: '宝剑六',   nameEn: 'Six of Swords',       symbol: '🚣', color: '#4dd0e1', meaning: '过渡、离开、前进、心灵疗愈',       element: 'wind',  spell: '剑之远航', spellSub: 'Sword of Passage',    image: '塔罗牌完整/宝剑/宝剑06.jpg' },
  { id: 'Sw07', name: '宝剑七',   nameEn: 'Seven of Swords',     symbol: '🦊', color: '#a1887f', meaning: '策略、隐秘、独行、另辟蹊径',       element: 'wind',  spell: '剑之暗行', spellSub: 'Sword of Stealth',    image: '塔罗牌完整/宝剑/宝剑07.jpg' },
  { id: 'Sw08', name: '宝剑八',   nameEn: 'Eight of Swords',     symbol: '🪢', color: '#607d8b', meaning: '困境、自我限制、无力感、思维牢笼', element: 'wind',  spell: '剑之囚笼', spellSub: 'Sword of Restriction',image: '塔罗牌完整/宝剑/宝剑08.jpg' },
  { id: 'Sw09', name: '宝剑九',   nameEn: 'Nine of Swords',      symbol: '😰', color: '#37474f', meaning: '焦虑、噩梦、过度担忧、心理压力',   element: 'wind',  spell: '剑之忧思', spellSub: 'Sword of Anxiety',    image: '塔罗牌完整/宝剑/宝剑09.jpg' },
  { id: 'Sw10', name: '宝剑十',   nameEn: 'Ten of Swords',       symbol: '🔚', color: '#263238', meaning: '终结、触底、放手、黎明前的黑暗',   element: 'wind',  spell: '剑之终局', spellSub: 'Sword of Ending',     image: '塔罗牌完整/宝剑/宝剑10.jpg' },
  { id: 'SwPa', name: '宝剑侍从', nameEn: 'Page of Swords',      symbol: '🧐', color: '#80cbc4', meaning: '好奇、观察、新想法、信息收集',     element: 'wind',  spell: '剑之使者', spellSub: 'Page of Swords',      image: '塔罗牌完整/宝剑/宝剑Page.jpg' },
  { id: 'SwKn', name: '宝剑骑士', nameEn: 'Knight of Swords',    symbol: '⚡', color: '#4db6ac', meaning: '快速行动、直言不讳、冲劲十足',     element: 'wind',  spell: '剑之疾风', spellSub: 'Knight of Swords',    image: '塔罗牌完整/宝剑/宝剑Knight.jpg' },
  { id: 'SwQu', name: '宝剑王后', nameEn: 'Queen of Swords',     symbol: '👸', color: '#26a69a', meaning: '独立、敏锐、清醒、边界分明',       element: 'wind',  spell: '剑之女王', spellSub: 'Queen of Swords',     image: '塔罗牌完整/宝剑/宝剑Queen.jpg' },
  { id: 'SwKi', name: '宝剑国王', nameEn: 'King of Swords',      symbol: '🗡️', color: '#00897b', meaning: '权威、逻辑、公正、理性决策',       element: 'wind',  spell: '剑之王者', spellSub: 'King of Swords',      image: '塔罗牌完整/宝剑/宝剑King.jpg' },

  // ============================================================
  // === 权杖 (Wands) — 火元素 ===
  // ============================================================
  { id: 'Wa01', name: '权杖王牌', nameEn: 'Ace of Wands',        symbol: '🔥', color: '#ff7043', meaning: '创造力、灵感、新机遇、激情',       element: 'fire',  spell: '焰之序曲', spellSub: 'Fire of Prelude',     image: '塔罗牌完整/权杖/权杖01.jpg' },
  { id: 'Wa02', name: '权杖二',   nameEn: 'Two of Wands',        symbol: '🗺️', color: '#ff8a65', meaning: '规划、决策、远见、跨出舒适区',     element: 'fire',  spell: '焰之抉择', spellSub: 'Fire of Planning',    image: '塔罗牌完整/权杖/权杖02.jpg' },
  { id: 'Wa03', name: '权杖三',   nameEn: 'Three of Wands',      symbol: '🔱', color: '#ff8a65', meaning: '远见、扩张、探索、展望未来',       element: 'fire',  spell: '焰之远望', spellSub: 'Fire of Vision',      image: '塔罗牌完整/权杖/权杖03.jpg' },
  { id: 'Wa04', name: '权杖四',   nameEn: 'Four of Wands',       symbol: '🏠', color: '#ffab91', meaning: '庆祝、和谐、家庭、稳定',           element: 'fire',  spell: '焰之庆典', spellSub: 'Fire of Festival',    image: '塔罗牌完整/权杖/权杖04.jpg' },
  { id: 'Wa05', name: '权杖五',   nameEn: 'Five of Wands',       symbol: '⚔️', color: '#ff7043', meaning: '竞争、冲突、多方角力、磨合',       element: 'fire',  spell: '焰之竞逐', spellSub: 'Fire of Competition', image: '塔罗牌完整/权杖/权杖05.jpg' },
  { id: 'Wa06', name: '权杖六',   nameEn: 'Six of Wands',        symbol: '🏆', color: '#ff7043', meaning: '胜利、荣誉、认可、自信',           element: 'fire',  spell: '焰之凯旋', spellSub: 'Fire of Victory',     image: '塔罗牌完整/权杖/权杖06.jpg' },
  { id: 'Wa07', name: '权杖七',   nameEn: 'Seven of Wands',      symbol: '🛡️', color: '#e64a19', meaning: '坚守、防御、挑战、不退让',         element: 'fire',  spell: '焰之坚守', spellSub: 'Fire of Defense',     image: '塔罗牌完整/权杖/权杖07.jpg' },
  { id: 'Wa08', name: '权杖八',   nameEn: 'Eight of Wands',      symbol: '🚀', color: '#ff5722', meaning: '迅速、行动力、推进、好消息',       element: 'fire',  spell: '焰之飞矢', spellSub: 'Fire of Arrows',      image: '塔罗牌完整/权杖/权杖08.jpg' },
  { id: 'Wa09', name: '权杖九',   nameEn: 'Nine of Wands',       symbol: '💪', color: '#bf360c', meaning: '坚韧、警觉、最后防线、不放弃',     element: 'fire',  spell: '焰之坚韧', spellSub: 'Fire of Resilience',  image: '塔罗牌完整/权杖/权杖09.jpg' },
  { id: 'Wa10', name: '权杖十',   nameEn: 'Ten of Wands',        symbol: '🏋️', color: '#8d6e63', meaning: '重负、压力、责任过重、需要放权',   element: 'fire',  spell: '焰之重担', spellSub: 'Fire of Burden',      image: '塔罗牌完整/权杖/权杖10.jpg' },
  { id: 'WaPa', name: '权杖侍从', nameEn: 'Page of Wands',       symbol: '🌟', color: '#ffab40', meaning: '热情、探索、新消息、冒险精神',     element: 'fire',  spell: '焰之使者', spellSub: 'Page of Wands',       image: '塔罗牌完整/权杖/权杖Page.jpg' },
  { id: 'WaKn', name: '权杖骑士', nameEn: 'Knight of Wands',     symbol: '🐎', color: '#ff6d00', meaning: '冲劲、大胆、冒险、追求激情',       element: 'fire',  spell: '焰之骑士', spellSub: 'Knight of Wands',     image: '塔罗牌完整/权杖/权杖Knight.jpg' },
  { id: 'WaQu', name: '权杖王后', nameEn: 'Queen of Wands',      symbol: '🔥', color: '#ff9100', meaning: '自信、魅力、独立、温暖领导力',     element: 'fire',  spell: '焰之女王', spellSub: 'Queen of Wands',      image: '塔罗牌完整/权杖/权杖Queen.jpg' },
  { id: 'WaKi', name: '权杖国王', nameEn: 'King of Wands',       symbol: '👑', color: '#e65100', meaning: '领袖、远见、企业家精神、掌控力',   element: 'fire',  spell: '焰之王者', spellSub: 'King of Wands',       image: '塔罗牌完整/权杖/权杖King.jpg' },

  // ============================================================
  // === 圣杯 (Cups) — 水元素 ===
  // ============================================================
  { id: 'Cu01', name: '圣杯王牌', nameEn: 'Ace of Cups',         symbol: '🏆', color: '#4fc3f7', meaning: '新感情、情感丰盈、直觉、爱的开始', element: 'water', spell: '水之初心', spellSub: 'Water of Origin',     image: '塔罗牌完整/圣杯/圣杯01.jpg' },
  { id: 'Cu02', name: '圣杯二',   nameEn: 'Two of Cups',         symbol: '💕', color: '#f48fb1', meaning: '伙伴、结合、互相吸引、和谐',       element: 'water', spell: '水之共鸣', spellSub: 'Water of Harmony',    image: '塔罗牌完整/圣杯/圣杯02.jpg' },
  { id: 'Cu03', name: '圣杯三',   nameEn: 'Three of Cups',       symbol: '🎉', color: '#ce93d8', meaning: '友谊、庆祝、合作、欢乐',           element: 'water', spell: '水之欢歌', spellSub: 'Water of Celebration',image: '塔罗牌完整/圣杯/圣杯03.jpg' },
  { id: 'Cu04', name: '圣杯四',   nameEn: 'Four of Cups',        symbol: '😑', color: '#90a4ae', meaning: '倦怠、不满足、忽视机会、内省',     element: 'water', spell: '水之冷淡', spellSub: 'Water of Apathy',     image: '塔罗牌完整/圣杯/圣杯04.jpg' },
  { id: 'Cu05', name: '圣杯五',   nameEn: 'Five of Cups',        symbol: '😢', color: '#546e7a', meaning: '失落、遗憾、悲伤、未看到的希望',   element: 'water', spell: '水之遗恨', spellSub: 'Water of Regret',     image: '塔罗牌完整/圣杯/圣杯05.jpg' },
  { id: 'Cu06', name: '圣杯六',   nameEn: 'Six of Cups',         symbol: '🌸', color: '#b39ddb', meaning: '回忆、天真、旧时美好、重逢',       element: 'water', spell: '水之怀念', spellSub: 'Water of Memory',     image: '塔罗牌完整/圣杯/圣杯06.jpg' },
  { id: 'Cu07', name: '圣杯七',   nameEn: 'Seven of Cups',       symbol: '🌈', color: '#9575cd', meaning: '幻想、选择过多、白日梦、诱惑',     element: 'water', spell: '水之幻梦', spellSub: 'Water of Fantasy',    image: '塔罗牌完整/圣杯/圣杯07.jpg' },
  { id: 'Cu08', name: '圣杯八',   nameEn: 'Eight of Cups',       symbol: '🚶', color: '#5c6bc0', meaning: '离开、放弃、追寻更深意义',         element: 'water', spell: '水之远行', spellSub: 'Water of Departure',  image: '塔罗牌完整/圣杯/圣杯08.jpg' },
  { id: 'Cu09', name: '圣杯九',   nameEn: 'Nine of Cups',        symbol: '🌟', color: '#ffd54f', meaning: '满足、愿望成真、幸福、享乐',       element: 'water', spell: '水之圆满', spellSub: 'Water of Fulfillment',image: '塔罗牌完整/圣杯/圣杯09.jpg' },
  { id: 'Cu10', name: '圣杯十',   nameEn: 'Ten of Cups',         symbol: '🌈', color: '#81d4fa', meaning: '幸福美满、家庭和睦、情感圆满',     element: 'water', spell: '水之至福', spellSub: 'Water of Bliss',      image: '塔罗牌完整/圣杯/圣杯10.jpg' },
  { id: 'CuPa', name: '圣杯侍从', nameEn: 'Page of Cups',        symbol: '🧚', color: '#80cbc4', meaning: '创意、直觉、新感情、惊喜',         element: 'water', spell: '水之使者', spellSub: 'Page of Water',       image: '塔罗牌完整/圣杯/圣杯Page.jpg' },
  { id: 'CuKn', name: '圣杯骑士', nameEn: 'Knight of Cups',      symbol: '🤴', color: '#7986cb', meaning: '浪漫、追求、理想主义、感性',       element: 'water', spell: '水之骑士', spellSub: 'Knight of Water',     image: '塔罗牌完整/圣杯/圣杯Knight.jpg' },
  { id: 'CuQu', name: '圣杯王后', nameEn: 'Queen of Cups',       symbol: '👸', color: '#4db6ac', meaning: '温柔、共情、直觉、情感疗愈',       element: 'water', spell: '水之女王', spellSub: 'Queen of Water',      image: '塔罗牌完整/圣杯/圣杯Queen.jpg' },
  { id: 'CuKi', name: '圣杯国王', nameEn: 'King of Cups',        symbol: '🔱', color: '#26a69a', meaning: '情感成熟、慷慨、外交手腕、从容',   element: 'water', spell: '水之王者', spellSub: 'King of Water',       image: '塔罗牌完整/圣杯/圣杯King.jpg' },

  // ============================================================
  // === 星币 (Pentacles) — 光/地元素 ===
  // ============================================================
  { id: 'Pe01', name: '星币王牌', nameEn: 'Ace of Pentacles',    symbol: '💰', color: '#ffd700', meaning: '新财富、机遇、繁荣、物质基础',     element: 'light', spell: '金之萌芽', spellSub: 'Gold of Seed',        image: '塔罗牌完整/星币/星币01.jpg' },
  { id: 'Pe02', name: '星币二',   nameEn: 'Two of Pentacles',    symbol: '🤹', color: '#ffb74d', meaning: '平衡、适应、灵活、多线程管理',     element: 'light', spell: '金之平衡', spellSub: 'Gold of Balance',     image: '塔罗牌完整/星币/星币02.jpg' },
  { id: 'Pe03', name: '星币三',   nameEn: 'Three of Pentacles',  symbol: '🏗️', color: '#ffb74d', meaning: '团队合作、技能、规划、精益求精',   element: 'light', spell: '金之匠心', spellSub: 'Gold of Craft',       image: '塔罗牌完整/星币/星币03.jpg' },
  { id: 'Pe04', name: '星币四',   nameEn: 'Four of Pentacles',   symbol: '🏦', color: '#a1887f', meaning: '守财、控制、安全感、吝啬',         element: 'light', spell: '金之守护', spellSub: 'Gold of Guarding',    image: '塔罗牌完整/星币/星币04.jpg' },
  { id: 'Pe05', name: '星币五',   nameEn: 'Five of Pentacles',   symbol: '❄️', color: '#78909c', meaning: '困难、匮乏、孤立、被排斥感',       element: 'light', spell: '金之寒冬', spellSub: 'Gold of Hardship',    image: '塔罗牌完整/星币/星币05.jpg' },
  { id: 'Pe06', name: '星币六',   nameEn: 'Six of Pentacles',    symbol: '🤝', color: '#a5d6a7', meaning: '慷慨、分享、平衡、互惠',           element: 'light', spell: '金之施予', spellSub: 'Gold of Giving',      image: '塔罗牌完整/星币/星币06.jpg' },
  { id: 'Pe07', name: '星币七',   nameEn: 'Seven of Pentacles',  symbol: '🌱', color: '#81c784', meaning: '耐心、长期投资、等待收成、评估',   element: 'light', spell: '金之等待', spellSub: 'Gold of Patience',    image: '塔罗牌完整/星币/星币07.jpg' },
  { id: 'Pe08', name: '星币八',   nameEn: 'Eight of Pentacles',  symbol: '🔨', color: '#bcaaa4', meaning: '勤奋、精进、学习、专注',           element: 'light', spell: '金之磨砺', spellSub: 'Gold of Practice',    image: '塔罗牌完整/星币/星币08.jpg' },
  { id: 'Pe09', name: '星币九',   nameEn: 'Nine of Pentacles',   symbol: '🦚', color: '#c5e1a5', meaning: '成就、独立、富足、自给自足',       element: 'light', spell: '金之丰裕', spellSub: 'Gold of Abundance',   image: '塔罗牌完整/星币/星币09.jpg' },
  { id: 'Pe10', name: '星币十',   nameEn: 'Ten of Pentacles',    symbol: '🏰', color: '#ffd700', meaning: '传承、财富、家族、长久稳定',       element: 'light', spell: '金之传承', spellSub: 'Gold of Legacy',      image: '塔罗牌完整/星币/星币10.jpg' },
  { id: 'PePa', name: '星币侍从', nameEn: 'Page of Pentacles',   symbol: '📚', color: '#dce775', meaning: '学习、新技能、脚踏实地、好奇',     element: 'light', spell: '金之使者', spellSub: 'Page of Gold',        image: '塔罗牌完整/星币/星币Page.jpg' },
  { id: 'PeKn', name: '星币骑士', nameEn: 'Knight of Pentacles',  symbol: '🐎', color: '#8d6e63', meaning: '稳健、可靠、耐心、务实',           element: 'light', spell: '金之骑士', spellSub: 'Knight of Gold',      image: '塔罗牌完整/星币/星币Knight.jpg' },
  { id: 'PeQu', name: '星币王后', nameEn: 'Queen of Pentacles',  symbol: '👸', color: '#a5d6a7', meaning: '务实、慷慨、安全感、生活品质',     element: 'light', spell: '金之女王', spellSub: 'Queen of Gold',       image: '塔罗牌完整/星币/星币Queen.jpg' },
  { id: 'PeKi', name: '星币国王', nameEn: 'King of Pentacles',   symbol: '🏛️', color: '#8d6e63', meaning: '财富、稳定、商业头脑、慷慨',       element: 'light', spell: '金之王者', spellSub: 'King of Gold',        image: '塔罗牌完整/星币/星币King.jpg' },
];

/* ========================================
   3D 环形旋转木马 (Carousel) v7
   - 10张物理牌 · 展示多种背面
   - 丝滑连续旋转（手势速度映射到角速度）
   ======================================== */

// 背面图片池
const CARD_BACK_IMAGES = [
  '塔罗牌背面/1.jpg',
  '塔罗牌背面/2.jpg',
  '塔罗牌背面/3.jpg',
  '塔罗牌背面/4.jpg',
  '塔罗牌背面/5.jpg',
  '塔罗牌背面/6.jpg',
  '塔罗牌背面/7.jpg',
  '塔罗牌背面/8.jpg',
  '塔罗牌背面/9.jpg',
];

class CardCarousel {
  constructor() {
    this.container = document.getElementById('carousel');
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.totalCards = CARDS.length;
    this.ringSize = 10;
    this.anglePerCard = 360 / this.ringSize;
    this.radius = 320;
    this.cards = [];
    this._animFrame = null;
    this._velocity = 0;
    this._friction = 0.88;
    this._isAnimating = false;
    this._isStacked = true;
  }

  create() {
    this.container.innerHTML = '';
    this.cards = [];
    this._isStacked = true;

    const shuffledBacks = [...CARD_BACK_IMAGES].sort(() => Math.random() - 0.5);

    for (let i = 0; i < this.ringSize; i++) {
      const backImg = shuffledBacks[i % shuffledBacks.length];
      const el = document.createElement('div');
      el.className = 'carousel-card';
      el.dataset.ringIndex = i;
      el.innerHTML = `
        <div class="card-flipper">
          <div class="card-back">
            <img class="card-back-img" src="${backImg}" alt="牌背">
          </div>
        </div>
      `;

      el.style.transform = 'rotateY(0deg) translateZ(0px)';
      el.style.transition = 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)';

      this.container.appendChild(el);
      this.cards.push(el);
    }

    // 初始化角度为 0，使第 0 张牌正对用户
    this.currentAngle = 0;
    this._updateData();
    this._applyRotation();
  }

  spreadOut() {
    if (!this._isStacked) return;
    this._isStacked = false;

    this.cards.forEach((el, i) => {
      el.style.transition = `transform ${0.8 + i * 0.08}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
      const angle = this.anglePerCard * i;
      el.style.transform = `rotateY(${angle}deg) translateZ(${this.radius}px)`;
    });

    setTimeout(() => {
      this.cards.forEach(el => {
        el.style.transition = 'filter 0.4s, opacity 0.4s';
      });
      this._updateFrontCard();
    }, 1600);
  }

  stackUp() {
    this._isStacked = true;
    this._velocity = 0;
    this._isAnimating = false;
    this.currentAngle = 0;

    this.cards.forEach((el) => {
      el.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
      el.style.transform = 'rotateY(0deg) translateZ(0px)';
    });
  }

  /**
   * 原始步进索引（与 currentAngle 一致，未取模），用于轮环上物理槽位与 78 张牌的对应关系。
   * 若仅用「逻辑牌序 % 78」再 % 10 计算槽位，会错（例如步进 78 与 0 逻辑同为 0，但槽位应为 8 而非 0）。
   */
  getRawIndex() {
    return Math.round(-this.currentAngle / this.anglePerCard);
  }

  getCurrentIndex() {
    const idx = this.getRawIndex();
    return ((idx % this.totalCards) + this.totalCards) % this.totalCards;
  }

  getCurrentCard() {
    return CARDS[this.getCurrentIndex()];
  }

  addVelocity(v) {
    if (this._isStacked) return;
    this._velocity += v;
    this._startPhysics();
  }

  _startPhysics() {
    if (this._isAnimating) return;
    this._isAnimating = true;
    this._physicsLoop();
  }

  _physicsLoop() {
    this._velocity *= this._friction;
    this.currentAngle += this._velocity;

    this._updateData();
    this._applyRotation();
    this._updateFrontCard();

    if (Math.abs(this._velocity) > 0.1) {
      this._animFrame = requestAnimationFrame(() => this._physicsLoop());
    } else {
      this._velocity = 0;
      this._snapToNearest();
      this._isAnimating = false;
    }
  }

  _snapToNearest() {
    // 计算最近的牌位角度（基于 anglePerCard）
    const snapAngle = Math.round(this.currentAngle / this.anglePerCard) * this.anglePerCard;
    this.currentAngle = snapAngle;
    this._updateData();
    this._applyRotation();
    this._updateFrontCard();

    if (this.onSnap) this.onSnap();
  }

  rotateTo(index, animate = true) {
    const target = -index * this.anglePerCard;
    if (animate) {
      this._velocity = (target - this.currentAngle) * 0.1;
      this._startPhysics();
    } else {
      this.currentAngle = target;
      this._velocity = 0;
      this._updateData();
      this._applyRotation();
      this._updateFrontCard();
    }
  }

  rotateBy(dir) {
    this.addVelocity(-dir * this.anglePerCard * 0.3);
  }

  _applyRotation() {
    this.container.style.transition = 'none';
    this.container.style.transform = `rotateY(${this.currentAngle}deg)`;
  }

  _updateFrontCard() {
    const raw = this.getRawIndex();
    const frontRingIndex = ((raw % this.ringSize) + this.ringSize) % this.ringSize;

    this.cards.forEach((card, i) => {
      card.classList.toggle('front-card', i === frontRingIndex);
    });
  }

  _updateData() {
    const logicalCenter = this.getCurrentIndex();
    const frontRing = ((this.getRawIndex() % this.ringSize) + this.ringSize) % this.ringSize;

    for (let i = 0; i < this.ringSize; i++) {
      let logicalIndex = logicalCenter + (i - frontRing);
      logicalIndex = ((logicalIndex % this.totalCards) + this.totalCards) % this.totalCards;

      const el = this.cards[i];
      el.dataset.logicalIndex = logicalIndex;
      el.classList.remove('flipped');
    }
  }

  flipFrontCard() {
    const raw = this.getRawIndex();
    const frontRingIndex = ((raw % this.ringSize) + this.ringSize) % this.ringSize;
    const el = this.cards[frontRingIndex];
    el.classList.add('flipped');
  }

  setFocused(focused) {
    const raw = this.getRawIndex();
    const frontRingIndex = ((raw % this.ringSize) + this.ringSize) % this.ringSize;

    this.cards.forEach(card => card.classList.remove('focused-card'));

    if (focused) {
      this.cards[frontRingIndex].classList.add('focused-card');
    }
  }

  playEnterAnimation() {
    this.container.classList.add('entering');
    this.cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.animationDelay = `${i * 0.08}s`;
    });

    setTimeout(() => {
      this.container.classList.remove('entering');
      this.cards.forEach(card => {
        card.style.opacity = '1';
        card.style.animationDelay = '';
      });
    }, 1200);
  }
}

/**
 * 初始化底盘符文点
 */
function initPlatformRunes() {
  const container = document.getElementById('platform-runes');
  if (!container) return;
  const count = 24;
  const r = 210;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const dot = document.createElement('div');
    dot.className = 'rune-dot';
    dot.style.left = `${50 + (Math.cos(angle) * r / 440) * 100}%`;
    dot.style.top = `${50 + (Math.sin(angle) * r / 440) * 100}%`;
    dot.style.animationDelay = `${i * 0.1}s`;
    container.appendChild(dot);
  }
}
