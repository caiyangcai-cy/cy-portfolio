/* ========================================
   手势识别引擎 v5 (塔罗占卜)
   基于 MediaPipe Hands (Tasks Vision API)
   
   v5 变更：
   - 滑动手势改为连续速度映射（丝滑滑动）
   - 新增 PINCH_RELEASE（捏合后松手释放）
   ======================================== */

const GESTURE = {
  NONE: 'none',
  FIST: 'fist',
  OPEN_PALM: 'open_palm',
  POINT: 'point',
  TWO_POINT: 'two_point',
  PINCH: 'pinch',
  PINCH_RELEASE: 'pinch_release',  // 捏合后松手
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  SWIPE_CONTINUOUS: 'swipe_continuous',  // 连续滑动（带速度值）
};

/** 完整模型约 7.6MB；小于 5MB 视为损坏或未下完 */
const HAND_MODEL_MIN_BYTES = 5 * 1024 * 1024;
const HAND_MODEL_REMOTE =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const HAND_MODEL_MIRRORS = [
  'https://hf-mirror.com/lithiumice/models_hub/resolve/8a7b241f38e33d194a06f881a1211b3e7eda4edd/hand_landmarker.task',
  HAND_MODEL_REMOTE,
];

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

/**
 * 先用本地 models/hand_landmarker.task（可 npm run fetch-model 下载），失败再拉远程，均带超时，避免无限卡住
 */
async function fetchHandModelBuffer(onStatus) {
  const tryOnce = async (url, label, timeoutMs, useCache = false) => {
    onStatus?.(label);
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const fetchOpts = { signal: ctrl.signal, mode: 'cors' };
      if (!useCache) fetchOpts.cache = 'no-cache';
      const res = await fetch(url, fetchOpts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < HAND_MODEL_MIN_BYTES) {
        throw new Error(`文件过小（${buf.byteLength} 字节），可能未下载完整`);
      }
      return buf;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error(`下载超时（>${timeoutMs / 1000}s）`);
      throw e;
    } finally {
      clearTimeout(tid);
    }
  };

  const localUrl = new URL('models/hand_landmarker.task', window.location.href).href;
  try {
    return await tryOnce(localUrl, '正在加载本地手势模型…', 20000, true);
  } catch (e) {
    console.warn('本地手势模型不可用:', e?.message || e);
  }

  const t0 = Date.now();
  const tick = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    onStatus?.(`正在下载手势模型… ${s}s（约 8MB，请勿关闭页面）`);
  }, 1000);
  try {
    for (let i = 0; i < HAND_MODEL_MIRRORS.length; i++) {
      const url = HAND_MODEL_MIRRORS[i];
      const label = i === 0 ? '正在从镜像服务器下载…' : `正在尝试备用源(${i + 1}/${HAND_MODEL_MIRRORS.length})…`;
      try {
        return await tryOnce(url, label, 60000);
      } catch (e) {
        console.warn(`模型下载源 ${i + 1} 失败:`, e?.message || e);
        if (i < HAND_MODEL_MIRRORS.length - 1) continue;
        throw e;
      }
    }
  } catch (e) {
    const detail = e?.message || String(e);
    const tip = '国内网络可能无法直接访问 Google 存储。\n请尝试：\n1. 开启VPN/代理后刷新页面\n2. 或手动下载模型文件放到 models/hand_landmarker.task';
    throw new Error(`手势模型下载失败：${detail}\n\n${tip}`);
  } finally {
    clearInterval(tick);
  }
}

class GestureEngine {
  constructor() {
    this.handLandmarker = null;
    this._handModelBlobUrl = null;
    this.video = null;
    this.running = false;
    this.mirrored = true;

    // 回调
    this.onGesture = null;
    this.onHandUpdate = null;
    this.onSwipeDelta = null;  // (deltaX) => void  连续滑动回调

    // 手势历史
    this.palmHistory = [];
    this.lastGesture = GESTURE.NONE;
    this.gestureStartTime = 0;

    // 捏合状态机
    this.pinchStartTime = 0;
    this.PINCH_HOLD_MS = 300;
    this.isPinching = false;      // 当前是否处于捏合状态
    this._pinchConfirmed = false; // 已确认进入捏合

    // 双指
    this.twoPointStartTime = 0;
    this.TWO_POINT_HOLD_MS = 300;

    // 防抖 & 冷却
    this.cooldowns = {};
    this.COOLDOWN_MS = 350;
    this.SWIPE_COOLDOWN_MS = 300;
    // 特定手势的冷却时间（ms）
    this.GESTURE_COOLDOWNS = {
      [GESTURE.FIST]: 800,
      [GESTURE.OPEN_PALM]: 500,
      [GESTURE.POINT]: 500,
      [GESTURE.TWO_POINT]: 500,
    };

    // 连续滑动参数
    this.SWIPE_THRESHOLD = 0.08;
    this.SWIPE_SPEED_MIN = 0.15;
    this.lastPalmX = null;
    this._lastSwipeDelta = 0;

    // FPS（按实际推理次数统计）
    this.frameCount = 0;
    this.lastFpsTime = 0;
    this.fps = 0;
    /** 每 N 次 rAF 才跑一次 detectForVideo，显著降 CPU（Safari 常只有 CPU WASM） */
    this._inferStride = 2;
    this._inferTick = 0;
    this._cachedVideoResults = null;

    // 调试
    this.debugData = {
      gesture: GESTURE.NONE,
      handsCount: 0,
      confidence: 0,
      landmarks: null,
    };
  }

