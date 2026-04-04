/* ========================================
   手势识别引擎 v3
   基于 MediaPipe Hands (Tasks Vision API)
   
   手势变更：TWO_UP → TWO_POINT（双指指着，静态手势）
   ======================================== */

const GESTURE = {
  NONE: 'none',
  FIST: 'fist',               // 握拳
  OPEN_PALM: 'open_palm',     // 张开手掌
  POINT: 'point',             // 伸出食指（单指）
  TWO_POINT: 'two_point',     // 双指指着（食指+中指伸出，静态）
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
};

class GestureEngine {
  constructor() {
    this.handLandmarker = null;
    this.video = null;
    this.running = false;
    this.mirrored = true;

    // 回调
    this.onGesture = null;       // (gesture, landmarks) => void
    this.onHandUpdate = null;    // (results) => void

    // 手势历史（用于动态手势检测）
    this.palmHistory = [];       // [{x, y, time}, ...]
    this.lastGesture = GESTURE.NONE;
    this.gestureStartTime = 0;

    // 双指指着持续时间检测
    this.twoPointStartTime = 0;
    this.TWO_POINT_HOLD_MS = 500; // 双指指着需要保持 500ms 才触发

    // 防抖 & 冷却
    this.cooldowns = {};
    this.COOLDOWN_MS = 600;
    this.SWIPE_COOLDOWN_MS = 400;

    // 手掌方向检测参数
    this.SWIPE_THRESHOLD = 0.08;
    this.SWIPE_SPEED_MIN = 0.15;

    // FPS
    this.frameCount = 0;
    this.lastFpsTime = 0;
    this.fps = 0;

    // 调试数据
    this.debugData = {
      gesture: GESTURE.NONE,
      handsCount: 0,
      confidence: 0,
      landmarks: null,
    };
  }

  async init(videoElement) {
    this.video = videoElement;

    const { HandLandmarker, FilesetResolver } = window;

    const wasmPath = window._wasmBasePath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
    const vision = await FilesetResolver.forVisionTasks(wasmPath);

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    return true;
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

    // FPS 计算
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    if (this.video.readyState >= 2) {
      const results = this.handLandmarker.detectForVideo(this.video, now);

      this.debugData.handsCount = results.landmarks?.length || 0;
      this.debugData.landmarks = results.landmarks;

      if (results.landmarks && results.landmarks.length > 0) {
        const hand = results.landmarks[0];
        const handedness = results.handednesses?.[0]?.[0];
        this.debugData.confidence = handedness ? (handedness.score * 100).toFixed(0) : 0;

        const gesture = this._analyzeGesture(hand, now);
        this.debugData.gesture = gesture;

        if (gesture !== GESTURE.NONE && this.onGesture) {
          if (this._checkCooldown(gesture, now)) {
            this.onGesture(gesture, hand);
          }
        }
      } else {
        this.debugData.gesture = GESTURE.NONE;
        this.debugData.confidence = 0;
        this.palmHistory = [];
        this.twoPointStartTime = 0;
      }

      if (this.onHandUpdate) {
        this.onHandUpdate(results);
      }
    }

    requestAnimationFrame(() => this._detect());
  }

  _analyzeGesture(hand, now) {
    const fingers = this._getFingerStates(hand);
    const { thumb, index, middle, ring, pinky } = fingers;

    // 握拳：所有手指都弯曲
    if (!thumb && !index && !middle && !ring && !pinky) {
      this.palmHistory = [];
      this.twoPointStartTime = 0;
      return GESTURE.FIST;
    }

    // 双指指着（食指 + 中指伸出，其余弯曲）— 静态手势，需要保持一段时间
    if (index && middle && !ring && !pinky) {
      this.palmHistory = [];

      // 记录开始时间
      if (this.twoPointStartTime === 0) {
        this.twoPointStartTime = now;
      }

      // 检查是否保持了足够时间
      if (now - this.twoPointStartTime >= this.TWO_POINT_HOLD_MS) {
        this.twoPointStartTime = 0; // 重置，触发后需要重新保持
        return GESTURE.TWO_POINT;
      }

      return GESTURE.NONE; // 还在保持中，暂不触发
    }

    // 不是双指状态，重置双指计时
    this.twoPointStartTime = 0;

    // 单指（只有食指伸出）
    if (index && !middle && !ring && !pinky) {
      this.palmHistory = [];
      return GESTURE.POINT;
    }

    // 张开手掌：所有手指都伸展
    if (index && middle && ring && pinky) {
      const palmCenter = hand[9];

      this.palmHistory.push({ x: palmCenter.x, y: palmCenter.y, time: now });
      this.palmHistory = this.palmHistory.filter(p => now - p.time < 600);

      // 检测左右滑动
      if (this.palmHistory.length >= 4) {
        const first = this.palmHistory[0];
        const last = this.palmHistory[this.palmHistory.length - 1];
        const dx = last.x - first.x;
        const dt = (last.time - first.time) / 1000;
        const speed = Math.abs(dx) / dt;

        if (Math.abs(dx) > this.SWIPE_THRESHOLD && speed > this.SWIPE_SPEED_MIN) {
          this.palmHistory = [];
          if (this.mirrored) {
            return dx > 0 ? GESTURE.SWIPE_LEFT : GESTURE.SWIPE_RIGHT;
          }
          return dx > 0 ? GESTURE.SWIPE_RIGHT : GESTURE.SWIPE_LEFT;
        }
      }

      return GESTURE.OPEN_PALM;
    }

    return GESTURE.NONE;
  }

  _getFingerStates(hand) {
    const wrist = hand[0];

    const thumbTip = hand[4];
    const thumbIP = hand[3];
    const thumb = Math.abs(thumbTip.x - wrist.x) > Math.abs(thumbIP.x - wrist.x);

    const index = hand[8].y < hand[6].y;
    const middle = hand[12].y < hand[10].y;
    const ring = hand[16].y < hand[14].y;
    const pinky = hand[20].y < hand[18].y;

    return { thumb, index, middle, ring, pinky };
  }

  _checkCooldown(gesture, now) {
    const cooldownTime = (gesture === GESTURE.SWIPE_LEFT || gesture === GESTURE.SWIPE_RIGHT)
      ? this.SWIPE_COOLDOWN_MS
      : this.COOLDOWN_MS;

    const lastTime = this.cooldowns[gesture] || 0;
    if (now - lastTime < cooldownTime) return false;

    this.cooldowns[gesture] = now;
    return true;
  }
}
