// ===================================================
// 通用工具函数
// ===================================================

/**
 * HTML转义
 */
export function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 格式化时间 (秒 → m:ss)
 */
export function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 字符串简单hash
 */
export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Base64 → Blob
 */
export function base64ToBlob(b64, mime) {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

/**
 * 文件后缀获取
 */
export function getExt(format) {
  const map = { wav: 'wav', mp3: 'mp3', pcm16: 'pcm', opus: 'opus', aac: 'aac' };
  return map[format] || 'wav';
}

/**
 * 动态加载script
 */
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * 角色名标准化：去除首尾空白和尾部标点
 */
export function normalizeCharName(name) {
  return name.trim()
    .replace(/[。！？，、：；"'""''….,!?:;"'\s]+$/, '')
    .trim();
}
