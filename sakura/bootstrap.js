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
 * 带超时的动态 import
 */
function importWithTimeout(url, timeoutMs = 15000) {
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
      const module = await importWithTimeout(src, 15000);
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
    setStatus('正在加载核心模型库…');
    const { FilesetResolver, HandLandmarker } = await loadMediaPipe();

    // 暴露给全局
    window.FilesetResolver = FilesetResolver;
    window.HandLandmarker = HandLandmarker;

    // 启动应用
    const app = new App();
    await app.boot();
  } catch (err) {
    console.error('启动失败:', err);
    setStatus('⚠️ 启动失败: ' + err.message);

    // 显示重试按钮
    const loading = document.getElementById('loading-screen');
    if (loading) {
      const btn = document.createElement('button');
      btn.textContent = '🔄 点击重试';
      btn.style.cssText = 'margin-top:20px;padding:12px 28px;border:2px solid #ffd700;background:transparent;color:#ffd700;border-radius:8px;font-size:16px;cursor:pointer;';
      btn.onclick = () => location.reload();
      loading.appendChild(btn);
    }
  }
})();
