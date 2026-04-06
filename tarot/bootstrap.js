/* ========================================
   Bootstrap: 加载 MediaPipe 模块然后启动应用
   多 CDN 容灾 + 超时处理
   ======================================== */

const CDN_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs',
  'https://unpkg.com/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs',
];

const WASM_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
  'https://unpkg.com/@mediapipe/tasks-vision@0.10.18/wasm',
];

const statusEl = document.getElementById('loading-status');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

/**
 * file:// 下摄像头无法使用，动态 import 跨域资源也常失败，提前说明避免白屏误判
 */
function blockInsecureDocumentOrigin() {
  if (location.protocol !== 'file:') return false;

  const hint =
    '请勿直接双击打开 HTML。请在本机终端进入项目目录后执行：\npython3 -m http.server 8765 --bind 127.0.0.1\n然后在浏览器打开：http://127.0.0.1:8765/\n（或运行 npm start）';
  setStatus('需要本地服务器（摄像头与安全上下文）');
  console.warn(hint.replace(/\n/g, ' '));

  const loading = document.getElementById('loading-screen');
  if (loading && !document.getElementById('insecure-origin-hint')) {
    const p = document.createElement('p');
    p.id = 'insecure-origin-hint';
    p.style.cssText =
      'max-width:min(92vw,380px);margin:16px auto 0;padding:0 12px;line-height:1.55;font-size:13px;color:#d4c4ff;text-align:left;white-space:pre-wrap;';
    p.textContent = hint;
    loading.appendChild(p);
  }

  if (loading && !document.getElementById('btn-open-localhost')) {
    const btn = document.createElement('button');
    btn.id = 'btn-open-localhost';
    btn.type = 'button';
    btn.textContent = '打开说明（见控制台）';
    btn.style.cssText =
      'margin-top:14px;padding:10px 20px;border:1px solid rgba(255,215,0,0.45);background:rgba(30,20,50,0.6);color:#ffd700;border-radius:8px;font-size:14px;cursor:pointer;';
    btn.onclick = () => {
      console.info(
        '在项目目录执行：python3 -m http.server 8765 --bind 127.0.0.1\n然后访问 http://127.0.0.1:8765/'
      );
      setStatus('请在本机终端运行 python3 -m http.server 8765 --bind 127.0.0.1');
    };
    loading.appendChild(btn);
  }

  return true;
}

/**
 * 带超时的动态 import
 */
function importWithTimeout(url, timeoutMs = 25000) {
  return Promise.race([
    import(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`加载超时(${timeoutMs / 1000}s): ${url}`)), timeoutMs)
    ),
  ]);
}

/**
 * 依次尝试多个 CDN 源
 */
async function loadMediaPipe() {
  for (let i = 0; i < CDN_SOURCES.length; i++) {
    const src = CDN_SOURCES[i];
    const cdnName = new URL(src).hostname;
    try {
      setStatus(`正在从 ${cdnName} 加载模型库…(${i + 1}/${CDN_SOURCES.length})`);
      const module = await importWithTimeout(src, 25000);
      // 记住哪个 CDN 成功了，WASM 也用对应的
      window._wasmBasePath = WASM_SOURCES[i];
      return module;
    } catch (err) {
      console.warn(`CDN ${cdnName} 失败:`, err.message);
      if (i < CDN_SOURCES.length - 1) {
        setStatus(`${cdnName} 加载失败，正在切换备用源…`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  throw new Error('所有 CDN 源均加载失败，请检查网络连接');
}

// 主流程
(async () => {
  try {
    if (blockInsecureDocumentOrigin()) {
      return;
    }

    // ====== 第一阶段：显示欢迎页，等待用户点击 ======
    const welcomeScreen = document.getElementById('welcome-screen');
    const startBtn = document.getElementById('btn-start-ritual');

    // 在后台预加载 MediaPipe（不请求摄像头）
    let mediaPipeLoaded = false;
    const preloadPromise = (async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await loadMediaPipe();
        window.FilesetResolver = FilesetResolver;
        window.HandLandmarker = HandLandmarker;
        mediaPipeLoaded = true;
      } catch (mpErr) {
        console.warn('MediaPipe 预加载失败，将在点击后重试:', mpErr);
      }
    })();

    // 等待用户点击「开启占卜仪式」
    await new Promise(resolve => {
      const handler = (e) => {
        e.preventDefault();
        startBtn.removeEventListener('click', handler);
        startBtn.removeEventListener('touchend', handler);
        resolve();
      };
      startBtn.addEventListener('click', handler);
      startBtn.addEventListener('touchend', handler);
    });

    // ====== 第二阶段：淡出欢迎页，显示加载画面 ======
    welcomeScreen.classList.add('fading-out');

    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.remove('hidden');
    loadingScreen.style.display = '';

    setTimeout(() => {
      welcomeScreen.style.display = 'none';
    }, 800);

    // 确保 MediaPipe 已加载
    if (!mediaPipeLoaded) {
      setStatus('正在连接灵能核心…');
      try {
        const { FilesetResolver, HandLandmarker } = await loadMediaPipe();
        window.FilesetResolver = FilesetResolver;
        window.HandLandmarker = HandLandmarker;
      } catch (mpErr) {
        console.error('MediaPipe 加载失败:', mpErr);
        setStatus('⚠️ 模型加载失败，尝试继续…');
      }
    } else {
      // 预加载已完成，等它彻底 resolve
      await preloadPromise;
    }

    // ====== 第三阶段：启动应用 + 请求摄像头 ======
    const app = new App();
    await app.boot();
  } catch (err) {
    console.error('启动失败:', err);
    setStatus('⚠️ 启动失败: ' + err.message);

    // 隐藏欢迎页和加载页
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    const loading = document.getElementById('loading-screen');
    if (loading) {
      loading.style.display = 'none';
    }
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.classList.remove('hidden');
      appEl.style.display = '';
    }
    const qp = document.getElementById('question-panel');
    if (qp) {
      qp.classList.remove('hidden');
      qp.style.display = '';
      qp.style.opacity = '1';
    }

    // 显示重试按钮
    if (!document.getElementById('btn-bootstrap-retry')) {
      const btn = document.createElement('button');
      btn.id = 'btn-bootstrap-retry';
      btn.type = 'button';
      btn.textContent = '🔄 点击重试';
      btn.style.cssText = 'margin-top:20px;padding:12px 28px;border:2px solid #ffd700;background:transparent;color:#ffd700;border-radius:8px;font-size:16px;cursor:pointer;position:fixed;bottom:40px;left:50%;transform:translateX(-50%);z-index:9999;';
      btn.onclick = () => location.reload();
      document.body.appendChild(btn);
    }
  }
})();
