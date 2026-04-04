/* Bootstrap: 加载 MediaPipe 后启动小樱塔罗手势版 */
const CDN_SOURCES = [
  './mediapipe/vision_bundle.mjs',
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs',
  'https://unpkg.com/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs',
];
const WASM_SOURCES = [
  './mediapipe/wasm',
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
  'https://unpkg.com/@mediapipe/tasks-vision@0.10.18/wasm',
];

const statusEl = document.getElementById('loading-status');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function blockInsecureDocumentOrigin() {
  if (location.protocol !== 'file:') return false;
  const hint =
    '请勿直接双击打开 HTML。请在项目目录执行：\npython3 -m http.server 8765 --bind 127.0.0.1\n然后打开：http://127.0.0.1:8765/magic-sakura-tarot.html';
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
  return true;
}

function importWithTimeout(url, timeoutMs = 25000) {
  return Promise.race([
    import(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`加载超时(${timeoutMs / 1000}s): ${url}`)), timeoutMs)
    ),
  ]);
}

async function loadMediaPipe() {
  for (let i = 0; i < CDN_SOURCES.length; i++) {
    const src = CDN_SOURCES[i];
    const cdnName = src.startsWith('./') ? '本地' : new URL(src).hostname;
    try {
      setStatus(`正在从 ${cdnName} 加载模型库…(${i + 1}/${CDN_SOURCES.length})`);
      const module = await importWithTimeout(src, 25000);
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

(async () => {
  try {
    if (blockInsecureDocumentOrigin()) return;

    setStatus('正在加载核心模型库…');
    const { FilesetResolver, HandLandmarker } = await loadMediaPipe();
    window.FilesetResolver = FilesetResolver;
    window.HandLandmarker = HandLandmarker;

    const app = new SakuraTarotApp();
    await app.boot();
  } catch (err) {
    console.error('启动失败:', err);
    setStatus('⚠️ 启动失败: ' + err.message);
    const loading = document.getElementById('loading-screen');
    if (loading && !document.getElementById('btn-bootstrap-retry')) {
      const btn = document.createElement('button');
      btn.id = 'btn-bootstrap-retry';
      btn.type = 'button';
      btn.textContent = '🔄 点击重试';
      btn.style.cssText =
        'margin-top:20px;padding:12px 28px;border:2px solid #ffd700;background:transparent;color:#ffd700;border-radius:8px;font-size:16px;cursor:pointer;';
      btn.onclick = () => location.reload();
      loading.appendChild(btn);
    }
  }
})();
