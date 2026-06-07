// MiMo TTS Studio — Bundle Builder
// 用法: node build.js
// 将 src/ 下所有模块编译为 bundle.js

const fs = require('fs');
const path = require('path');

const order = [
  'src/utils/helpers.js',
  'src/utils/emotions.js',
  'src/utils/encoding.js',
  'src/utils/audio.js',
  'src/utils/chapterSplit.js',
  'src/utils/jsonParser.js',
  'src/utils/promptTemplates.js',
  'src/store/store.js',
  'src/services/fileService.js',
  'src/services/llmApi.js',
  'src/services/ttsApi.js',
  'src/components/Toast.js',
  'src/components/AudioPlayer.js',
  'src/App.js',
];

let output = '';
let totalBytes = 0;

for (const f of order) {
  let content = fs.readFileSync(path.join(__dirname, f), 'utf8');
  // 去除 import 语句 (单行和多行)
  content = content.replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"]\s*[,;]\s*$/gm, '');
  content = content.replace(/^import\s+[^{}\n]+from\s*['"][^'"]+['"]\s*[,;]?\s*$/gm, '');
  content = content.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"]\s*[,;]?\s*$/gm, '');
  // 去除 export 关键字
  content = content.replace(/^export\s+(const|let|var|function|async\s+function|class)\s+/gm, '$1 ');
  output += `// === ${f} ===\n${content}\n\n`;
  totalBytes += Buffer.byteLength(content, 'utf8');
}

fs.writeFileSync(path.join(__dirname, 'bundle.js'), output);
console.log(`✅ Bundle 构建完成: ${output.length} bytes (${order.length} 文件)`);

// 语法检查（可选）
try {
  require('child_process').execSync(`"${process.execPath}" --check bundle.js`, {
    cwd: __dirname,
    stdio: 'pipe'
  });
  console.log('✅ 语法检查通过');
} catch (e) {
  console.error('❌ 语法错误:\n', e.stderr?.toString() || e.message);
  process.exit(1);
}
