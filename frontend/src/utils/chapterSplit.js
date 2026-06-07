// ===================================================
// 小说章节拆分
// ===================================================

/**
 * 将小说文本智能拆分为章节
 * @param {string} text 完整文本
 * @param {string} filename 文件名（用于生成项目名）
 * @returns {Array<{title: string, content: string, checked: boolean, mood: null}>}
 */
export function splitChapters(text, filename) {
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
