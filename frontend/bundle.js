// === src/utils/helpers.js ===
// ===================================================
// 通用工具函数
// ===================================================

/**
 * HTML转义
 */
function esc(s) {
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
function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 字符串简单hash
 */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Base64 → Blob
 */
function base64ToBlob(b64, mime) {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

/**
 * 文件后缀获取
 */
function getExt(format) {
  const map = { wav: 'wav', mp3: 'mp3', pcm16: 'pcm', opus: 'opus', aac: 'aac' };
  return map[format] || 'wav';
}

/**
 * 动态加载script
 */
function loadScript(src) {
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
function normalizeCharName(name) {
  return name.trim()
    .replace(/[。！？，、：；"'""''….,!?:;"'\s]+$/, '')
    .trim();
}


// === src/utils/emotions.js ===
// ===================================================
// 情绪标签 → 自然语言风格描述映射
// ===================================================

const EMO_STYLE_MAP = {
  '不解': '带着困惑和疑问的语气，眉头微皱',
  '中性': '',
  '催促': '语气急切催促',
  '反问': '反问的语气，微微上扬的语调',
  '口是心非': '故作镇定但语调不自然，有些心虚',
  '哀伤': '声音低沉哀伤',
  '哭腔': '带着哭腔，声音颤抖',
  '哭诉': '哭着诉说，声音哽咽断断续续',
  '哽咽': '哽咽着说不出话，停顿中带着抽泣',
  '嘲讽': '嘲讽的语气，带着不屑和挖苦',
  '嘶吼': '嘶声力竭地喊叫，声音沙哑',
  '天真': '天真无邪的语气，声音清脆明亮',
  '失落': '失落无力，声音低落',
  '委屈哭': '委屈地哭泣，声音带着不满',
  '害怕': '声音颤抖，带着恐惧',
  '小声说': '压低声音小声说话',
  '小声请求': '小声地恳求，声音柔弱',
  '开朗': '开朗明快，语调上扬',
  '微疯': '略带疯狂，语气不稳',
  '微请求': '轻声请求，语气温和试探',
  '怒其不争': '恨铁不成钢的愤怒，语气沉重',
  '恐惧': '极度恐惧，声音颤抖发虚',
  '恭敬': '恭敬有礼，语气谦卑',
  '悲伤': '悲伤低沉，声音压抑',
  '惊讶': '惊讶的语气，音调突然升高',
  '感谢': '真诚感谢，语气温暖',
  '愤怒': '愤怒大声，语气激烈',
  '撒娇': '撒娇的语气，声音甜腻',
  '明媚': '明媚欢快，声音明亮有活力',
  '气急': '气急败坏，语气急促激烈',
  '温柔': '温柔轻声，语调柔和',
  '生气': '生气不满，语气强硬',
  '疑惑': '疑惑不解，语调上扬',
  '疑问': '疑问的语气，尾音上扬',
  '自我怀疑': '自我怀疑，语气犹豫不自信',
  '花痴': '花痴的语气，声音兴奋发嗲',
  '苦涩': '苦涩无奈，声音低沉沙哑',
  '训斥': '严厉训斥，语气严肃强硬',
  '质问': '质问的语气，声音严厉',
  '轻蔑': '轻蔑不屑，语气冷淡',
  '阴森': '阴森低沉，声音冰冷',
  '霸气': '霸气十足，声音浑厚有力',
  '骂街': '破口大骂，声音尖锐激烈',
  '高兴': '高兴欢快，语调上扬明亮'
};

/** 所有可选情绪标签 */
const EMO_LABELS = [
  '中性', '不解', '催促', '反问', '口是心非', '哀伤', '哭腔', '哭诉',
  '哽咽', '嘲讽', '嘶吼', '天真', '失落', '委屈哭', '害怕', '小声说',
  '小声请求', '开朗', '微疯', '微请求', '怒其不争', '恐惧', '恭敬',
  '悲伤', '惊讶', '感谢', '愤怒', '撒娇', '明媚', '气急', '温柔',
  '生气', '疑惑', '疑问', '自我怀疑', '花痴', '苦涩', '训斥', '质问',
  '轻蔑', '阴森', '霸气', '骂街', '高兴'
];

/** 情绪向量标签 */
const EMO_VECTOR_LABELS = ['喜', '怒', '哀', '惧', '厌恶', '低落', '惊喜', '平静'];

/** 情绪→颜色映射 */
function getMoodColor(mood) {
  const colors = {
    '紧张': '#e74c3c', '平静': '#3498db', '悲伤': '#8e44ad', '开心': '#f39c12',
    '愤怒': '#c0392b', '恐惧': '#7f8c8d', '温馨': '#e67e22', '悬疑': '#2c3e50',
    '浪漫': '#e91e63', '激动': '#ff5722', '沉重': '#607d8b'
  };
  for (const [k, v] of Object.entries(colors)) {
    if (mood && mood.includes(k)) return v;
  }
  return '#6c757d';
}


// === src/utils/encoding.js ===
// ===================================================
// 文本编码检测（UTF-8 / GB18030 / UTF-16）
// ===================================================

/**
 * 检测文本字节数组的编码
 * @param {Uint8Array} bytes
 * @returns {string} 编码名称
 */
function detectEncoding(bytes) {
  // BOM检测
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le';
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be';
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8';

  // 纯ASCII → UTF-8
  if (bytes.every(b => b < 0x80)) return 'utf-8';

  // GBK vs UTF-8：比较中文标点出现次数
  try {
    const sample = bytes.slice(0, Math.min(bytes.length, 10000));
    const utf8Text = new TextDecoder('utf-8').decode(sample);
    const gbText = new TextDecoder('gb18030').decode(sample);

    const punct = '\u3002\uFF1F\uFF01\uFF0C\u3001\uFF1B\uFF1A\u201C\u201D\u2018\u2019\uFF08\uFF09\u2014';
    let utf8Score = 0, gbScore = 0;
    for (let i = 0; i < punct.length; i++) {
      utf8Score += utf8Text.split(punct[i]).length - 1;
      gbScore += gbText.split(punct[i]).length - 1;
    }

    // GB解码出的标点明显更多 → GBK编码
    if (gbScore > utf8Score * 2) return 'gb18030';
    return 'utf-8';
  } catch {
    return 'gb18030';
  }
}

/**
 * 以检测到的编码解码文本
 */
function decodeText(bytes) {
  const encoding = detectEncoding(bytes);
  return {
    text: new TextDecoder(encoding).decode(bytes),
    encoding
  };
}


// === src/utils/audio.js ===
// ===================================================
// 音频处理工具：WAV解析、PCM拼接、静音生成
// ===================================================

/**
 * 从WAV Blob中提取PCM数据
 * @returns {Promise<{pcm: Int16Array, sampleRate: number}>}
 */
async function wavToPCM(wavBlob) {
  const buf = await wavBlob.arrayBuffer();
  const view = new DataView(buf);

  let dataOffset = 44;
  let dataSize = buf.byteLength - 44;

  // 解析WAV chunks，找到 'data' chunk
  if (buf.byteLength > 44) {
    let offset = 12; // 跳过 RIFF+WAVE
    while (offset + 8 <= buf.byteLength) {
      const chunkId = String.fromCharCode(
        view.getUint8(offset), view.getUint8(offset + 1),
        view.getUint8(offset + 2), view.getUint8(offset + 3)
      );
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }
  }

  const numSamples = Math.min(dataSize, buf.byteLength - dataOffset) / 2;
  const pcm = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    pcm[i] = view.getInt16(dataOffset + i * 2, true);
  }
  return { pcm, sampleRate: 24000 };
}

/**
 * 生成指定时长的静音PCM
 */
function makeSilence(ms, sampleRate = 24000) {
  const numSamples = Math.round(sampleRate * ms / 1000);
  return new Int16Array(numSamples);
}

/**
 * 拼接多个PCM数组
 */
function concatPCM(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const result = new Int16Array(total);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

/**
 * PCM → WAV Blob
 */
function pcmToWav(pcm, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcm.length * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);

  const writeStr = (o, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);        // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(44 + i * 2, pcm[i], true);
  }

  return new Blob([buf], { type: 'audio/wav' });
}


// === src/utils/chapterSplit.js ===
// ===================================================
// 小说章节拆分
// ===================================================

/**
 * 将小说文本智能拆分为章节
 * @param {string} text 完整文本
 * @param {string} filename 文件名（用于生成项目名）
 * @returns {Array<{title: string, content: string, checked: boolean, mood: null}>}
 */
function splitChapters(text, filename) {
  const chapters = [];
  const title = filename.replace(/\.txt$/i, '');

  // 扫描所有章节标记位置
  const chapRegex = /(?:^|\n)(\s*(?:第\s*[0-9一二三四五六七八九十百千]+\s*[章回节篇卷]|[Cc]hapter\s+\d+|(?:序[章幕篇]?|[楔][子]?|引[子言]?|尾[声]?|番外)\s*[:：\s]|\d{1,4}\s*[\.、．]\s*\S))/g;
  const positions = [];
  let m;
  while ((m = chapRegex.exec(text)) !== null) {
    positions.push(m.index + m[0].indexOf(m[1].trimStart()));
  }

  if (positions.length <= 1) {
    // 没找到章节标记，尝试按连续空行分段
    const blocks = text.split(/\n{2,}/).filter(s => s.trim());
    if (blocks.length > 1) {
      for (let i = 0; i < blocks.length; i++) {
        const firstLine = blocks[i].trim().split('\n')[0].trim();
        const label = firstLine.length <= 30 ? firstLine : `段落 ${i + 1}`;
        chapters.push({ title: label, content: blocks[i].trim(), checked: true, mood: null });
      }
    } else {
      chapters.push({ title, content: text.trim(), checked: true, mood: null });
    }
  } else {
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i];
      const end = i + 1 < positions.length ? positions[i + 1] : text.length;
      const part = text.slice(start, end).trim();

      // 提取章节标题（首行）
      const rawTitle = part.split('\n')[0].trim();
      const titleMatch = rawTitle.match(
        /^(第\s*[0-9一二三四五六七八九十百千]+\s*[章回节篇卷](?:\s*[\.、．:：]?\s*.*)?|[Cc]hapter\s+\d+\s*[\.、．:]?\s*.*|(?:序[章幕篇]?|[楔][子]?|引[子言]?|尾[声]?|番外)\s*[:：\s]?\s*.*)/
      );
      const chTitle = titleMatch ? titleMatch[0].trim() : rawTitle.slice(0, 50);

      chapters.push({
        title: (chTitle && chTitle.length <= 50) ? chTitle : `第${i + 1}章`,
        content: part,
        checked: true,
        mood: null
      });
    }
  }

  return chapters;
}


// === src/utils/jsonParser.js ===
// ===================================================
// LLM返回JSON的清理与解析
// ===================================================

/**
 * 清理JSON响应（去除markdown代码块等）
 */
function cleanJsonResponse(raw) {
  let text = raw.trim();
  // 去掉 markdown 代码块
  text = text.replace(/^```(?:json)?\s*\n?/i, '');
  text = text.replace(/\n?```\s*$/i, '');
  // 提取第一个 { 到最后一个 }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) {
    text = text.slice(first, last + 1);
  }
  // 预修复尾部逗号
  text = text.replace(/,(\s*[}\]])/g, '$1');
  return text.trim();
}

