// ===================================================
// 简易响应式 Store（基于 EventTarget 的发布订阅）
// ===================================================

/**
 * 创建响应式状态 store
 * @param {object} initialState
 * @returns {object} store对象 with subscribe/getState/setState
 */
export function createStore(initialState = {}) {
  const emitter = new EventTarget();
  let state = { ...initialState };

  return {
    /** 获取当前状态（只读副本） */
    getState() {
      return { ...state };
    },

    /** 更新状态（浅合并） */
    setState(partial) {
      const prev = { ...state };
      state = { ...state, ...partial };
      emitter.dispatchEvent(new CustomEvent('change', {
        detail: { prev, current: state, partial }
      }));
    },

    /** 订阅状态变化 */
    subscribe(fn) {
      const handler = (e) => fn(e.detail);
      emitter.addEventListener('change', handler);
      return () => emitter.removeEventListener('change', handler);
    },

    /** 直接读取某个字段 */
    get(key) {
      return state[key];
    },

    /** 直接设置某个字段 */
    set(key, value) {
      this.setState({ [key]: value });
    }
  };
}

// ===================================================
// 全局 App Store
// ===================================================

export const appStore = createStore({
  // API 配置
  apiBaseUrl: localStorage.getItem('mimo_api_base') || 'https://api.xiaomimimo.com/v1',
  apiKey: localStorage.getItem('mimo_api_key') || '',
  modelTTS: localStorage.getItem('mimo_model_tts') || 'mimo-v2.5-tts',
  modelVoiceDesign: localStorage.getItem('mimo_model_voicedesign') || 'mimo-v2.5-tts-voicedesign',
  modelVoiceClone: localStorage.getItem('mimo_model_voiceclone') || 'mimo-v2.5-tts-voiceclone',

  // LLM 配置
  llmBaseUrl: localStorage.getItem('mimo_llm_url') || 'https://api.deepseek.com/v1',
  llmApiKey: localStorage.getItem('mimo_llm_key') || '',
  llmModel: localStorage.getItem('mimo_llm_model') || 'deepseek-v4-flash',

  // 主题
  theme: localStorage.getItem('mimo_theme') || 'light',

  // 后端代理
  useBackendProxy: localStorage.getItem('mimo_use_backend') === 'true',
  backendUrl: localStorage.getItem('mimo_backend_url') || 'http://localhost:8080',

  // 当前标签页
  activeTab: 0,

  // 通用
  lastAudioBlob: null,
  lastAudioUrl: null,
  lastAudioExt: 'wav',

  // 历史记录
  history: JSON.parse(localStorage.getItem('mimo_history') || '[]'),

  // 已保存音色
  savedVoices: JSON.parse(localStorage.getItem('mimo_voices') || '[]'),

  // Clone状态
  cloneBase64: null,
  cloneMime: '',
});

// ===================================================
// 项目 Store
// ===================================================

export const projectStore = createStore({
  // 项目列表
  projectList: JSON.parse(localStorage.getItem('mimo_projects') || '[]'),

  // 当前项目
  currentProjectName: '',
  projectDirHandle: null,

  // 章节
  chapters: [],
  currentChapter: -1,

  // 角色
  globalCharacters: {},

  // 音频
  novelAudioBlobs: {},
  novelPlaying: false,

  // 目录
  outputDirHandle: null,

  // 任务控制
  currentAbort: null,

  // 缓存
  synthCache: new Map(),
  voiceSampleCache: new Map(),

  // 筛选
  speakerFilter: '',
});

// ===================================================
// 持久化钩子：状态变化时自动保存到 localStorage
// ===================================================

appStore.subscribe(({ partial }) => {
  const keyMap = {
    apiBaseUrl: 'mimo_api_base',
    apiKey: 'mimo_api_key',
    theme: 'mimo_theme',
    history: 'mimo_history',
    savedVoices: 'mimo_voices',
    llmBaseUrl: 'mimo_llm_url',
    llmApiKey: 'mimo_llm_key',
    llmModel: 'mimo_llm_model',
  };

  const modelMap = {
    modelTTS: 'tts',
    modelVoiceDesign: 'voicedesign',
    modelVoiceClone: 'voiceclone',
  };

  for (const [key, value] of Object.entries(partial)) {
    if (key in keyMap) {
      localStorage.setItem(keyMap[key], typeof value === 'string' ? value : JSON.stringify(value));
    }
    if (key in modelMap) {
      localStorage.setItem(`mimo_model_${modelMap[key]}`, value || '');
    }
  }
});

projectStore.subscribe(({ partial }) => {
  if ('projectList' in partial) {
    localStorage.setItem('mimo_projects', JSON.stringify(partial.projectList));
  }
});
