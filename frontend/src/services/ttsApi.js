// ===================================================
// TTS API 服务层
// 支持两种模式：
//   - 直连模式（默认）：直接调用 MiMo API，API Key 存前端
//   - 代理模式：通过后端 Go 服务代理，API Key 存后端
// 切换：appStore.set('useBackendProxy', true)
// ===================================================

import { appStore } from '../store/store.js';
import { base64ToBlob } from '../utils/helpers.js';

/**
 * 获取后端代理地址
 */
function getBackendBase() {
  const st = appStore.getState();
  return (st.backendUrl || 'http://localhost:8080').replace(/\/+$/, '');
}

/**
 * 获取当前API配置
 */
function getApiConfig() {
  const state = appStore.getState();
  const key = state.apiKey;
  if (!key) throw new Error('请先输入 API Key');
  const base = state.apiBaseUrl.replace(/\/+$/, '');
  return { base, key };
}

/**
 * 通用 API 调用（自动选择直连/代理）
 */
async function apiPost(path, body, opts = {}) {
  const st = appStore.getState();
  if (st.useBackendProxy) {
    const resp = await fetch(`${getBackendBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Backend ${resp.status}: ${err}`);
    }
    // 代理模式：后端直接返回音频数据
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('audio/')) {
      return await resp.blob();
    }
    return await resp.json();
  }
  // 直连模式：前端直接调 API
  return null; // 由原 callTTSApi 处理
}

/**
 * 调用MiMo TTS API（/chat/completions 兼容接口）
 * @param {string} model 模型名
 * @param {Array} messages 消息列表
 * @param {object} audioOpts { format, voice, ... }
 * @param {AbortSignal} [signal]
 * @returns {Promise<Blob>} 音频Blob
 */
export async function callTTSApi(model, messages, audioOpts, signal) {
  const { base, key } = getApiConfig();

  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': key,
    },
    body: JSON.stringify({ model, messages, audio: audioOpts }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API Error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const audioData = data.choices?.[0]?.message?.audio?.data;
  if (!audioData) throw new Error('No audio data in response');

  const mime = audioOpts.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
  return base64ToBlob(audioData, mime);
}

/**
 * 测试API连接
 */
export async function testConnection() {
  const state = appStore.getState();
  return callTTSApi(
    state.modelTTS,
    [
      { role: 'user', content: '用友好的语气说一句话' },
      { role: 'assistant', content: '你好，很高兴认识你！' },
    ],
    { format: 'wav', voice: 'mimo_default' }
  );
}

/**
 * 基础TTS合成
 */
export async function synthesizeTTS(text, voice, format, style) {
  const messages = [];
  if (style) messages.push({ role: 'user', content: style });
  messages.push({ role: 'assistant', content: text });
  return callTTSApi(appStore.getState().modelTTS, messages, { format, voice });
}

/**
 * VoiceDesign 合成
 */
export async function synthesizeVoiceDesign(desc, text, format, optimizeText) {
  const messages = [{ role: 'user', content: desc }];
  if (text) messages.push({ role: 'assistant', content: text });
  const opts = { format };
  if (optimizeText) opts.optimize_text_preview = true;
  return callTTSApi(appStore.getState().modelVoiceDesign, messages, opts);
}

/**
 * VoiceClone 合成
 */
export async function synthesizeVoiceClone(text, cloneBase64, cloneMime, format, style) {
  const messages = [];
  if (style) messages.push({ role: 'user', content: style });
  else messages.push({ role: 'user', content: '' });
  messages.push({ role: 'assistant', content: text });
  return callTTSApi(appStore.getState().modelVoiceClone, messages, {
    format,
    voice: `data:${cloneMime};base64,${cloneBase64}`,
  });
}
