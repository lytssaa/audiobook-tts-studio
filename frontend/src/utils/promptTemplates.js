// ===================================================
// LLM Prompt模板
// ===================================================

/** 小说章节脚本分析Prompt */
export const SCRIPT_ANALYSIS_PROMPT = `你是一个专业有声书脚本分析师。请仔细阅读提供的小说章节文本，将其转换为包含深度角色分析和精密有声书脚本的 JSON 格式。

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
export function voiceDesignPrompt(charDescs) {
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
export function voiceDescGenPrompt(brief) {
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
export function voiceTextGenPrompt(desc) {
  return `You are a TTS text generator. Given a voice design description, generate a short Chinese text (1-3 sentences, 30-80 characters) that perfectly matches this voice style. The text should showcase the voice's characteristics.

Voice description: ${desc}

Return ONLY the generated text, no quotes, no explanations.`;
}