  async init(videoElement, options = {}) {
    this.video = videoElement;
    const onStatus = typeof options.onStatus === 'function' ? options.onStatus : null;
    if (options.inferStride != null) {
      const n = Math.floor(Number(options.inferStride));
      this._inferStride = n >= 1 && n <= 4 ? n : 2;
    }

    const { HandLandmarker, FilesetResolver } = window;
    if (!HandLandmarker || !FilesetResolver) {
      throw new Error('MediaPipe 未加载完成，请刷新重试');
    }

    const wasmPath = window._wasmBasePath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
    onStatus?.('正在初始化推理引擎（WASM）…');
    const vision = await withTimeout(
      FilesetResolver.forVisionTasks(wasmPath),
      60000,
      'WASM 加载超时（>60s），请检查网络或关闭代理后重试'
    );

    let modelAssetPath;
    try {
      const modelBuf = await fetchHandModelBuffer(onStatus);
      if (this._handModelBlobUrl) {
        URL.revokeObjectURL(this._handModelBlobUrl);
        this._handModelBlobUrl = null;
      }
      this._handModelBlobUrl = URL.createObjectURL(new Blob([modelBuf], { type: 'application/octet-stream' }));
      modelAssetPath = this._handModelBlobUrl;
    } catch (e) {
      console.warn('手势模型本地/完整下载不可用，改用在线地址:', e?.message || e);
      modelAssetPath = HAND_MODEL_REMOTE;
    }

    const makeOptions = (delegate) => ({
      baseOptions: {
        modelAssetPath,
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });

    let lastError = null;
    onStatus?.('正在启动手势识别…');
    for (const delegate of ['GPU', 'CPU']) {
      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, makeOptions(delegate));
        if (delegate === 'CPU') {
          console.warn('HandLandmarker 已使用 CPU 后端（GPU 不可用或初始化失败）');
        }
        return true;
      } catch (e) {
        lastError = e;
        console.warn(`HandLandmarker ${delegate} 初始化失败:`, e?.message || e);
      }
    }

