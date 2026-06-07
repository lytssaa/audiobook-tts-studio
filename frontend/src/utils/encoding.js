// ===================================================
// 文本编码检测（UTF-8 / GB18030 / UTF-16）
// ===================================================

/**
 * 检测文本字节数组的编码
 * @param {Uint8Array} bytes
 * @returns {string} 编码名称
 */
export function detectEncoding(bytes) {
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
export function decodeText(bytes) {
  const encoding = detectEncoding(bytes);
  return {
    text: new TextDecoder(encoding).decode(bytes),
    encoding
  };
}
