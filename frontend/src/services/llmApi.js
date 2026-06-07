// ===================================================
// LLM API 服务层
// ===================================================

import { appStore } from '../store/store.js';
import { tryParseJson } from '../utils/jsonParser.js';
import { voiceDesignPrompt, voiceDescGenPrompt, voiceTextGenPrompt, SCRIPT_ANALYSIS_PROMPT } from '../utils/promptTemplates.js';

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
export async function testLLMConnection() {
  const result = await callLLM(
    [{ role: 'user', content: '回复"连接成功"两个字' }],
    0.1
  );
  return result;
}

/**
 * 分块分析小说章节
 */
export async function analyzeChapter(chapterTitle, content, onChunkProgress, signal) {
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
export async function generateVoiceDesignPrompts(characters, onProgress) {
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
export async function generateVDDescription(brief) {
  const raw = await callLLM(
    [{ role: 'user', content: voiceDescGenPrompt(brief) }],
    0.4
  );
  return raw.replace(/^["']|["']$/g, '').trim();
}

/**
 * 生成VoiceDesign参考文本
 */
export async function generateVDText(desc) {
  const raw = await callLLM(
    [{ role: 'user', content: voiceTextGenPrompt(desc) }],
    0.7
  );
  return raw.replace(/^["'「」『』]|["'「」『』]$/g, '').trim();
}
