// ===================================================
// 音频播放器组件
// ===================================================

import { appStore } from '../store/store.js';

let currentUrl = null;

/**
 * 播放音频Blob
 * @param {Blob} blob
 * @param {string} containerId 容器元素ID
 * @param {string} downloadBtnId 下载按钮ID（可选）
 */
export function playAudio(blob, containerId, downloadBtnId) {
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  const url = URL.createObjectURL(blob);

  appStore.set('lastAudioBlob', blob);
  appStore.set('lastAudioUrl', url);

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<audio controls autoplay style="width:100%;border-radius:8px;margin-top:8px;" src="${url}"></audio>`;
  }

  if (downloadBtnId) {
    const btn = document.getElementById(downloadBtnId);
    if (btn) btn.classList.remove('hidden');
  }
}

/**
 * 下载最后生成的音频
 */
export function downloadLastAudio() {
  const state = appStore.getState();
  if (!state.lastAudioBlob || !state.lastAudioUrl) return;
  const a = document.createElement('a');
  a.href = state.lastAudioUrl;
  a.download = `mimo_tts_${Date.now()}.${state.lastAudioExt}`;
  a.click();
}
