// ===================================================
// MiMo TTS Studio - 主应用入口
// ===================================================

import { appStore, projectStore } from './store/store.js';
import { toast } from './components/Toast.js';
import { playAudio, downloadLastAudio } from './components/AudioPlayer.js';
import { testConnection, synthesizeTTS, synthesizeVoiceDesign, synthesizeVoiceClone } from './services/ttsApi.js';
import { testLLMConnection, generateVDDescription, generateVDText } from './services/llmApi.js';
import { getExt } from './utils/helpers.js';
import { esc } from './utils/helpers.js';
import { splitChapters } from './utils/chapterSplit.js';
import { decodeText } from './utils/encoding.js';
import { pickFolder, verifyPermission, getHandle, saveHandle, deleteHandle,
         saveProjectToDir, saveChapterResult, saveAudioToDir, loadProjectFromDir,
         ensureDir } from './services/fileService.js';
import { EMO_STYLE_MAP, EMO_LABELS, getMoodColor } from './utils/emotions.js';
import { normalizeCharName } from './utils/helpers.js';
import { wavToPCM, makeSilence, concatPCM, pcmToWav } from './utils/audio.js';
import { analyzeChapter, generateVoiceDesignPrompts } from './services/llmApi.js';
import { callTTSApi } from './services/ttsApi.js';

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initFromStore();
  renderProjectList();
  renderHistory();
  renderSavedVoices();
  setTheme(appStore.getState().theme);
  // 恢复侧边栏状态
  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    const sidebar = document.querySelector('.sidebar');
    const btn = document.querySelector('.sidebar-collapse-btn');
    if (sidebar) { sidebar.classList.add('collapsed'); if (btn) btn.textContent = '▶'; }
  }
});

function initFromStore() {
  const st = appStore.getState();
  if (st.apiKey) { const el = document.getElementById('apiKey'); if (el) el.value = st.apiKey; }
  if (st.apiBaseUrl) {
    const el = document.getElementById('apiBaseUrl');
    if (el) el.value = st.apiBaseUrl;
  }
  const modelKeys = { tts: 'modelTTS', voicedesign: 'modelVoiceDesign', voiceclone: 'modelVoiceClone' };
  const storeKeys = { tts: 'modelTTS', voicedesign: 'modelVoiceDesign', voiceclone: 'modelVoiceClone' };
  for (const [t, id] of Object.entries(modelKeys)) {
    const el = document.getElementById(id);
    if (el) { const v = appStore.get(storeKeys[t]); if (v) el.value = v; }
  }
  ['llmBaseUrl', 'llmApiKey', 'llmModel'].forEach(id => {
    const el = document.getElementById(id);
    const v = appStore.get(id);
    if (el && v) el.value = v;
  });
  updateProxyToggle();
}

function updateProxyToggle() {
  const useProxy = appStore.get('useBackendProxy');
  // Sidebar toggle button
  const btn = document.getElementById('proxyToggle');
  if (btn) { btn.textContent = useProxy ? '🔌' : '🔗'; btn.title = useProxy ? '代理模式' : '直连模式'; }
  // Header toggle switch
  const el2 = document.getElementById('proxyToggle2');
  if (el2) { el2.classList.toggle('on', useProxy); }
}

function toggleProxy() {
  const cur = !appStore.get('useBackendProxy');
  appStore.set('useBackendProxy', cur);
  localStorage.setItem('mimo_use_backend', cur ? 'true' : 'false');
  updateProxyToggle();
  toast(cur ? '已切换为后端代理模式' : '已切换为直连模式', 'info');
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const btn = document.querySelector('.sidebar-collapse-btn');
  if (!sidebar || !btn) return;
  sidebar.classList.toggle('collapsed');
  btn.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
  localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed') ? 'true' : 'false');
}

// ========== 主题 ==========
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  appStore.set('theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = t === 'dark' ? '☀' : '🌙';
}

// ========== 标签页 ==========
function switchTab(i) {
  // Sidebar nav items
  document.querySelectorAll('.nav-item[data-tab]').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.tab) === i);
  });
  // Page panels
  for (let j = 0; j <= 3; j++) {
    const page = document.getElementById('page' + j);
    if (page) page.classList.toggle('hidden', j !== i);
  }
  appStore.set('activeTab', i);
}

// ========== 字符计数 ==========
function updateCharCount(el, id) {
  document.getElementById(id).textContent = el.value.length;
}

// ========== TTS 基础合成 ==========
function insertTTSStyleTag(tag) {
  const el = document.getElementById('ttsText');
  const prefix = `(${tag})`;
  if (/^\([^)]+\)/.test(el.value.trim())) {
    el.value = el.value.replace(/^\([^)]+\)\s*/, prefix + ' ');
  } else {
    el.value = prefix + el.value;
  }
  updateCharCount(el, 'ttsCharCount');
  // 同步更新标签高亮
  document.querySelectorAll('.tag-container .tag').forEach(btn => {
    const isActive = btn.textContent.trim() === tag;
    btn.classList.toggle('accent', isActive);
  });
}