    throw lastError || new Error('HandLandmarker 初始化失败');
  }

  start() {
    this.running = true;
    this.lastFpsTime = performance.now();
    this._detect();
  }

  stop() {
    this.running = false;
  }

  _detect() {
    if (!this.running) return;

    const now = performance.now();
    const doInfer = this._inferTick % this._inferStride === 0;
    this._inferTick += 1;

    // 非推理帧：用 setTimeout 延迟到下一帧，比 rAF 轻量
    if (!doInfer || this.video.readyState < 2) {
      setTimeout(() => this._detect(), 16);
      return;
    }

    // 推理帧：执行手势检测
    const results = this.handLandmarker.detectForVideo(this.video, now);
    this._cachedVideoResults = results;
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    this.debugData.handsCount = results?.landmarks?.length || 0;
    this.debugData.landmarks = results?.landmarks;

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks[0];
      const handedness = results.handednesses?.[0]?.[0];
      this.debugData.confidence = handedness ? (handedness.score * 100).toFixed(0) : 0;

      const gesture = this._analyzeGesture(hand, now);
      this.debugData.gesture = gesture;

      if (gesture !== GESTURE.NONE && this.onGesture) {
        if (gesture === GESTURE.PINCH_RELEASE || gesture === GESTURE.SWIPE_CONTINUOUS) {
          this.onGesture(gesture, hand);
        } else if (this._checkCooldown(gesture, now)) {
          this.onGesture(gesture, hand);
        }
      }
    } else {
      if (this._pinchConfirmed) {
        this._pinchConfirmed = false;
        this.isPinching = false;
        if (this.onGesture) {
          this.onGesture(GESTURE.PINCH_RELEASE, null);
        }
      }
      this.debugData.gesture = GESTURE.NONE;
      this.debugData.confidence = 0;
      this.palmHistory = [];
      this.pinchStartTime = 0;
      this.lastPalmX = null;
    }

    if (this.onHandUpdate && results) {
      this.onHandUpdate(results);
    }

    setTimeout(() => this._detect(), 16);
  }

  _analyzeGesture(hand, now) {
    const fingers = this._getFingerStates(hand);
    const { thumb, index, middle, ring, pinky } = fingers;

    // 计算拇指和食指的距离
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const pinchDist = Math.sqrt(dx * dx + dy * dy);

    // === 捏合/松手 两阶段 ===
    if (pinchDist < 0.05) {
      this.palmHistory = [];
      this.lastPalmX = null;
      
      if (this.pinchStartTime === 0) {
        this.pinchStartTime = now;
      }
      
      if (!this._pinchConfirmed && (now - this.pinchStartTime >= this.PINCH_HOLD_MS)) {
        this._pinchConfirmed = true;
        this.isPinching = true;
        this.pinchStartTime = 0;
        return GESTURE.PINCH;
      }
      
      return GESTURE.NONE;
    }
    
    // 不再捏合了 — 检查是否该释放
    if (this._pinchConfirmed) {
      this._pinchConfirmed = false;
      this.isPinching = false;
      this.pinchStartTime = 0;
      return GESTURE.PINCH_RELEASE;
    }
    this.pinchStartTime = 0;

    // === 握拳 ===
    if (!thumb && !index && !middle && !ring && !pinky) {
      this.palmHistory = [];
      this.twoPointStartTime = 0;
      this.lastPalmX = null;
      return GESTURE.FIST;
    }

    // === 双指 ===
    if (index && middle && !ring && !pinky) {
      this.palmHistory = [];
      this.lastPalmX = null;
      if (this.twoPointStartTime === 0) {
        this.twoPointStartTime = now;
      }
      if (now - this.twoPointStartTime >= this.TWO_POINT_HOLD_MS) {
        this.twoPointStartTime = 0;
        return GESTURE.TWO_POINT;
      }
      return GESTURE.NONE;
    }
    this.twoPointStartTime = 0;

    // === 张开手掌 — 连续滑动（小指不要求伸直，避免误判成单指 POINT） ===
    if (index && middle && ring && pinchDist >= 0.05) {
      const palmCenter = hand[9];
      const currentX = palmCenter.x;

      // 连续滑动：每帧计算与上一帧的差值
      if (this.lastPalmX !== null) {
        const deltaX = currentX - this.lastPalmX;
        
        // 只有较大幅度移动才触发连续滑动（避免手部抖动误触发）
        if (Math.abs(deltaX) > 0.008) {
          this.lastPalmX = currentX;
          
          // 传递 deltaX 给回调
          // mirrored 模式下摄像头画面已翻转，手往右（物理）→ 画面中手往左
          // 但 landmark x 是原始坐标（未镜像），所以 mirrored 时反转才正确
          this._lastSwipeDelta = this.mirrored ? deltaX : -deltaX;
          
          // 也保留离散滑动检测
          this.palmHistory.push({ x: palmCenter.x, y: palmCenter.y, time: now });
          this.palmHistory = this.palmHistory.filter(p => now - p.time < 600);

          return GESTURE.SWIPE_CONTINUOUS;
        }
      }

      this.lastPalmX = currentX;

      this.palmHistory.push({ x: palmCenter.x, y: palmCenter.y, time: now });
      this.palmHistory = this.palmHistory.filter(p => now - p.time < 600);

      return GESTURE.OPEN_PALM;
    }

    this.lastPalmX = null;

    // === 单指 ===
    if (index && !middle && !ring && !pinky) {
      this.palmHistory = [];
      return GESTURE.POINT;
    }

    return GESTURE.NONE;
  }

  /**
   * 获取最近一次连续滑动的 delta 值
   */
  getSwipeDelta() {
    const d = this._lastSwipeDelta || 0;
    this._lastSwipeDelta = 0;
    return d;
  }

  _getFingerStates(hand) {
    const wrist = hand[0];

    const thumbTip = hand[4];
    const thumbIP = hand[3];
    const thumb = Math.abs(thumbTip.x - wrist.x) > Math.abs(thumbIP.x - wrist.x);

    // 添加 0.02 的容差，指尖必须明显高于 PIP 关节才判定为伸直
    // 这能有效解决比 ✌🏻 时，无名指/小指没有完全攥紧导致误判的问题
    const index = hand[8].y < hand[6].y - 0.02;
    const middle = hand[12].y < hand[10].y - 0.02;
    const ring = hand[16].y < hand[14].y - 0.02;
    const pinky = hand[20].y < hand[18].y - 0.02;

    return { thumb, index, middle, ring, pinky };
  }

  _checkCooldown(gesture, now) {
    const cooldownTime = this.GESTURE_COOLDOWNS[gesture]
      || ((gesture === GESTURE.SWIPE_LEFT || gesture === GESTURE.SWIPE_RIGHT)
        ? this.SWIPE_COOLDOWN_MS
        : this.COOLDOWN_MS);

    const lastTime = this.cooldowns[gesture] || 0;
    if (now - lastTime < cooldownTime) return false;

    this.cooldowns[gesture] = now;
    return true;
  }
}
