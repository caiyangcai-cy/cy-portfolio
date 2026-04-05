console.log("CY Works - Elegant Rose Gold Theme Loaded");

(function () {
  'use strict';

  /* ======== Project Data ======== */
  var PROJECTS = {
    sakura: {
      title: '百变小樱魔法卡',
      desc: '一个能用手势施魔法的网页游戏，摄像头就是你的魔杖。张开手掌召唤卡牌环，食指选定卡牌，双指释放魔法特效。基于 MediaPipe 手势识别，配合 Canvas 粒子系统和 CSS 3D 变换打造沉浸式互动。',
      tags: ['H5 游戏', '手势识别', 'Camera'],
      tech: ['JavaScript', 'MediaPipe', 'Canvas 2D', 'CSS 3D Transforms', 'Web Audio API'],
      type: 'h5',
      demoUrl: 'sakura/magic-sakura-tarot.html',
      screenshot: 'screenshots/sakura-showcase.png',
      features: [
        '实时手势识别（握拳、张掌、食指、双指等）',
        '3D 旋转卡牌木马',
        '魔法阵 SVG 动效',
        '粒子特效系统',
        '3D 卡牌翻转展示'
      ]
    },
    tarot: {
      title: '塔罗牌占卜',
      desc: '用手势隔空抽牌，看看今日运势。握拳开始仪式，张掌召唤牌阵，食指选牌，完成过去-现在-未来三张牌的解读。星空粒子、魔法阵底盘、翻牌特效，每一步都充满仪式感。',
      tags: ['H5 游戏', '手势识别', '占卜'],
      tech: ['JavaScript', 'MediaPipe', 'Canvas 粒子', 'CSS 3D', '状态机'],
      type: 'h5',
      demoUrl: 'tarot/index.html',
      screenshot: 'screenshots/tarot-showcase.png',
      features: [
        '三牌阵传统塔罗布局',
        '手势仪式化交互流程',
        '星空粒子背景',
        '3D 底盘魔法阵',
        '综合解读 + 行动指引'
      ]
    },
    miniapp: {
      title: '一瞬',
      desc: '摇一摇复活，一个帮你认识新朋友的小程序，不用加微信那种。摇一摇就能匹配附近的人，轻松破冰，没有社交压力。',
      tags: ['微信小程序', '社交'],
      tech: ['微信小程序', 'WXML', 'WXSS', 'JavaScript', '云开发'],
      type: 'miniapp',
      features: [
        '摇一摇匹配附近用户',
        '第一人称视角拍摄分享',
        '轻社交，无需加好友',
        '趣味破冰互动'
      ]
    }
  };

  /* ======== Modal ======== */
  function initModal() {
    var overlay = document.getElementById('modalOverlay');
    var body = document.getElementById('modalBody');
    var closeBtn = document.getElementById('modalClose');
    if (!overlay || !body || !closeBtn) return;

    function openModal(key) {
      var p = PROJECTS[key];
      if (!p) return;

      var heroHtml = '';
      if (p.type === 'h5' && p.demoUrl) {
        // 手势互动类应用需要摄像头+全屏，不适合 iframe 嵌入
        // 改为展示截图 + 全屏体验按钮
        var screenshotSrc = p.screenshot || 'screenshots/' + key + '.png';
        heroHtml =
          '<div class="modal-hero" style="cursor:pointer;position:relative;" onclick="window.open(\'' + p.demoUrl + '\', \'_blank\')">' +
            '<img src="' + screenshotSrc + '" alt="' + p.title + ' 预览" style="width:100%;height:100%;object-fit:cover;">' +
            '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);opacity:0;transition:opacity 0.3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">' +
              '<span style="color:#fff;font-size:18px;font-weight:600;background:rgba(0,0,0,0.5);padding:12px 24px;border-radius:12px;backdrop-filter:blur(8px);">👆 点击全屏体验</span>' +
            '</div>' +
          '</div>' +
          '<div class="modal-actions" style="margin-bottom:24px;padding-top:0;border:none;">' +
            '<a href="' + p.demoUrl + '" target="_blank" class="btn-primary" style="font-size:14px;padding:10px 22px;">全屏体验 ↗</a>' +
          '</div>';
      } else if (p.type === 'miniapp') {
        heroHtml =
          '<div class="modal-qr">' +
            '<div class="modal-qr-placeholder">小程序码<br>待替换</div>' +
            '<div class="modal-qr-hint">微信扫码体验</div>' +
          '</div>';
      }

      var featuresHtml = '';
      if (p.features && p.features.length) {
        featuresHtml = '<div class="modal-section-label">核心功能</div><ul class="modal-features">';
        for (var i = 0; i < p.features.length; i++) {
          featuresHtml += '<li>' + p.features[i] + '</li>';
        }
        featuresHtml += '</ul>';
      }

      var tagsHtml = '';
      for (var j = 0; j < p.tags.length; j++) {
        tagsHtml += '<span class="tag">' + p.tags[j] + '</span>';
      }

      var techHtml = '';
      for (var k = 0; k < p.tech.length; k++) {
        techHtml += '<span class="modal-tech-item">' + p.tech[k] + '</span>';
      }

      body.innerHTML =
        heroHtml +
        '<div class="modal-tags">' + tagsHtml + '</div>' +
        '<h2 class="modal-title">' + p.title + '</h2>' +
        '<p class="modal-desc">' + p.desc + '</p>' +
        featuresHtml +
        '<div class="modal-section-label">技术栈</div>' +
        '<div class="modal-tech-list">' + techHtml + '</div>';

      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { body.innerHTML = ''; }, 400);
    }

    var cards = document.querySelectorAll('.bento-item[data-project]');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('click', function () {
          openModal(card.getAttribute('data-project'));
        });
      })(cards[i]);
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ======== MediaPipe Badge ======== */
  function initBadge() {
    var badge = document.getElementById('mediapipeBadge');
    if (!badge) return;
    badge.addEventListener('click', function () {
      badge.innerHTML = '<div class="mediapipe-dot" style="background:#34C759;box-shadow:0 0 10px #34C759;"></div> ✨ 摄像头已连接，请尝试隔空滑动';
      badge.style.color = '#34C759';
      badge.style.borderColor = 'rgba(52, 199, 89, 0.2)';
      setTimeout(function () {
        alert('这里是预留给手势互动控制网页的 API 入口，后续可接入 AI 模型。');
      }, 500);
    });
  }

  /* ======== MEDIAPIPE BADGE CSS (inject to avoid external dependency) ======== */
  function injectBadgeCSS() {
    if (document.getElementById('badge-css-injected')) return;
    var style = document.createElement('style');
    style.id = 'badge-css-injected';
    style.textContent =
      '.mediapipe-badge{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
      'background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);' +
      'border:1px solid rgba(183,110,121,0.2);padding:12px 24px;border-radius:999px;' +
      'box-shadow:0 10px 40px rgba(183,110,121,0.15);z-index:1000;display:flex;align-items:center;gap:12px;' +
      'font-weight:600;font-size:15px;cursor:pointer;transition:all 0.3s ease;color:#b76e79;}' +
      '.mediapipe-badge:hover{background:#fff;transform:translateX(-50%) scale(1.05);}' +
      '.mediapipe-dot{width:8px;height:8px;background:#b76e79;border-radius:50%;box-shadow:0 0 10px #b76e79;animation:pulse 2s infinite;}' +
      '@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(183,110,121,0.4)}70%{box-shadow:0 0 0 10px rgba(183,110,121,0)}100%{box-shadow:0 0 0 0 rgba(183,110,121,0)}}';
    document.head.appendChild(style);
  }

  /* ======== Init ======== */
  document.addEventListener('DOMContentLoaded', function () {
    injectBadgeCSS();
    initModal();
    initBadge();
  });
})();