async function generateTTS() {
  const text = document.getElementById('ttsText').value.trim();
  if (!text) { toast('请输入合成文本', 'error'); return; }
  const voice = document.getElementById('ttsVoice').value;
  const format = document.getElementById('ttsFormat').value;
  const style = document.getElementById('ttsStyle').value.trim();
  appStore.set('lastAudioExt', getExt(format));

  const btn = document.getElementById('ttsBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 生成中...';
  try {
    const blob = await synthesizeTTS(text, voice, format, style);
    playAudio(blob, 'ttsPlayer', 'ttsDownload');
    addHistory('TTS', text.slice(0, 50), voice);
    toast('生成成功', 'success');
  } catch (e) {
    toast('生成失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '生成语音';
  }
}

// ========== VoiceDesign ==========
function appendVDTag(tag) {
  const el = document.getElementById('vdDesc');
  el.value = (el.value ? el.value + ' ' : '') + tag;
  updateCharCount(el, 'vdCharCount');
}

async function generateVD() {
  const desc = document.getElementById('vdDesc').value.trim();
  const text = document.getElementById('vdText').value.trim();
  const optimizeText = document.getElementById('vdOptimizeText').checked;
  if (!desc) { toast('请输入音色描述', 'error'); return; }
  if (!text && !optimizeText) { toast('请输入参考文本，或勾选智能优化文本', 'error'); return; }
  const format = document.getElementById('vdFormat').value;
  appStore.set('lastAudioExt', getExt(format));

  const btn = document.getElementById('vdBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 生成中...';
  try {
    const blob = await synthesizeVoiceDesign(desc, text, format, optimizeText);
    playAudio(blob, 'vdPlayer', 'vdDownload');
    addHistory('VoiceDesign', desc.slice(0, 50), '-');
    toast('生成成功', 'success');
  } catch (e) {
    toast('生成失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '生成预览';
  }
}

async function generateVDDescriptionHandler() {
  const brief = document.getElementById('vdDesc').value.trim();
  if (!brief) { toast('请先输入简要音色描述', 'error'); return; }
  const btn = document.getElementById('vdAiBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 生成中...';
  try {
    const result = await generateVDDescription(brief);
    document.getElementById('vdDesc').value = result;
    updateCharCount(document.getElementById('vdDesc'), 'vdCharCount');
    toast('AI 描述已生成', 'success');
  } catch (e) {
    toast('生成失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'AI 生成描述';
  }
}

async function generateVDTextHandler() {
  const desc = document.getElementById('vdDesc').value.trim();
  if (!desc) { toast('请先输入音色描述', 'error'); return; }
  const btn = document.getElementById('vdTextAiBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 生成中...';
  try {
    const result = await generateVDText(desc);
    document.getElementById('vdText').value = result;
    toast('AI 文本已生成', 'success');
  } catch (e) {
    toast('生成失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'AI 生成文本';
  }
}

function saveVDVoice() {
  const desc = document.getElementById('vdDesc').value.trim();
  if (!desc) { toast('请先填写音色描述', 'error'); return; }
  const voices = appStore.getState().savedVoices;
  voices.push({ desc, time: Date.now() });
  appStore.set('savedVoices', voices);
  renderSavedVoices();
  toast('音色已保存', 'success');
}

function renderSavedVoices() {
  const el = document.getElementById('savedVoices');
  if (!el) return;
  const voices = appStore.getState().savedVoices;
  if (!voices.length) {
    el.innerHTML = '<p style="color:var(--text2);font-size:13px;">暂无保存的音色</p>';
    return;
  }
  el.innerHTML = voices.map((v, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
      <span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(v.desc)}</span>
      <button class="btn btn-sm btn-secondary" onclick="window.loadVDVoice(${i})">加载</button>
      <button class="btn-icon" onclick="window.deleteVDVoice(${i})">&#10005;</button>
    </div>
  `).join('');
}

window.loadVDVoice = (i) => {
  const voices = appStore.getState().savedVoices;
  document.getElementById('vdDesc').value = voices[i].desc;
  updateCharCount(document.getElementById('vdDesc'), 'vdCharCount');
  toast('已加载音色描述', 'info');
};

window.deleteVDVoice = (i) => {
  const voices = appStore.getState().savedVoices;
  voices.splice(i, 1);
  appStore.set('savedVoices', voices);
  renderSavedVoices();
};

// ========== VoiceClone ==========
let cloneBase64 = null;
let cloneMime = '';

function handleCloneDrop(e) {
  e.preventDefault();
  e.target.closest('.drop-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processCloneFile(file);
}

function handleCloneFile(input) {
  if (input.files[0]) processCloneFile(input.files[0]);
}

function processCloneFile(file) {
  const valid = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mp3'];
  if (!valid.some(t => file.type.includes(t) || file.name.match(/\.(mp3|wav|flac)$/i))) {
    toast('仅支持 MP3/WAV/FLAC 格式', 'error'); return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast('文件过大', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const arr = e.target.result;
    const bytes = new Uint8Array(arr);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    cloneBase64 = btoa(binary);
    if (file.name.endsWith('.wav')) cloneMime = 'audio/wav';
    else if (file.name.endsWith('.flac')) cloneMime = 'audio/flac';
    else cloneMime = 'audio/mpeg';
    document.getElementById('cloneFileInfo').classList.remove('hidden');
    document.getElementById('cloneFileName').textContent = file.name;
    document.getElementById('cloneFileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
    document.getElementById('clonePreview').innerHTML =
      `<audio controls style="width:100%;margin-top:4px;border-radius:8px;" src="${URL.createObjectURL(file)}"></audio>`;
  };
  reader.readAsArrayBuffer(file);
}

function clearCloneFile() {
  cloneBase64 = null; cloneMime = '';
  document.getElementById('cloneFileInfo').classList.add('hidden');
  document.getElementById('cloneFile').value = '';
}

async function generateClone() {
  const text = document.getElementById('cloneText').value.trim();
  if (!text) { toast('请输入合成文本', 'error'); return; }
  if (!cloneBase64) { toast('请先上传音频样本', 'error'); return; }
  const style = document.getElementById('cloneStyle').value.trim();
  const format = document.getElementById('cloneFormat').value;
  appStore.set('lastAudioExt', getExt(format));

  const btn = document.getElementById('cloneBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 生成中...';
  try {
    const blob = await synthesizeVoiceClone(text, cloneBase64, cloneMime, format, style);
    playAudio(blob, 'clonePlayer', 'cloneDownload');
    addHistory('VoiceClone', text.slice(0, 50), '克隆');
    toast('生成成功', 'success');
  } catch (e) {
    toast('生成失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '克隆生成';
  }
}

// ========== 连接测试 ==========
const _testTTS = testConnection; // 闭包捕获

async function handleTestTTS() {
  try {
    toast('正在测试连接...', 'info');
    const blob = await _testTTS();
    toast('连接成功！', 'success');
    playAudio(blob, 'ttsPlayer', 'ttsDownload');
  } catch (e) {
    toast('连接失败: ' + e.message, 'error');
  }
}

const _testLLM = testLLMConnection; // 闭包捕获，防止被 window 覆盖

async function handleTestLLM() {
  const btn = document.getElementById('llmTestBtn');
  if (!btn) return;

  // 先把输入框的值同步到 store
  ['llmBaseUrl', 'llmApiKey', 'llmModel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) appStore.set(id, el.value.trim());
  });

  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try {
    const result = await _testLLM();
    toast('LLM 连接成功: ' + (result || '(空)'), 'success');
  } catch (e) {
    toast('LLM 连接失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '测试LLM';
  }
}

// ========== 历史记录 ==========
function toggleHistory() {
  document.getElementById('historyPanel').classList.toggle('open');
}

function addHistory(type, text, voice) {
  const list = appStore.getState().history;
  list.unshift({ type, text, voice, time: Date.now() });
  if (list.length > 50) list.length = 50;
  appStore.set('history', list);
  renderHistory();
}

function renderHistory() {
  const el = document.getElementById('historyList');
  if (!el) return;
  const list = appStore.getState().history;
  if (!list.length) {
    el.innerHTML = '<p style="padding:16px;color:var(--text2);font-size:13px;">暂无历史记录</p>';
    return;
  }
  el.innerHTML = list.map(h => `
    <div class="history-item">
      <div class="hi-text">[${esc(h.type)}] ${esc(h.text)}</div>
      <div class="hi-meta">${esc(h.voice)} · ${new Date(h.time).toLocaleString()}</div>
    </div>
  `).join('');
}

function clearHistory() {
  appStore.set('history', []);
  renderHistory();
  toast('历史已清空', 'info');
}

// ========== 项目列表 ==========
function getProjectList() {
  return JSON.parse(localStorage.getItem('mimo_projects') || '[]');
}

function saveProjectList(list) {
  localStorage.setItem('mimo_projects', JSON.stringify(list));
  projectStore.set('projectList', list);
}

function addProjectToList(name) {
  const list = getProjectList();
  const idx = list.findIndex(p => p.name === name);
  if (idx >= 0) list[idx].time = Date.now();
  else list.push({ name, time: Date.now() });
  saveProjectList(list);
}

function removeProjectFromList(name) {
  saveProjectList(getProjectList().filter(p => p.name !== name));
}

function renderProjectList() {
  const el = document.getElementById('projectList');
  if (!el) return;
  const list = getProjectList();
  list.sort((a, b) => (b.time || 0) - (a.time || 0));
  if (!list.length) {
    el.innerHTML = '<p style="color:var(--text2);font-size:12px;padding:8px 0;">暂无项目，点击新建项目或拖拽 TXT 开始</p>';
    return;
  }
  el.innerHTML = list.map(p => {
    const d = new Date(p.time);
    const ts = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
      <span style="flex:1;font-weight:500;cursor:pointer;color:var(--accent);" onclick="window.loadProject('${esc(p.name)}')">${esc(p.name)}</span>
      <span style="font-size:11px;color:var(--text2);">${ts}</span>
      <button class="btn-icon" onclick="event.stopPropagation();window.deleteProject('${esc(p.name)}')" style="font-size:14px;color:var(--danger);">&#128465;</button>
    </div>`;
  }).join('');
}

// ========== 项目管理 ==========
async function createNewProject(txtFile) {
  const folder = await pickFolder();
  if (!folder) return;

  const name = folder.name;
  projectStore.set('currentProjectName', name);
  projectStore.set('projectDirHandle', folder);
  projectStore.set('globalCharacters', {});
  projectStore.set('synthCache', new Map());
  projectStore.set('novelAudioBlobs', {});
  if (projectStore.get('currentAbort')) {
    try { projectStore.get('currentAbort').abort(); } catch {}
    projectStore.set('currentAbort', null);
  }

  let chapters = [];
  if (txtFile) {
    try {
      const buf = await txtFile.arrayBuffer();
      const { text } = decodeText(new Uint8Array(buf));
      chapters = splitChapters(text, name);
    } catch (e) {
      toast('文件读取失败: ' + e.message, 'error');
      return;
    }
  }

  projectStore.set('chapters', chapters);
  await ensureDir(folder, 'audio');
  await saveProjectToDir();
  addProjectToList(name);
  await saveHandle(name, folder);

  enterWorkspace(name, chapters);
  toast('项目已创建: ' + name + (chapters.length ? ' (' + chapters.length + '章)' : ''), 'success');
}

async function loadProject(name) {
  try {
    let handle = await getHandle(name);
    if (handle) {
      const ok = await verifyPermission(handle);
      if (!ok) handle = null;
    }
    if (!handle) {
      toast('请选择项目文件夹: ' + name, 'info');
      handle = await pickFolder();
      if (!handle) return;
      await saveHandle(name, handle);
    }

    const data = await loadProjectFromDir(handle);
    projectStore.set('projectDirHandle', handle);
    projectStore.set('currentProjectName', name);
    projectStore.set('chapters', data.chapters);
    projectStore.set('globalCharacters', data.globalCharacters || {});
    projectStore.set('novelAudioBlobs', {});
    projectStore.set('synthCache', new Map());

    if (projectStore.get('currentAbort')) {
      try { projectStore.get('currentAbort').abort(); } catch {}
      projectStore.set('currentAbort', null);
    }

    enterWorkspace(name, data.chapters);
    updateCharList();
    startAutoSave();
    toast('已加载: ' + name + ' (' + data.chapters.length + '章)', 'success');
  } catch (e) {
    toast('加载失败: ' + e.message, 'error');
  }
}

async function deleteProject(name) {
  if (!confirm('确定删除项目「' + name + '」？（仅删除记录，文件夹不受影响）')) return;
  removeProjectFromList(name);
  await deleteHandle(name);
  renderProjectList();
  toast('已删除: ' + name, 'info');
}

function enterWorkspace(name, chapters) {
  document.getElementById('novelTitle').textContent = name;
  const tc = chapters.reduce((s, c) => s + c.content.length, 0);
  document.getElementById('novelStats').textContent = `共 ${chapters.length} 章 / ${tc.toLocaleString()} 字`;
  projectStore.set('currentChapter', chapters.length > 0 ? 0 : -1);
  document.getElementById('novelWorkspace').classList.remove('hidden');
  document.getElementById('novelImportCard').classList.add('hidden');
  updateProjectDirLabel();

  const emoBtn = document.getElementById('emotionBtn');
  if (emoBtn) { emoBtn.disabled = false; emoBtn.textContent = '情绪分析'; }
  document.getElementById('emotionProgress')?.classList.add('hidden');

  if (chapters.length > 0) {
    renderChapterList();
    showChapter(0);
  }
  updateCharList();
}

let autoSaveTimer = null;
function startAutoSave() {
  stopAutoSave();
  autoSaveTimer = setInterval(async () => {
    const st = projectStore.getState();
    if (st.currentProjectName && st.chapters.length) {
      await saveProjectToDir();
    }
  }, 60000);
}
function stopAutoSave() {
  if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null; }
}

async function saveProject(silent) {
  const st = projectStore.getState();
  if (!st.currentProjectName || !st.projectDirHandle) return;
  try {
    await saveProjectToDir();
    addProjectToList(st.currentProjectName);
    if (!silent) toast('已保存', 'success');
    renderProjectList();
  } catch (e) {
    if (!silent) toast('保存失败: ' + e.message, 'error');
  }
}

async function backToProjects() {
  stopAutoSave();
  const st = projectStore.getState();
  if (st.currentProjectName && st.projectDirHandle && st.chapters.length) {
    try { await saveProjectToDir(); addProjectToList(st.currentProjectName); } catch {}
  }

  projectStore.set('globalCharacters', {});
  projectStore.set('chapters', []);
  projectStore.set('currentChapter', -1);
  projectStore.set('currentProjectName', '');
  projectStore.set('synthCache', new Map());
  projectStore.set('novelAudioBlobs', {});
  projectStore.set('projectDirHandle', null);
  projectStore.set('speakerFilter', '');
  if (projectStore.get('currentAbort')) {
    try { projectStore.get('currentAbort').abort(); } catch {}
    projectStore.set('currentAbort', null);
  }

  document.getElementById('novelWorkspace').classList.add('hidden');
  document.getElementById('novelImportCard').classList.remove('hidden');
  document.getElementById('novelPlayer').style.display = 'none';
  renderProjectList();
}

async function importTxtToProject(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.name.endsWith('.txt')) { toast('请上传 TXT 文件', 'error'); return; }
  try {
    const buf = await file.arrayBuffer();
    const { text } = decodeText(new Uint8Array(buf));
    const chapters = splitChapters(text, projectStore.get('currentProjectName'));
    projectStore.set('globalCharacters', {});
    projectStore.set('novelAudioBlobs', {});
    projectStore.set('chapters', chapters);
    projectStore.set('currentChapter', 0);
    renderChapterList();
    showChapter(0);
    await saveProject(true);
    toast('导入成功，共 ' + chapters.length + ' 章', 'success');
  } catch (e) {
    toast('导入失败: ' + e.message, 'error');
  }
  input.value = '';
}

async function linkProjectDir() {
  const handle = await pickFolder();
  if (!handle) return;
  projectStore.set('projectDirHandle', handle);
  await ensureDir(handle, 'audio');
  await saveHandle(projectStore.get('currentProjectName'), handle);
  updateProjectDirLabel();
  await saveProjectToDir();
  toast('已关联文件夹: ' + handle.name, 'success');
}

function updateProjectDirLabel() {
  const el = document.getElementById('projectDirLabel');
  if (el) {
    const h = projectStore.get('projectDirHandle');
    el.textContent = h ? h.name : '未选择';
  }
}

// ========== 章节导航 ==========
function renderChapterList() {
  const el = document.getElementById('chapterList');
  const chapters = projectStore.get('chapters');
  const currentChapter = projectStore.get('currentChapter');
  if (!el) return;

  el.innerHTML = chapters.map((ch, i) => {
    let badges = '';
    if (ch.script?.length) {
      badges += `<span class="ch-mood" style="background:var(--accent);color:#fff;font-size:10px;">${ch.script.length}行</span>`;
    } else if (ch.mood) {
      badges += `<span class="ch-mood" style="background:${getMoodColor(ch.mood)};color:#fff;">${esc(ch.mood)}</span>`;
    }
    return `<div class="chapter-item ${i === currentChapter ? 'active' : ''}" onclick="window.showChapter(${i})">
      <input type="checkbox" ${ch.checked ? 'checked' : ''} onclick="event.stopPropagation();window.toggleChapterCheck(${i}, this.checked)">
      <span class="ch-title">${esc(ch.title)}</span>
      ${badges}
      <span class="ch-meta">${ch.content.length}字</span>
    </div>`;
  }).join('');
}

window.toggleChapterCheck = (i, checked) => {
  const ch = projectStore.get('chapters');
  ch[i].checked = checked;
};

window.showChapter = (i) => {
  projectStore.set('currentChapter', i);
  renderChapterList();
  renderScriptCards(projectStore.get('chapters')[i]);
  updateCharList();
};

function filterChapters(keyword) {
  document.querySelectorAll('#chapterList .chapter-item').forEach(el => {
    const title = el.querySelector('.ch-title');
    el.style.display = (!keyword || (title && title.textContent.toLowerCase().includes(keyword.toLowerCase()))) ? '' : 'none';
  });
}

function selectAllChapters(v) {
  projectStore.get('chapters').forEach(c => c.checked = v);
  renderChapterList();
}

function selectUnanalyzedChapters() {
  let count = 0;
  projectStore.get('chapters').forEach(c => {
    if (!c.script?.length) { c.checked = true; count++; }
    else c.checked = false;
  });
  renderChapterList();
  toast('已选中 ' + count + ' 个未分析章节', 'info');
}

// ========== 脚本卡片渲染 ==========
function renderScriptCards(ch) {
  const area = document.getElementById('scriptArea');
  const filterEl = document.getElementById('speakerFilter');
  if (!area) return;

  if (!ch?.script?.length) {
    const rawPreview = esc(ch.content.slice(0, 5000)) + (ch.content.length > 5000 ? '\n\n... (共' + ch.content.length + '字，已截断)' : '');
    area.innerHTML = `<div style="padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <p style="font-size:14px;font-weight:600;">${esc(ch.title)} <span style="font-weight:normal;color:var(--text2);font-size:12px;">${ch.content.length} 字</span></p>
        <span style="font-size:12px;color:var(--text2);">原始文本预览</span>
      </div>
      <pre style="font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;color:var(--text);background:var(--bg);padding:16px;border-radius:8px;border:1px solid var(--border);max-height:70vh;overflow-y:auto;">${rawPreview}</pre>
      <p style="font-size:12px;color:var(--text2);margin-top:12px;text-align:center;">请在左栏勾选章节后点击「情绪分析」生成脚本</p></div>`;
    if (filterEl) filterEl.innerHTML = '<option value="">全部</option>';
    return;
  }

  const speakers = [...new Set(ch.script.map(s => s.speaker))];
  const f = projectStore.get('speakerFilter');
  if (filterEl) {
    filterEl.innerHTML = '<option value="">全部 (' + ch.script.length + '行)</option>' +
      speakers.map(s => `<option value="${esc(s)}"${s === f ? ' selected' : ''}>${esc(s)} (${ch.script.filter(i => i.speaker === s).length})</option>`).join('');
  }

  let html = '';
  let visibleCount = 0;
  ch.script.forEach((item, idx) => {
    if (f && item.speaker !== f) return;
    visibleCount++;
    const isNarrator = item.speaker === '旁白';
    const va = item._voiceAssignment;
    const vLabel = isNarrator ? '旁白' : (va?.type === 'voicedesign' ? 'VoiceDesign' : (va?.type === 'needs_design' ? '待设计' : '未分配'));

    const emoOpts = EMO_LABELS.map(e =>
      `<option value="${e}"${e === item.speaker_emo ? ' selected' : ''}>${e}</option>`
    ).join('');

    html += `<div class="script-card" id="sc-${idx}">
      <div class="sc-num">${idx + 1}</div>
      <div class="sc-body">
        <div class="sc-speaker ${isNarrator ? 'narrator' : 'character'}">
          ${esc(item.speaker)}
          <span style="font-size:10px;padding:1px 4px;border-radius:3px;background:${isNarrator ? 'var(--tag-bg)' : 'rgba(0,113,227,.12)'};font-weight:normal;">${esc(vLabel)}</span>
        </div>
        <div class="sc-content" ondblclick="window.startEditContent(this,${idx})" title="双击编辑">${esc(item.content)}</div>
        <div class="sc-controls">
          <span style="font-size:11px;color:var(--text2);">情绪</span>
          <select onchange="window.updateScriptItem(${idx},'speaker_emo',this.value)" style="max-width:80px;">${emoOpts}</select>
          <span style="font-size:11px;color:var(--text2);margin-left:4px;">停顿</span>
          <input type="number" value="${item.delay || 500}" min="0" max="5000" step="100" onchange="window.updateScriptItem(${idx},'delay',+this.value)" style="width:56px;">
          <span style="font-size:11px;color:var(--text2);">ms</span>
        </div>
      </div>
      <div class="sc-actions">
        <button onclick="window.playScriptLine(${idx})" title="试听">&#9654;</button>
      </div>
    </div>`;
  });

  if (f) {
    html = `<div style="font-size:12px;color:var(--text2);padding:4px 0;margin-bottom:4px;">显示${esc(f)}共 ${visibleCount} 行 <a href="#" onclick="window.filterBySpeaker('');return false;" style="color:var(--accent);">清除筛选</a></div>` + html;
  }
  area.innerHTML = html;
}

window.filterBySpeaker = (s) => {
  projectStore.set('speakerFilter', s);
  renderScriptCards(projectStore.get('chapters')[projectStore.get('currentChapter')]);
};

window.updateScriptItem = (idx, field, value) => {
  const ch = projectStore.get('chapters')[projectStore.get('currentChapter')];
  if (ch?.script?.[idx]) ch.script[idx][field] = value;
};

window.startEditContent = (el, idx) => {
  if (el.querySelector('textarea')) return;
  const ch = projectStore.get('chapters')[projectStore.get('currentChapter')];
  const item = ch?.script?.[idx];
  if (!item) return;
  el.innerHTML = `<textarea style="width:100%;min-height:40px;font-size:13px;line-height:1.5;" onblur="window.finishEditContent(this,${idx})">${esc(item.content)}</textarea>`;
  const ta = el.querySelector('textarea');
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
};

window.finishEditContent = (ta, idx) => {
  const ch = projectStore.get('chapters')[projectStore.get('currentChapter')];
  if (ch?.script?.[idx]) {
    ch.script[idx].content = ta.value.trim();
    ta.parentNode.textContent = ch.script[idx].content;
  }
};

// ========== 角色管理 ==========
function updateCharList() {
  const el = document.getElementById('charList');
  const countEl = document.getElementById('charCount');
  if (!el) return;
  const chars = Object.values(projectStore.get('globalCharacters'));
  if (countEl) countEl.textContent = chars.length;
  if (!chars.length) {
    el.innerHTML = '<p style="color:var(--text2);font-size:12px;">分析后显示角色</p>';
    return;
  }
  el.innerHTML = chars.map(c => {
    const tc = c.role_tag === '重要角色' ? 'var(--accent)' : 'var(--text2)';
    const vh = c.voiceDesignPrompt
      ? `<div class="cc-voice has-design" title="${esc(c.voiceDesignPrompt)}">VD: ${esc(c.voiceDesignPrompt.slice(0, 50))}${c.voiceDesignPrompt.length > 50 ? '...' : ''}</div>`
      : `<div class="cc-voice" style="color:var(--danger);border-left:2px solid var(--danger);">待设计音色 <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();window.designSingleVoice('${esc(c.name)}')" style="font-size:10px;padding:1px 5px;margin-left:4px;">设计</button></div>`;
    return `<div class="char-card">
      <div class="cc-name">${esc(c.name)} <span style="font-size:10px;color:${tc};">${esc(c.role_tag)}</span></div>
      <div class="cc-info">${esc(c.gender)} · ${esc(c.age)} · 出现${c.chapters.length}章</div>
      <div class="cc-info">${esc((c.personality || '').slice(0, 40))}</div>
      ${vh}
    </div>`;
  }).join('');
}

function mergeChapterCharacters(ch, chapterIdx) {
  if (!ch.characterMap) return;
  const nameMapping = {};
  const gc = projectStore.get('globalCharacters');

  for (const [rawName, info] of Object.entries(ch.characterMap)) {
    if (rawName === '旁白') continue;
    const norm = normalizeCharName(rawName);
    nameMapping[rawName] = norm;

    if (!gc[norm]) {
      gc[norm] = {
        name: norm, gender: info.gender || '未知', age: info.age || '',
        role_tag: info.role_tag || '路人角色', personality: info.personality || '',
        timbre: info.timbre || '', voiceDesignPrompt: null, ttsStyle: null,
        chapters: [chapterIdx],
      };
    } else {
      if (!gc[norm].chapters.includes(chapterIdx)) gc[norm].chapters.push(chapterIdx);
      if (info.personality?.length > (gc[norm].personality || '').length) gc[norm].personality = info.personality;
      if (info.timbre) gc[norm].timbre = info.timbre;
    }
  }

  if (ch.script) {
    ch.script.forEach(item => {
      if (item.speaker === '旁白') return;
      const norm = nameMapping[item.speaker] || normalizeCharName(item.speaker);
      if (norm !== item.speaker) item.speaker = norm;
    });
  }

  projectStore.set('globalCharacters', gc);
}

function matchPresetVoice(char) {
  const g = (char.gender || '').toLowerCase();
  if (g === '男' || g === 'male') {
    return ['苏打', '白桦', 'Milo', 'Dean'][Math.abs(hashCode(char.name)) % 4];
  }
  if (g === '女' || g === 'female') {
    return ['冰糖', '茉莉', 'Mia', 'Chloe'][Math.abs(hashCode(char.name)) % 4];
  }
  return 'mimo_default';
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function assignCharacterVoice(char) {
  if (char.voiceDesignPrompt) return { type: 'voicedesign', prompt: char.voiceDesignPrompt, style: char.ttsStyle };
  return { type: 'preset', voice: matchPresetVoice(char) };
}

function applyVoiceAssignments(ch) {
  if (!ch.script) return;
  const gc = projectStore.get('globalCharacters');
  ch.script.forEach(item => {
    if (item.speaker !== '旁白' && gc[item.speaker]) {
      item._voiceAssignment = assignCharacterVoice(gc[item.speaker]);
    }
  });
}

async function ensureAllVoicesDesigned() {
  const gc = projectStore.get('globalCharacters');
  const needDesign = Object.values(gc).filter(c => !c.voiceDesignPrompt);
  if (!needDesign.length) return;
  const st = appStore.getState();
  if (!st.llmBaseUrl || !st.llmApiKey || !st.llmModel) {
    toast('有角色缺少音色，请配置 LLM API', 'error');
    throw new Error('LLM not configured');
  }
  toast('正在为 ' + needDesign.length + ' 个角色设计音色...', 'info');
  await generateVoiceDesignPrompts(needDesign);
  projectStore.get('chapters').forEach(ch => applyVoiceAssignments(ch));
  updateCharList();
}

// ========== API配置持久化 ==========
function onApiChange() {
  const el = document.getElementById('apiBaseUrl');
  if (el) {
    const url = el.value.trim().replace(/\/+$/, '');
    appStore.set('apiBaseUrl', url);
  }
  const keyEl = document.getElementById('apiKey');
  if (keyEl) appStore.set('apiKey', keyEl.value.trim());
  ['modelTTS', 'modelVoiceDesign', 'modelVoiceClone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) appStore.set(id, el.value.trim());
  });
}

// ========== 暴露到全局（用于 onclick） ==========
window.toggleTheme = toggleTheme;
window.switchTab = switchTab;
window.updateCharCount = updateCharCount;
window.generateTTS = generateTTS;
window.generateVD = generateVD;
window.generateVDDescription = generateVDDescriptionHandler;
window.generateVDText = generateVDTextHandler;
window.saveVDVoice = saveVDVoice;
window.appendVDTag = appendVDTag;
window.insertTTSStyleTag = insertTTSStyleTag;
window.generateClone = generateClone;
window.handleCloneDrop = handleCloneDrop;
window.handleCloneFile = handleCloneFile;
window.clearCloneFile = clearCloneFile;
window.testConnection = handleTestTTS;
window.testLLMConnection = handleTestLLM;
window.toggleHistory = toggleHistory;
window.clearHistory = clearHistory;
window.downloadLastAudio = downloadLastAudio;
window.createNewProject = createNewProject;
window.loadProject = loadProject;
window.deleteProject = deleteProject;
window.backToProjects = backToProjects;
window.saveProject = saveProject;
window.importTxtToProject = importTxtToProject;
window.linkProjectDir = linkProjectDir;
window.selectAllChapters = selectAllChapters;
window.selectUnanalyzedChapters = selectUnanalyzedChapters;
window.filterChapters = filterChapters;
window.startEmotionAnalysis = startEmotionAnalysis;
window.selectPresetVoice = selectPresetVoice;
window.playScriptLine = playScriptLine;
window.showCharacterModal = showCharacterModal;
window.closeCharacterModal = closeCharacterModal;
window.designAllVoices = designAllVoices;
window.designSingleVoice = designSingleVoice;
window.updateCharVoicePrompt = updateCharVoicePrompt;
window.auditionCharacterVoice = auditionCharacterVoice;
window.startBatchGenerate = startBatchGenerate;
window.generateChapterAudio = generateChapterAudio;
window.batchSetDelay = batchSetDelay;
window.exportAllAudio = exportAllAudio;
window.selectOutputDir = selectOutputDir;
window.downloadChapterAudio = downloadChapterAudio;
window.toggleNovelPlay = toggleNovelPlay;
window.playPrevChapter = playPrevChapter;
window.playNextChapter = playNextChapter;
window.seekNovelAudio = seekNovelAudio;
window.setNovelSpeed = setNovelSpeed;
window.abortCurrentTask = abortCurrentTask;
window.applyVoiceAssignments = applyVoiceAssignments;
window.toggleProxy = toggleProxy;
window.onApiChange = onApiChange;
window.toggleSidebar = toggleSidebar;

// ===================================================
// 核心复杂功能（从原文件迁移）
// ===================================================

// ========== 情绪脚本分析 ==========

async function startEmotionAnalysis() {
  const st = appStore.getState();
  const { llmBaseUrl, llmApiKey, llmModel } = st;
  if (!llmBaseUrl || !llmApiKey || !llmModel) {
    toast('请先配置 LLM API 信息', 'error'); return;
  }
  localStorage.setItem('mimo_llm_url', llmBaseUrl);
  localStorage.setItem('mimo_llm_key', llmApiKey);
  localStorage.setItem('mimo_llm_model', llmModel);

  const chapters = projectStore.get('chapters');
  const checked = chapters.filter(c => c.checked);
  if (!checked.length) { toast('请至少勾选要分析的章节', 'error'); return; }

  document.getElementById('emotionProgress').classList.remove('hidden');
  const queueEl = document.getElementById('emotionQueueList');
  const statusMap = new Map();

  let queueHtml = '';
  for (const ch of checked) {
    const idx = chapters.indexOf(ch);
    queueHtml += `<div class="queue-item" id="eqi-${idx}">
      <span class="qi-title">${esc(ch.title)}</span>
      <span class="queue-status queue-pending" id="eqs-${idx}">等待中</span>
    </div>`;
  }
  queueEl.innerHTML = queueHtml;
  for (const ch of checked) {
    const idx = chapters.indexOf(ch);
    statusMap.set(idx, document.getElementById(`eqs-${idx}`));
  }

  const btn = document.getElementById('emotionBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 分析中...';
  const controller = new AbortController();
  projectStore.set('currentAbort', controller);
  const signal = controller.signal;

  let done = 0, fail = 0;

  async function analyzeOne(ch) {
    const idx = chapters.indexOf(ch);
    const stEl = statusMap.get(idx);
    if (stEl) { stEl.className = 'queue-status queue-running'; stEl.textContent = '分析中...'; }
    try {
      const { characterMap, script } = await analyzeChapter(ch.title, ch.content, (cur, total) => {
        if (stEl) stEl.textContent = `分析中(${cur}/${total})...`;
      }, signal);

      ch.characterMap = characterMap;
      ch.script = script;
      const emotions = (script || []).filter(s => s.speaker_emo && s.speaker_emo !== '中性').map(s => s.speaker_emo);
      ch.mood = emotions.length ? emotions[0] : '中性';

      mergeChapterCharacters(ch, idx);
      applyVoiceAssignments(ch);

      // 保存分析结果
      const ph = projectStore.get('projectDirHandle');
      if (ph) {
        saveChapterResult(idx, { characterMap, script, mood: ch.mood }).catch(() => {});
      }

      done++;
      if (stEl) { stEl.className = 'queue-status queue-done'; stEl.textContent = `${Object.keys(characterMap).length}角色/${script.length}行`; }
    } catch (e) {
      if (e.name === 'AbortError') { if (stEl) { stEl.className = 'queue-status queue-error'; stEl.textContent = '已取消'; } return; }
      fail++;
      const msg = e.message || '未知错误';
      console.error(`[分析失败] ${ch.title}:`, msg);
      if (stEl) {
        stEl.className = 'queue-status queue-error'; stEl.textContent = '失败';
        stEl.title = msg; stEl.style.cursor = 'pointer';
        stEl.onclick = () => alert(msg);
      }
      toast(`${ch.title} 分析失败: ${msg.slice(0, 80)}`, 'error');
    }
    renderChapterList();
    updateCharList();
  }

  // 并发3章
  const queue = checked.slice();
  const running = [];
  while (queue.length || running.length) {
    while (running.length < 3 && queue.length) {
      const ch = queue.shift();
      const p = analyzeOne(ch).then(() => { running.splice(running.indexOf(p), 1); });
      running.push(p);
    }
    if (running.length) await Promise.race(running);
  }

  // 为重要角色设计音色
  if (done > 0) {
    const analyzedNames = new Set();
    for (const ch of checked) {
      if (ch.characterMap) {
        for (const rawName of Object.keys(ch.characterMap)) {
          if (rawName !== '旁白') analyzedNames.add(normalizeCharName(rawName));
        }
      }
    }
    const gc = projectStore.get('globalCharacters');
    for (const name of analyzedNames) {
      if (gc[name]?.role_tag === '重要角色') gc[name].voiceDesignPrompt = null;
    }
    const needDesign = Object.values(gc).filter(c => c.role_tag === '重要角色' && !c.voiceDesignPrompt);
    if (needDesign.length) {
      btn.innerHTML = '<span class="spinner"></span> 设计音色...';
      await generateVoiceDesignPrompts(needDesign, (d, t) => {
        btn.innerHTML = `<span class="spinner"></span> 设计音色 ${d}/${t}`;
      });
    }
    projectStore.get('chapters').forEach(ch => applyVoiceAssignments(ch));
    saveProject(true).catch(() => {});
  }

  const curCh = projectStore.get('currentChapter');
  if (curCh >= 0) { renderScriptCards(projectStore.get('chapters')[curCh]); }
  updateCharList();
  btn.disabled = false; btn.textContent = '情绪分析';
  projectStore.set('currentAbort', null);

  const charCount = Object.keys(projectStore.get('globalCharacters')).length;
  const designedCount = Object.values(projectStore.get('globalCharacters')).filter(c => c.voiceDesignPrompt).length;
  toast(`分析完成: ${done}章成功, ${charCount}个角色(${designedCount}个有音色)`, fail === 0 ? 'success' : 'error');
  // 2秒后自动隐藏进度面板
  setTimeout(() => {
    document.getElementById('emotionProgress')?.classList.add('hidden');
  }, 2000);
}

// 取消当前任务
function abortCurrentTask() {
  const ctrl = projectStore.get('currentAbort');
  if (ctrl) { ctrl.abort(); projectStore.set('currentAbort', null); toast('已取消当前任务', 'info'); }
}
window.abortCurrentTask = abortCurrentTask;

// ========== 脚本合成辅助 ==========

function buildStyleInstruction(item) {
  const parts = [];
  const emoStyle = EMO_STYLE_MAP[item.speaker_emo];
  if (emoStyle) parts.push(emoStyle);
  if (item.emo_vector?.some(v => v > 0)) {
    const labels = ['喜', '怒', '哀', '惧', '厌恶', '低落', '惊喜', '平静'];
    const active = item.emo_vector.map((v, i) => v > 0.05 ? `${labels[i]}${v.toFixed(1)}` : null).filter(Boolean);
    if (active.length) parts.push('情感微调：' + active.join('、'));
  }
  return parts.join('，') || '';
}

function getSynthCacheKey(item) {
  const va = item._voiceAssignment;
  const vaKey = va ? (va.type + ':' + (va.prompt || va.voice || '')) : 'none';
  return [item.speaker, item.content, item.speaker_emo, JSON.stringify(item.emo_vector || []), vaKey].join('|');
}

async function ensureVoiceSample(name, signal) {
  const vsc = projectStore.get('voiceSampleCache');
  if (vsc.has(name)) return vsc.get(name);
  const gc = projectStore.get('globalCharacters');
  const char = gc[name];
  if (!char?.voiceDesignPrompt) return null;
  const blob = await callTTSApi(appStore.get('modelVoiceDesign'), [
    { role: 'user', content: char.voiceDesignPrompt }
  ], { format: 'wav', optimize_text_preview: true }, signal);
  const arrayBuf = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const sample = { base64: btoa(binary), mime: 'audio/wav' };
  vsc.set(name, sample);
  return sample;
}

// ========== 逐行合成（PCM拼接） ==========

async function synthesizeScript(ch, voice, statusCallback, signal) {
  const script = ch.script;
  if (!script?.length) throw new Error('该章节没有脚本数据');

  // 预生成 VoiceDesign 音色样本
  const vdSpeakers = new Set();
  script.forEach(item => {
    if (item._voiceAssignment?.type === 'voicedesign') vdSpeakers.add(item.speaker);
  });
  if (vdSpeakers.size) {
    if (statusCallback) statusCallback(0, script.length, '正在生成 ' + vdSpeakers.size + ' 个角色音色样本...');
    for (const name of vdSpeakers) await ensureVoiceSample(name, signal);
  }

  const pcmChunks = [];
  const sampleRate = 24000;
  let processed = 0;
  const failedLines = [];
  const cache = projectStore.get('synthCache');

  for (let i = 0; i < script.length; i++) {
    const item = script[i];
    const text = (item.content || '').trim();
    if (!text) { processed++; continue; }

    try {
      let pcm;
      const cacheKey = getSynthCacheKey(item);
      const cached = cache.get(cacheKey);
      if (cached) { pcm = cached; }
      else {
        let blob;
        const va = item._voiceAssignment;
        if (va?.type === 'voicedesign') {
          const sample = projectStore.get('voiceSampleCache').get(item.speaker);
          if (sample) {
            const style = buildStyleInstruction(item);
            const msgs = [];
            if (style) msgs.push({ role: 'user', content: style });
            msgs.push({ role: 'assistant', content: text });
            blob = await callTTSApi(appStore.get('modelVoiceClone'), msgs, {
              format: 'wav', voice: `data:${sample.mime};base64,${sample.base64}`
            }, signal);
          } else {
            const style = buildStyleInstruction(item);
            const msgs = [];
            if (style) msgs.push({ role: 'user', content: `${va.prompt}. ${style}` });
            else msgs.push({ role: 'user', content: va.prompt });
            msgs.push({ role: 'assistant', content: text });
            blob = await callTTSApi(appStore.get('modelVoiceDesign'), msgs, { format: 'wav' }, signal);
          }
        } else {
          const style = buildStyleInstruction(item);
          const presetVoice = (va?.type === 'preset') ? va.voice : voice;
          const msgs = [];
          if (style) msgs.push({ role: 'user', content: style });
          msgs.push({ role: 'assistant', content: text });
          blob = await callTTSApi(appStore.get('modelTTS'), msgs, { format: 'wav', voice: presetVoice }, signal);
        }
        const { pcm: pcmData } = await wavToPCM(blob);
        cache.set(cacheKey, pcmData);
        pcm = pcmData;
      }
      pcmChunks.push(pcm);
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      failedLines.push({ idx: i + 1, speaker: item.speaker, text: text.slice(0, 30), error: e.message });
    }

    const delay = Math.max(100, Math.min(item.delay || 350, 1200));
    pcmChunks.push(makeSilence(delay, sampleRate));
    processed++;
    if (statusCallback) statusCallback(processed, script.length);
  }

  if (!pcmChunks.length) throw new Error('所有脚本行合成失败');
  if (failedLines.length) {
    const summary = failedLines.map(f => `#${f.idx} ${f.speaker}: ${f.text}`).join('\n');
    toast(`有 ${failedLines.length} 行合成失败`, 'error');
    console.warn('[合成失败]\n' + summary);
  }

  const merged = concatPCM(pcmChunks);
  return { blob: pcmToWav(merged, sampleRate), failedLines };
}

async function synthesizeFallback(ch, voice) {
  const msgs = [];
  if (ch.ttsPrompt) msgs.push({ role: 'user', content: ch.ttsPrompt });
  msgs.push({ role: 'assistant', content: ch.content });
  return callTTSApi(appStore.get('modelTTS'), msgs, { format: 'wav', voice });
}

// ========== 单章 / 批量生成 ==========

async function generateChapterAudio(btnEl) {
  const chapters = projectStore.get('chapters');
  const cur = projectStore.get('currentChapter');
  if (cur < 0) return;
  const ch = chapters[cur];
  const voice = document.getElementById('novelVoice').value;
  const btn = btnEl || document.querySelector('[onclick*="generateChapterAudio"]');
  btn.disabled = true; btn.textContent = '生成中...';

  await ensureAllVoicesDesigned();
  try {
    let blob, failedLines = [];
    if (ch.script?.length) {
      const result = await synthesizeScript(ch, voice, (done, total) => {
        btn.textContent = `合成中 ${done}/${total}`;
      }, null);
      blob = result.blob;
      failedLines = result.failedLines || [];
    } else {
      btn.textContent = '合成中(整章)...';
      blob = await synthesizeFallback(ch, voice);
    }

    const blobs = projectStore.get('novelAudioBlobs');
    blobs[cur] = blob;
    projectStore.set('novelAudioBlobs', blobs);

    const odh = projectStore.get('outputDirHandle');
    const pdh = projectStore.get('projectDirHandle');
    if (odh) await saveAudioToFile(odh, blob, ch.title);
    if (pdh) await saveAudioToDir(blob, ch.title);

    loadNovelChapterAudio(cur);
    renderChapterList();
    toast(
      failedLines.length ? `本章音频生成完成(${failedLines.length}行失败)` : '本章音频生成成功' + ((odh || pdh) ? '，已自动保存' : ''),
      failedLines.length ? 'error' : 'success'
    );
  } catch (e) {
    toast('生成失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '生成本章音频';
  }
}

async function startBatchGenerate() {
  const chapters = projectStore.get('chapters');
  const checked = chapters.filter(c => c.checked);
  if (!checked.length) { toast('请至少选择一章', 'error'); return; }
  const voice = document.getElementById('novelVoice').value;

  await ensureAllVoicesDesigned();

  document.getElementById('batchProgress').classList.remove('hidden');
  const queueEl = document.getElementById('queueList');
  const blobs = projectStore.get('novelAudioBlobs');

  queueEl.innerHTML = checked.map(ch => {
    const idx = chapters.indexOf(ch);
    return `<div class="queue-item" id="qi-${idx}">
      <span class="qi-title">${esc(ch.title)}</span>
      <span class="queue-status queue-pending" id="qs-${idx}">等待中</span>
    </div>`;
  }).join('');

  const btn = document.getElementById('batchBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 生成中...';
  const ctrl = new AbortController();
  projectStore.set('currentAbort', ctrl);
  const signal = ctrl.signal;

  for (const ch of checked) {
    if (signal.aborted) break;
    const idx = chapters.indexOf(ch);
    const stEl = document.getElementById(`qs-${idx}`);
    stEl.className = 'queue-status queue-running'; stEl.textContent = '生成中...';
    try {
      let blob, failedLines = [];
      if (ch.script?.length) {
        const result = await synthesizeScript(ch, voice, (done, total) => {
          stEl.textContent = `合成中 ${done}/${total}`;
        }, signal);
        blob = result.blob;
        failedLines = result.failedLines || [];
      } else {
        stEl.textContent = '合成中(整章)...';
        blob = await synthesizeFallback(ch, voice);
      }
      blobs[idx] = blob;
      const odh = projectStore.get('outputDirHandle');
      const pdh = projectStore.get('projectDirHandle');
      if (odh) await saveAudioToFile(odh, blob, ch.title);
      if (pdh) await saveAudioToDir(blob, ch.title);
      stEl.className = 'queue-status queue-done';
      stEl.textContent = failedLines.length ? `完成(${failedLines.length}行失败)` : '完成';
      renderChapterList();
    } catch (e) {
      if (e.name === 'AbortError') { stEl.className = 'queue-status queue-error'; stEl.textContent = '已取消'; break; }
      stEl.className = 'queue-status queue-error'; stEl.textContent = '失败';
      stEl.title = e.message; stEl.style.cursor = 'pointer';
      stEl.onclick = () => alert(e.message);
    }
  }

  btn.disabled = false; btn.textContent = '全部生成';
  projectStore.set('currentAbort', null);

  const firstIdx = Object.keys(blobs).map(Number).sort((a, b) => a - b)[0];
  if (firstIdx !== undefined) loadNovelChapterAudio(firstIdx);

  const odh = projectStore.get('outputDirHandle');
  const pdh = projectStore.get('projectDirHandle');
  const saveInfo = [];
  if (odh) saveInfo.push('音频目录: ' + odh.name);
  if (pdh) saveInfo.push('项目目录: ' + pdh.name);
  toast(saveInfo.length ? '批量生成完成，已保存到 ' + saveInfo.join(' + ') : '批量生成完成', 'success');
  setTimeout(() => {
    document.getElementById('batchProgress')?.classList.add('hidden');
  }, 2000);
}

// ========== 试听单行 / 预设音色 ==========

async function playScriptLine(idx) {
  const chapters = projectStore.get('chapters');
  const ch = chapters[projectStore.get('currentChapter')];
  const item = ch?.script?.[idx];
  if (!item) return;
  const voice = document.getElementById('novelVoice').value;
  const va = item._voiceAssignment;

  try {
    const style = buildStyleInstruction(item);
    let blob;
    if (va?.type === 'voicedesign') {
      const msgs = [];
      if (style) msgs.push({ role: 'user', content: va.prompt + '. Style: ' + style });
      else msgs.push({ role: 'user', content: va.prompt });
      msgs.push({ role: 'assistant', content: item.content });
      blob = await callTTSApi(appStore.get('modelVoiceDesign'), msgs, { format: 'wav' });
    } else {
      const msgs = [];
      if (style) msgs.push({ role: 'user', content: style });
      msgs.push({ role: 'assistant', content: item.content });
      const v = (va?.type === 'preset') ? va.voice : voice;
      blob = await callTTSApi(appStore.get('modelTTS'), msgs, { format: 'wav', voice: v });
    }
    new Audio(URL.createObjectURL(blob)).play();
  } catch (e) {
    toast('试听失败: ' + e.message, 'error');
  }
}

function selectPresetVoice(v) {
  document.getElementById('novelVoice').value = v;
  toast('旁白音色已设为: ' + v, 'info');
}

// ========== 角色管理弹窗 ==========

function showCharacterModal() {
  const modal = document.getElementById('characterModal');
  const content = document.getElementById('characterModalContent');
  const chars = Object.values(projectStore.get('globalCharacters'));
  if (!chars.length) {
    content.innerHTML = '<p style="color:var(--text2);text-align:center;padding:20px;">还没有角色数据，请先进行情绪分析</p>';
  } else {
    content.innerHTML = chars.map(c => {
      const voiceInfo = c.voiceDesignPrompt
        ? `<div style="margin-top:4px;padding:6px;background:var(--bg);border-radius:6px;font-size:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <div style="color:var(--accent);font-weight:500;">VoiceDesign 提示词：</div>
              <div style="display:flex;gap:4px;">
                <button class="btn btn-sm btn-secondary" onclick="window.auditionCharacterVoice('${esc(c.name)}')" style="font-size:10px;padding:2px 8px;">试听</button>
                <button class="btn btn-sm btn-secondary" onclick="window.designSingleVoice('${esc(c.name)}')" style="font-size:10px;padding:2px 8px;">重新设计</button>
              </div>
            </div>
            <textarea onchange="window.updateCharVoicePrompt('${esc(c.name)}',this.value)" style="width:100%;min-height:40px;font-size:12px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg2);color:var(--text);resize:vertical;">${esc(c.voiceDesignPrompt)}</textarea>
           </div>`
        : `<div style="margin-top:4px;">
            <button class="btn btn-sm btn-primary" onclick="window.designSingleVoice('${esc(c.name)}')">生成音色提示词</button>
            <span style="font-size:11px;color:var(--text2);margin-left:8px;">（AI 根据角色信息自动设计）</span>
           </div>`;
      const tc = c.role_tag === '重要角色' ? 'var(--accent)' : 'var(--text2)';
      return `<div style="padding:12px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
          <b style="font-size:14px;">${esc(c.name)}</b>
          <span style="font-size:11px;color:${tc};">${esc(c.role_tag)}</span>
          <span style="font-size:12px;color:var(--text2);">${esc(c.gender)} · ${esc(c.age)}</span>
          <span style="font-size:11px;color:var(--text2);margin-left:auto;">出现于 ${c.chapters.length} 章</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;">性格: ${esc(c.personality)}</div>
        <div style="font-size:12px;color:var(--text2);">音色: ${esc(c.timbre)}</div>
        ${voiceInfo}
      </div>`;
    }).join('');
  }
  modal.classList.remove('hidden');
}

function closeCharacterModal() {
  document.getElementById('characterModal').classList.add('hidden');
}

async function designAllVoices() {
  const st = appStore.getState();
  if (!st.llmBaseUrl || !st.llmApiKey || !st.llmModel) { toast('请先配置 LLM API', 'error'); return; }
  const gc = projectStore.get('globalCharacters');
  const important = Object.values(gc).filter(c => c.role_tag === '重要角色' && !c.voiceDesignPrompt);
  if (!important.length) {
    toast('没有需要设计音色的重要角色（路人角色使用预设音色）', 'info');
    projectStore.get('chapters').forEach(ch => applyVoiceAssignments(ch));
    showCharacterModal();
    return;
  }
  toast('正在为 ' + important.length + ' 个重要角色设计音色...', 'info');
  await generateVoiceDesignPrompts(important);
  projectStore.get('chapters').forEach(ch => applyVoiceAssignments(ch));
  updateCharList();
  const designed = important.filter(c => c.voiceDesignPrompt).length;
  toast(`音色设计完成: ${designed}/${important.length}`, designed > 0 ? 'success' : 'error');
  showCharacterModal();
}

async function designSingleVoice(name) {
  const gc = projectStore.get('globalCharacters');
  const char = gc[name];
  if (!char) return;
  const st = appStore.getState();
  if (!st.llmBaseUrl || !st.llmApiKey || !st.llmModel) { toast('请先配置 LLM API', 'error'); return; }
  toast(`正在为 ${name} 生成音色...`, 'info');
  await generateVoiceDesignPrompts([char]);
  if (char.voiceDesignPrompt) {
    projectStore.get('chapters').forEach(ch => applyVoiceAssignments(ch));
    updateCharList();
    toast(`${name} 音色生成成功`, 'success');
    showCharacterModal();
  } else {
    toast(`${name} 音色生成失败`, 'error');
  }
}

function updateCharVoicePrompt(name, value) {
  const gc = projectStore.get('globalCharacters');
  if (gc[name]) {
    gc[name].voiceDesignPrompt = value.trim();
    gc[name].ttsStyle = value.trim();
    projectStore.get('chapters').forEach(ch => applyVoiceAssignments(ch));
  }
}

async function auditionCharacterVoice(name) {
  const gc = projectStore.get('globalCharacters');
  const char = gc[name];
  if (!char?.voiceDesignPrompt) { toast('该角色没有音色提示词', 'error'); return; }
  toast(`正在试听 ${name} 的音色...`, 'info');
  try {
    const blob = await callTTSApi(appStore.get('modelVoiceDesign'), [
      { role: 'user', content: char.voiceDesignPrompt }
    ], { format: 'wav', optimize_text_preview: true });
    // 缓存样本
    const arrBuf = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrBuf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    projectStore.get('voiceSampleCache').set(name, { base64: btoa(bin), mime: 'audio/wav' });
    new Audio(URL.createObjectURL(blob)).play();
    toast(`${name} 试听播放中`, 'success');
  } catch (e) {
    toast('试听失败: ' + e.message, 'error');
  }
}

// ========== 批量停顿 / 导出 ==========

function batchSetDelay() {
  const chapters = projectStore.get('chapters');
  const ch = chapters[projectStore.get('currentChapter')];
  if (!ch?.script?.length) { toast('请先选择有脚本的章节', 'error'); return; }
  const delay = prompt('批量设置旁白停顿时长（毫秒）:', '500');
  if (delay === null) return;
  const ms = parseInt(delay) || 500;
  ch.script.forEach(item => { if (item.speaker === '旁白') item.delay = ms; });
  renderScriptCards(ch);
  toast('旁白停顿已设为 ' + ms + 'ms', 'success');
}

async function exportAllAudio() {
  const blobs = projectStore.get('novelAudioBlobs');
  const keys = Object.keys(blobs);
  if (!keys.length) { toast('没有可导出的音频', 'error'); return; }
  toast('正在打包...', 'info');
  try {
    if (typeof JSZip === 'undefined') await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    const zip = new JSZip();
    const chapters = projectStore.get('chapters');
    for (const idx of keys) {
      const ch = chapters[idx];
      const name = ((ch?.title || `chapter_${idx}`).replace(/[\\/:*?"<>|]/g, '_')) + '.wav';
      zip.file(name, blobs[idx]);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `${(projectStore.get('currentProjectName') || 'novel').replace(/[\\/:*?"<>|]/g, '_')}_${Date.now()}.zip`;
    a.click();
    toast('导出成功', 'success');
  } catch (e) {
    toast('导出失败: ' + e.message, 'error');
  }
}

// ========== 音频目录 ==========

async function saveAudioToFile(dirHandle, blob, filename) {
  if (!dirHandle) return false;
  try {
    const safe = filename.replace(/[\\/:*?"<>|]/g, '_');
    const fn = safe.endsWith('.wav') ? safe : safe + '.wav';
    const fh = await dirHandle.getFileHandle(fn, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
    return true;
  } catch (e) { console.error('[保存失败]', filename, e); return false; }
}

async function selectOutputDir() {
  try {
    const handle = await pickFolder();
    if (handle) {
      projectStore.set('outputDirHandle', handle);
      document.getElementById('outputDirLabel').textContent = handle.name;
      toast('输出目录已选择: ' + handle.name, 'success');
    }
  } catch (e) {
    if (e.message) toast(e.message, 'error');
  }
}

function downloadChapterAudio() {
  downloadLastAudio();
}

async function selectOutputDir() {
  try {
    const handle = await pickFolder();
    if (handle) {
      projectStore.set('outputDirHandle', handle);
      document.getElementById('outputDirLabel').textContent = handle.name;
      toast('输出目录已选择: ' + handle.name, 'success');
    }
  } catch (e) {
    if (e.message) toast(e.message, 'error');
  }
}

function downloadChapterAudio() {
  downloadLastAudio();
}

// Novels
function handleNovelDrop(e) {
  e.preventDefault();
  e.target.closest('.drop-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file?.name.endsWith('.txt')) createNewProject(file);
  else toast('请拖入 TXT 文件', 'error');
}
window.handleNovelDrop = handleNovelDrop;

// Audio player
const novelAudio = document.getElementById('novelAudio');
if (novelAudio) {
  novelAudio.addEventListener('timeupdate', () => {
    if (novelAudio.duration) {
      document.getElementById('novelSeek').value = (novelAudio.currentTime / novelAudio.duration) * 100;
      document.getElementById('novelTime').textContent = `${fmtTimeStr(novelAudio.currentTime)} / ${fmtTimeStr(novelAudio.duration)}`;
    }
  });
  novelAudio.addEventListener('ended', () => playNextChapter());
}

function fmtTimeStr(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function toggleNovelPlay() {
  if (novelAudio.paused) { novelAudio.play(); document.getElementById('novelPlayBtn').textContent = '⏸'; }
  else { novelAudio.pause(); document.getElementById('novelPlayBtn').textContent = '▶'; }
}

function playPrevChapter() {
  const blobs = projectStore.get('novelAudioBlobs');
  for (let i = projectStore.get('currentChapter') - 1; i >= 0; i--) {
    if (blobs[i]) { loadNovelChapterAudio(i); novelAudio.play(); return; }
  }
}

function playNextChapter() {
  const blobs = projectStore.get('novelAudioBlobs');
  const chapters = projectStore.get('chapters');
  for (let i = projectStore.get('currentChapter') + 1; i < chapters.length; i++) {
    if (blobs[i]) { loadNovelChapterAudio(i); novelAudio.play(); return; }
  }
}

function seekNovelAudio(val) {
  if (novelAudio.duration) novelAudio.currentTime = (val / 100) * novelAudio.duration;
}

function setNovelSpeed(v) { novelAudio.playbackRate = parseFloat(v); }

function loadNovelChapterAudio(idx) {
  const blob = projectStore.get('novelAudioBlobs')[idx];
  if (!blob) return;
  projectStore.set('currentChapter', idx);
  const url = URL.createObjectURL(blob);
  novelAudio.src = url;
  document.getElementById('novelPlayer').style.display = 'block';
  document.getElementById('playerChapterTitle').textContent = projectStore.get('chapters')[idx]?.title || '-';
  document.getElementById('novelPlayBtn').textContent = '▶';
  renderChapterList();
  window.showChapter(idx);
}
