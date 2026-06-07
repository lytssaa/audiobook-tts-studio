// ===================================================
// LLM返回JSON的清理与解析
// ===================================================

/**
 * 清理JSON响应（去除markdown代码块等）
 */
export function cleanJsonResponse(raw) {
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
export function stripTrailingCommas(json) {
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
export function tryParseJson(raw) {
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
