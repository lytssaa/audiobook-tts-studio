// ===================================================
// 音频处理工具：WAV解析、PCM拼接、静音生成
// ===================================================

/**
 * 从WAV Blob中提取PCM数据
 * @returns {Promise<{pcm: Int16Array, sampleRate: number}>}
 */
export async function wavToPCM(wavBlob) {
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
export function makeSilence(ms, sampleRate = 24000) {
  const numSamples = Math.round(sampleRate * ms / 1000);
  return new Int16Array(numSamples);
}

/**
 * 拼接多个PCM数组
 */
export function concatPCM(chunks) {
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
export function pcmToWav(pcm, sampleRate = 24000) {
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