/**
 * 逐字符扫描，去除JSON中所有位置的尾部逗号
 */
function stripTrailingCommas(json) {
  const result = [];
  let i = 0;
  const len = json.length;

  while (i < len) {
    const ch = json[i];
    if (ch === '"') {
      result.push(ch);
      i++;
      while (i < len && json[i] !== '"') {
        if (json[i] === '\\') { result.push(json[i]); i++; }
        if (i < len) { result.push(json[i]); i++; }
      }
      if (i < len) { result.push(json[i]); i++; }
    } else if (ch === ',') {
      let j = i + 1;
      while (j < len && /\s/.test(json[j])) j++;
      if (j < len && (json[j] === '}' || json[j] === ']')) {
        i = j;
      } else {
        result.push(ch);
        i++;
      }
    } else {
      result.push(ch);
      i++;
    }
  }
  return result.join('');
}

/**
 * 多策略JSON解析（处理LLM的各种格式问题）
 */
function tryParseJson(raw) {
  let cleaned = cleanJsonResponse(raw);
  let lastErr = null;

  // 策略1: 直接解析
  try { return JSON.parse(cleaned); } catch (e) { lastErr = e; }

  // 策略2: 修复中文引号
  let fixed = cleaned.replace(/[""''""]/g, '"').replace(/[''']/g, "'");
  try { return JSON.parse(fixed); } catch (e) { lastErr = e; }

  // 策略3: 修复尾部逗号
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(fixed); } catch (e) { lastErr = e; }

  // 策略4: 修复未转义换行
  fixed = fixed
    .replace(/(?<="[^"]*)\n(?=[^"]*")/g, '\\n')
    .replace(/(?<="[^"]*)\r(?=[^"]*")/g, '\\r')
    .replace(/(?<="[^"]*)\t(?=[^"]*")/g, '\\t');
  try { return JSON.parse(fixed); } catch (e) { lastErr = e; }

  // 策略5: 综合修复
  fixed = cleaned
    .replace(/[""''""]/g, '"').replace(/[''']/g, "'")
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/(?<="[^"]*)\n(?=[^"]*")/g, '\\n')
    .replace(/(?<="[^"]*)\r(?=[^"]*")/g, '\\r')
    .replace(/(?<="[^"]*)\t(?=[^"]*")/g, '\\t');
  try { return JSON.parse(fixed); } catch (e) { lastErr = e; }

  // 策略6: 逐字符去尾部逗号
  fixed = stripTrailingCommas(cleaned);
  try { return JSON.parse(fixed); } catch (e) { lastErr = e; }

  // 策略7: 策略6 + 中文引号
  fixed = stripTrailingCommas(
    cleaned.replace(/[""''""]/g, '"').replace(/[''']/g, "'")
  );
  try { return JSON.parse(fixed); } catch (e) { lastErr = e; }

  throw new Error(
    `JSON解析失败: ${lastErr.message}\n清理后前300字：${cleaned.slice(0, 300)}`
  );
}


// === src/utils/promptTemplates.js ===
// ===================================================
// LLM Prompt模板
// ===================================================

/** 小说章节脚本分析Prompt */
const SCRIPT_ANALYSIS_PROMPT = `你是一个专业有声书脚本分析师。请仔细阅读提供的小说章节文本，将其转换为包含深度角色分析和精密有声书脚本的 JSON 格式。

## 输出结构
输出必须是纯净的 JSON，严禁包含 markdown 标记（如 \`\`\`json），严禁包含任何注释或前言后语。根对象包含两个顶级字段：

{
  "character_map": { ... },
  "script": [ ... ]
}

## character_map 角色深度分析
提取本章节出现的关键角色（不含旁白）：
- 键: 角色姓名（与原文一致）
- gender: 性别（男/女/未知）
- age: 年龄或年龄范围
- role_tag: "重要角色"（主角/主要配角/反派/名字独特性格鲜明）或 "路人角色"（名字通用/描述简略的龙套）
- personality: 30-60字，人物画像。重要角色强调独特性；路人角色强调职业特征
- timbre: 音色建议。重要角色描述辨识度高的声音；路人角色描述大众刻板印象的声音

## script 有声书演绎脚本
使用两套情感控制系统：
- speaker_emo: 情感声线标签，从以下列表选择。旁白固定为"中性"，角色默认"中性"，仅在情绪关键转变时切换。
- emo_vector: 8个浮点数数组 [喜, 怒, 哀, 惧, 厌恶, 低落, 惊喜, 平静]。旁白固定全0，角色默认全0，单值上限0.3。

每个脚本对象字段：
- speaker: 说话者（"旁白" 或 角色名）
- speaker_emo: 情感声线标签（从下方列表选择）
- content: 对话或旁白内容。长段落（>100字）在标点处拆分。只保留 ，。、！？和...。
- emo_vector: 8位浮点数组
- delay: 整数毫秒。旁白200-500ms，角色150-500ms，情绪转折处400-1000ms。节奏自然流畅，不急不慢

## 可选 speaker_emo 列表
不解、中性、催促、反问、口是心非、哀伤、哭腔、哭诉、哽咽、嘲讽、嘶吼、天真、失落、委屈哭、害怕、小声说、小声请求、开朗、微疯、微请求、怒其不争、恐惧、恭敬、悲伤、惊讶、感谢、愤怒、撒娇、明媚、气急、温柔、生气、疑惑、疑问、自我怀疑、花痴、苦涩、训斥、质问、轻蔑、阴森、霸气、骂街、高兴

## 克制原则
默认状态永远是中性。只在原文有明确且强烈的必要性时才调整 speaker_emo 和 emo_vector。

## 小说章节内容如下：
`;

/** 音色设计Prompt */
function voiceDesignPrompt(charDescs) {
  return `你是有声书音色设计师。根据以下角色信息，为每个角色生成 MiMo TTS VoiceDesign 音色描述。

音色描述写作指南（参考官方文档）：
- 必写项：① 身份锚点（年龄段+性别，决定基频）② 声音质感（气息走向、共鸣位置、吐字与音色底色）③ 默认情绪底色（高亢/松弛/温软/克制）
- 可选项：风格/身份标签（拍卖师风格/播音员风格等）、辨识度小癖好（偶尔闭眼吸气/字尾带颤音等）
- 硬约束：1-2句话，白描式，不分段不列条。不写场景、不写动作、不用真实演员名
- 严禁包含语速描述（不要写 slow/fast/从容/缓慢/急促 等），语速由逐句控制
- 严禁包含情绪基调（不要写 cheerful/melancholy/warm tone 等），情绪由逐句控制
- 不要写混响/回声等后期处理词
- 中英文均可，重要角色要有辨识度，路人角色用大众刻板印象

返回纯 JSON（不要 markdown），格式：
{"角色名": "voice design prompt", ...}

角色列表：
${charDescs}`;
}

/** VoiceDesign 辅助描述生成 */
function voiceDescGenPrompt(brief) {
  return `You are a voice design expert for MiMo TTS. Given the following brief voice description, generate a detailed English voice design prompt (1-3 sentences).

Rules:
- Only describe physical voice characteristics (base timbre), NO emotions or emotional tone
- Cover: gender/age perception/voice texture/pitch/resonance
- NO speech speed words (slow/fast/deliberate/quickly/calm/relaxed etc.) — speed is controlled per-sentence
- NO emotion words (cheerful/melancholy/warm tone etc.) — emotion is controlled per-sentence
- NO reverb/echo/post-processing terms
- Make distinctive voices for important characters
- Keep it concise, 1-3 sentences

Brief description: ${brief}

Return only the voice design prompt text, no explanations.`;
}

/** VoiceDesign 参考文本生成 */
function voiceTextGenPrompt(desc) {
  return `You are a TTS text generator. Given a voice design description, generate a short Chinese text (1-3 sentences, 30-80 characters) that perfectly matches this voice style. The text should showcase the voice's characteristics.

Voice description: ${desc}

Return ONLY the generated text, no quotes, no explanations.`;
}


// === src/store/store.js ===
// ===================================================
// 简易响应式 Store（基于 EventTarget 的发布订阅）
// ===================================================

/**
 * 创建响应式状态 store
 * @param {object} initialState
 * @returns {object} store对象 with subscribe/getState/setState
 */
function createStore(initialState = {}) {
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

const appStore = createStore({
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

const projectStore = createStore({
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


// === src/services/fileService.js ===
// ===================================================
// 文件系统服务（File System Access API + IndexedDB）
// ===================================================


const HANDLE_DB = 'MiMoTTSHandles';
let handleDb = null;

// ---------- IndexedDB (文件夹句柄持久化) ----------

function openHandleDB() {
  return new Promise((resolve, reject) => {
    if (handleDb) { resolve(handleDb); return; }
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles', { keyPath: 'name' });
      }
    };
    req.onsuccess = (e) => { handleDb = e.target.result; resolve(handleDb); };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbOp(storeName, mode, fn) {
  const db = await openHandleDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    fn(store, resolve);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function saveHandle(name, handle) {
  await dbOp('handles', 'readwrite', (store) => {
    store.put({ name, handle, time: Date.now() });
  });
}

async function getHandle(name) {
  let result = null;
  await dbOp('handles', 'readonly', (store, resolve) => {
    const req = store.get(name);
    req.onsuccess = () => { result = req.result?.handle || null; resolve(); };
    req.onerror = () => resolve();
  });
  return result;
}

async function deleteHandle(name) {
  await dbOp('handles', 'readwrite', (store) => {
    store.delete(name);
  });
}

// ---------- 文件夹选择 ----------

async function pickFolder() {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('当前浏览器不支持，请使用 Chrome/Edge');
  }
  try {
    return await window.showDirectoryPicker({ mode: 'readwrite' });
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
    return null;
  }
}

// ---------- 权限验证 ----------

async function verifyPermission(dirHandle) {
  if (!dirHandle) return false;
  let perm = await dirHandle.queryPermission({ mode: 'readwrite' });
  if (perm === 'granted') return true;
  perm = await dirHandle.requestPermission({ mode: 'readwrite' });
  return perm === 'granted';
}

// ---------- 文件读写 ----------

async function ensureDir(dirHandle, name) {
  try { await dirHandle.getDirectoryHandle(name, { create: true }); } catch {}
}

async function writeFile(dirHandle, filename, data) {
  try {
    const fh = await dirHandle.getFileHandle(filename, { create: true });
    const w = await fh.createWritable();
    await w.write(data);
    await w.close();
    return true;
  } catch (e) {
    console.error('[写入失败]', filename, e);
    return false;
  }
}

async function readFile(dirHandle, filename) {
  try {
    const fh = await dirHandle.getFileHandle(filename);
    return await (await fh.getFile()).text();
  } catch {
    return null;
  }
}

/**
 * 写入目录内子目录中的文件
 */
async function writeFileInDir(dirHandle, subDir, filename, data) {
  const sd = await dirHandle.getDirectoryHandle(subDir, { create: true });
  return writeFile(sd, filename, data);
}

/**
 * 从目录内子目录读取文件
 */
async function readFileFromDir(dirHandle, subDir, filename) {
  try {
    const sd = await dirHandle.getDirectoryHandle(subDir);
    return await readFile(sd, filename);
  } catch {
    return null;
  }
}

// ---------- 项目数据持久化 ----------

async function saveProjectToDir() {
  const state = projectStore.getState();
  const { currentProjectName, projectDirHandle, chapters, globalCharacters } = state;
  if (!projectDirHandle || !currentProjectName) return;

  // 准备角色数据（只保留可序列化字段）
  const charsCopy = {};
  for (const [k, c] of Object.entries(globalCharacters)) {
    charsCopy[k] = {
      name: c.name, gender: c.gender, age: c.age, role_tag: c.role_tag,
      personality: c.personality, timbre: c.timbre,
      voiceDesignPrompt: c.voiceDesignPrompt || null,
      ttsStyle: c.ttsStyle || null,
      chapters: Array.isArray(c.chapters) ? [...c.chapters] : [],
    };
  }

  const projectData = {
    name: currentProjectName,
    time: Date.now(),
    chapters: chapters.map(ch => ({
      title: ch.title, content: ch.content, checked: ch.checked,
      mood: ch.mood || null,
      hasAnalysis: !!(ch.characterMap || ch.script),
    })),
    globalCharacters: charsCopy,
  };

  await writeFile(projectDirHandle, 'project.json', JSON.stringify(projectData));
}

async function saveChapterResult(idx, data) {
  const { projectDirHandle } = projectStore.getState();
  if (!projectDirHandle) return;
  const fn = 'ch_' + String(idx).padStart(3, '0') + '.json';
  await writeFileInDir(projectDirHandle, 'chapters', fn, JSON.stringify(data));
}

async function saveAudioToDir(blob, filename) {
  const { projectDirHandle } = projectStore.getState();
  if (!projectDirHandle) return false;
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '_');
  const fn = safeName.endsWith('.wav') ? safeName : safeName + '.wav';
  return writeFileInDir(projectDirHandle, 'audio', fn, blob);
}

/**
 * 从目录加载项目
 */
async function loadProjectFromDir(dirHandle) {
  const raw = await readFile(dirHandle, 'project.json');
  if (!raw) throw new Error('文件夹中没有 project.json');

  const data = JSON.parse(raw);
  const chapters = (data.chapters || []).map(ch => ({
    title: ch.title, content: ch.content || '', checked: ch.checked !== false,
    mood: ch.mood || null, characterMap: ch.characterMap || null,
    script: ch.script || null, ttsPrompt: ch.ttsPrompt || null,
  }));

  // 加载章节分析结果文件
  try {
    const chapDir = await dirHandle.getDirectoryHandle('chapters');
    for (let i = 0; i < chapters.length; i++) {
      if (!chapters[i].content) {
        try {
          const content = await readFile(chapDir, `ch_${String(i).padStart(3, '0')}_content.txt`);
          if (content) chapters[i].content = content;
        } catch {}
      }
      if (!chapters[i].script && !chapters[i].characterMap) {
        try {
          const chRaw = await readFile(chapDir, `ch_${String(i).padStart(3, '0')}.json`);
          if (chRaw) {
            const chData = JSON.parse(chRaw);
            chapters[i].characterMap = chData.characterMap || null;
            chapters[i].script = chData.script || null;
            if (chData.mood) chapters[i].mood = chData.mood;
          }
        } catch {}
      }
    }
  } catch {}

  return { ...data, chapters };
}


// === src/services/llmApi.js ===
// ===================================================
// LLM API 服务层
// ===================================================




function getLLMConfig() {
  const state = appStore.getState();
  const { llmBaseUrl, llmApiKey, llmModel } = state;
  if (!llmBaseUrl || !llmApiKey || !llmModel) {
    throw new Error('请先配置 LLM API');
  }
  return { baseUrl: llmBaseUrl.replace(/\/+$/, ''), apiKey: llmApiKey, model: llmModel };
}

async function callLLM(messages, temperature = 0.3, signal) {
  const { baseUrl, apiKey, model } = getLLMConfig();

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature }),
    signal,
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    throw new Error(`LLM HTTP ${resp.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await resp.json();
  if (data.error) {
    throw new Error('LLM错误: ' + (data.error.message || JSON.stringify(data.error)));
  }

  return data.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * 测试LLM连接
 */
async function testLLMConnection() {
  const result = await callLLM(
    [{ role: 'user', content: '回复"连接成功"两个字' }],
    0.1
  );
  return result;
}

/**
 * 分块分析小说章节
 */
async function analyzeChapter(chapterTitle, content, onChunkProgress, signal) {
  const CHUNK_SIZE = 8000;
  const chunks = [];

  if (content.length <= CHUNK_SIZE) {
    chunks.push(content);
  } else {
    const paragraphs = content.split(/\n\s*\n/);
    let currentBlock = '';
    for (const para of paragraphs) {
      if (currentBlock.length + para.length > CHUNK_SIZE && currentBlock.length > 0) {
        chunks.push(currentBlock.trim());
        currentBlock = para;
      } else {
        currentBlock += (currentBlock ? '\n\n' : '') + para;
      }
    }
    if (currentBlock.trim()) chunks.push(currentBlock.trim());
  }

  const totalChunks = chunks.length;
  let mergedCharMap = {};
  let mergedScript = [];

  for (let i = 0; i < totalChunks; i++) {
    if (onChunkProgress) onChunkProgress(i + 1, totalChunks);

    const prompt = SCRIPT_ANALYSIS_PROMPT +
      `\n章节标题：${chapterTitle}（第${i + 1}/${totalChunks}部分）\n\n${chunks[i]}`;

    const raw = await callLLM([{ role: 'user', content: prompt }], 0.3, signal);

    let parsed;
    try {
      parsed = tryParseJson(raw);
    } catch (parseErr) {
      throw new Error(`JSON解析失败(块${i + 1}): ${parseErr.message}\n原始返回前200字：${raw.slice(0, 200)}`);
    }

    if (parsed.character_map) Object.assign(mergedCharMap, parsed.character_map);
    if (parsed.script?.length) mergedScript = mergedScript.concat(parsed.script);
  }

  return { characterMap: mergedCharMap, script: mergedScript };
}

/**
 * 批次生成角色音色设计提示词
 */
async function generateVoiceDesignPrompts(characters, onProgress) {
  const needsPrompt = characters.filter(c => !c.voiceDesignPrompt);
  if (!needsPrompt.length) return;

  const BATCH_SIZE = 10;
  let designed = 0;

  for (let batch = 0; batch < needsPrompt.length; batch += BATCH_SIZE) {
    const batchChars = needsPrompt.slice(batch, batch + BATCH_SIZE);
    if (onProgress) onProgress(designed, needsPrompt.length);

    const charDescs = batchChars.map(c =>
      `- ${c.name}: ${c.gender}, ${c.age}, ${c.role_tag}, 性格:${c.personality}, 音色:${c.timbre}`
    ).join('\n');

    const raw = await callLLM(
      [{ role: 'user', content: voiceDesignPrompt(charDescs) }],
      0.4
    );

    const parsed = tryParseJson(raw);
    const cleanedPrompt = (prompt) => {
      return (prompt || '')
        .replace(/,?\s*(slow|fast|quick|deliberate|measured|unhurried|leisurely|rapid|brisk|hurried|rushed|calm|relaxed)\s*(and\s*)?(pace|speech|rhythm)?/gi, '')
        .replace(/,?\s*(speaks?\s*)?(very\s*)?(slowly|quickly|rapidly|fast|deliberately|calmly)/gi, '')
        .replace(/,?\s*(at\s*a\s*)(slow|measured|deliberate|leisurely|calm|relaxed)\s*pace/gi, '')
        .replace(/,?\s*(语速|说话)\s*(很|极|非常|比较|稍)?\s*(慢|快|缓慢|急促|平稳)/g, '')
        .replace(/,?\s*(说话|语调)\s*(从容|不紧不慢|慢条斯理)/g, '')
        .replace(/\.\s*,/g, '.').replace(/,\s*\./g, '.').replace(/,\s*,/g, ',')
        .replace(/\.\s*\./g, '.').trim();
    };

    for (const c of batchChars) {
      if (parsed[c.name]) {
        let cleaned = cleanedPrompt(parsed[c.name]);
        if (cleaned && !/[.!?]$/.test(cleaned)) cleaned += '.';
        c.voiceDesignPrompt = cleaned;
        c.ttsStyle = cleaned;
        designed++;
      }
    }

    if (onProgress) onProgress(designed, needsPrompt.length);
  }

  if (onProgress) onProgress(designed, needsPrompt.length);
}

/**
 * 生成VoiceDesign描述
 */
async function generateVDDescription(brief) {
  const raw = await callLLM(
    [{ role: 'user', content: voiceDescGenPrompt(brief) }],
    0.4
  );
  return raw.replace(/^["']|["']$/g, '').trim();
}

/**
 * 生成VoiceDesign参考文本
 */
async function generateVDText(desc) {
  const raw = await callLLM(
    [{ role: 'user', content: voiceTextGenPrompt(desc) }],
    0.7
  );
  return raw.replace(/^["'「」『』]|["'「」『』]$/g, '').trim();
}


// === src/services/ttsApi.js ===
// ===================================================
// TTS API 服务层
// 支持两种模式：
//   - 直连模式（默认）：直接调用 MiMo API，API Key 存前端
//   - 代理模式：通过后端 Go 服务代理，API Key 存后端
// 切换：appStore.set('useBackendProxy', true)
// ===================================================



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
async function callTTSApi(model, messages, audioOpts, signal) {
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
async function testConnection() {
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
async function synthesizeTTS(text, voice, format, style) {
  const messages = [];
  if (style) messages.push({ role: 'user', content: style });
  messages.push({ role: 'assistant', content: text });
  return callTTSApi(appStore.getState().modelTTS, messages, { format, voice });
}

/**
 * VoiceDesign 合成
 */
async function synthesizeVoiceDesign(desc, text, format, optimizeText) {
  const messages = [{ role: 'user', content: desc }];
  if (text) messages.push({ role: 'assistant', content: text });
  const opts = { format };
  if (optimizeText) opts.optimize_text_preview = true;
  return callTTSApi(appStore.getState().modelVoiceDesign, messages, opts);
}

/**
 * VoiceClone 合成
 */
async function synthesizeVoiceClone(text, cloneBase64, cloneMime, format, style) {
  const messages = [];
  if (style) messages.push({ role: 'user', content: style });
  else messages.push({ role: 'user', content: '' });
  messages.push({ role: 'assistant', content: text });
  return callTTSApi(appStore.getState().modelVoiceClone, messages, {
    format,
    voice: `data:${cloneMime};base64,${cloneBase64}`,
  });
}


// === src/components/Toast.js ===
// ===================================================
// Toast 通知组件
// ===================================================

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * 显示Toast通知
 * @param {string} msg 消息
 * @param {'info'|'success'|'error'} type
 */
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  getContainer().appendChild(el);
  setTimeout(() => el.remove(), 3500);
}


// === src/components/AudioPlayer.js ===
// ===================================================
// 音频播放器组件
// ===================================================


let currentUrl = null;

/**
 * 播放音频Blob
 * @param {Blob} blob
 * @param {string} containerId 容器元素ID
 * @param {string} downloadBtnId 下载按钮ID（可选）
 */
function playAudio(blob, containerId, downloadBtnId) {
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
function downloadLastAudio() {
  const state = appStore.getState();
  if (!state.lastAudioBlob || !state.lastAudioUrl) return;
  const a = document.createElement('a');
  a.href = state.lastAudioUrl;
  a.download = `mimo_tts_${Date.now()}.${state.lastAudioExt}`;
  a.click();
}


// === src/App.js ===
// ===================================================
// MiMo TTS Studio - 主应用入口
// ===================================================
















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
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">暂无保存的音色</p>';
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
    el.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:13px;">暂无历史记录</p>';
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
    el.innerHTML = '<p style="color:var(--text-muted);font-size:12px;padding:8px 0;">暂无项目，点击新建项目或拖拽 TXT 开始</p>';
    return;
  }
  el.innerHTML = list.map(p => {
    const d = new Date(p.time);
    const ts = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
      <span style="flex:1;font-weight:500;cursor:pointer;color:var(--accent);" onclick="window.loadProject('${esc(p.name)}')">${esc(p.name)}</span>
      <span style="font-size:11px;color:var(--text-muted);">${ts}</span>
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
        <p style="font-size:14px;font-weight:600;">${esc(ch.title)} <span style="font-weight:normal;color:var(--text-muted);font-size:12px;">${ch.content.length} 字</span></p>
        <span style="font-size:12px;color:var(--text-muted);">原始文本预览</span>
      </div>
      <pre style="font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;color:var(--text);background:var(--bg);padding:16px;border-radius:8px;border:1px solid var(--border);max-height:70vh;overflow-y:auto;">${rawPreview}</pre>
      <p style="font-size:12px;color:var(--text-muted);margin-top:12px;text-align:center;">请在左栏勾选章节后点击「情绪分析」生成脚本</p></div>`;
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
        <div class="sc-ctrls">
          <span class="sc-label">情绪</span>
          <select onchange="window.updateScriptItem(${idx},'speaker_emo',this.value)">${emoOpts}</select>
          <span class="sc-label">停顿</span>
          <input type="number" value="${item.delay || 500}" min="0" max="5000" step="100" onchange="window.updateScriptItem(${idx},'delay',+this.value)">
          <span class="sc-label">ms</span>
        </div>
      </div>
      <div class="sc-actions">
        <button onclick="window.playScriptLine(${idx})" title="试听">&#9654;</button>
      </div>
    </div>`;
  });

  if (f) {
    html = `<div style="font-size:12px;color:var(--text-muted);padding:4px 0;margin-bottom:4px;">显示${esc(f)}共 ${visibleCount} 行 <a href="#" onclick="window.filterBySpeaker('');return false;" style="color:var(--accent);">清除筛选</a></div>` + html;
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
    el.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">分析后显示角色</p>';
    return;
  }
  el.innerHTML = chars.map(c => {
    const tc = c.role_tag === '重要角色' ? 'var(--accent)' : 'var(--text-muted)';
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
    content.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">还没有角色数据，请先进行情绪分析</p>';
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
            <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">（AI 根据角色信息自动设计）</span>
           </div>`;
      const tc = c.role_tag === '重要角色' ? 'var(--accent)' : 'var(--text-muted)';
      return `<div style="padding:12px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
          <b style="font-size:14px;">${esc(c.name)}</b>
          <span style="font-size:11px;color:${tc};">${esc(c.role_tag)}</span>
          <span style="font-size:12px;color:var(--text-muted);">${esc(c.gender)} · ${esc(c.age)}</span>
          <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">出现于 ${c.chapters.length} 章</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">性格: ${esc(c.personality)}</div>
        <div style="font-size:12px;color:var(--text-muted);">音色: ${esc(c.timbre)}</div>
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


