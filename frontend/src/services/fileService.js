// ===================================================
// 文件系统服务（File System Access API + IndexedDB）
// ===================================================

import { projectStore } from '../store/store.js';

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

export async function saveHandle(name, handle) {
  await dbOp('handles', 'readwrite', (store) => {
    store.put({ name, handle, time: Date.now() });
  });
}

export async function getHandle(name) {
  let result = null;
  await dbOp('handles', 'readonly', (store, resolve) => {
    const req = store.get(name);
    req.onsuccess = () => { result = req.result?.handle || null; resolve(); };
    req.onerror = () => resolve();
  });
  return result;
}

export async function deleteHandle(name) {
  await dbOp('handles', 'readwrite', (store) => {
    store.delete(name);
  });
}

// ---------- 文件夹选择 ----------

export async function pickFolder() {
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

export async function verifyPermission(dirHandle) {
  if (!dirHandle) return false;
  let perm = await dirHandle.queryPermission({ mode: 'readwrite' });
  if (perm === 'granted') return true;
  perm = await dirHandle.requestPermission({ mode: 'readwrite' });
  return perm === 'granted';
}

// ---------- 文件读写 ----------

export async function ensureDir(dirHandle, name) {
  try { await dirHandle.getDirectoryHandle(name, { create: true }); } catch {}
}

export async function writeFile(dirHandle, filename, data) {
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

export async function readFile(dirHandle, filename) {
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
export async function writeFileInDir(dirHandle, subDir, filename, data) {
  const sd = await dirHandle.getDirectoryHandle(subDir, { create: true });
  return writeFile(sd, filename, data);
}

/**
 * 从目录内子目录读取文件
 */
export async function readFileFromDir(dirHandle, subDir, filename) {
  try {
    const sd = await dirHandle.getDirectoryHandle(subDir);
    return await readFile(sd, filename);
  } catch {
    return null;
  }
}

// ---------- 项目数据持久化 ----------

export async function saveProjectToDir() {
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

export async function saveChapterResult(idx, data) {
  const { projectDirHandle } = projectStore.getState();
  if (!projectDirHandle) return;
  const fn = 'ch_' + String(idx).padStart(3, '0') + '.json';
  await writeFileInDir(projectDirHandle, 'chapters', fn, JSON.stringify(data));
}

export async function saveAudioToDir(blob, filename) {
  const { projectDirHandle } = projectStore.getState();
  if (!projectDirHandle) return false;
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '_');
  const fn = safeName.endsWith('.wav') ? safeName : safeName + '.wav';
  return writeFileInDir(projectDirHandle, 'audio', fn, blob);
}

/**
 * 从目录加载项目
 */
export async function loadProjectFromDir(dirHandle) {
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
