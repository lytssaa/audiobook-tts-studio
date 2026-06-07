# MiMo TTS Studio

有声书 TTS 生产工作台 —— 从 TXT 到有声书，一站式完成。

## 功能模块

| 模块 | 功能 | 技术要点 |
|------|------|----------|
| **小说工作区** | TXT 导入 → 章节拆分 → 角色识别 → 情感分析 → 音色设计 → 批量合成 | LLM 并发分析（3章并行），8维情感向量，智能角色归类 |
| **TTS 基础合成** | 单句/段落文本转语音 | 多预设音色、风格标签、语速/音调调节 |
| **VoiceDesign** | 自然语言描述定制音色 | LLM 辅助生成音色描述，试听预览 |
| **VoiceClone** | 上传音频样本克隆音色 | 音频特征提取，样本缓存复用 |

## 项目结构

```
mimo-tts-studio/
├── frontend/                    # 纯 ES 模块化前端
│   ├── index.html               # 入口页面
│   ├── bundle.js                # 构建产物（14 源文件合并）
│   ├── build.js                 # 构建脚本（去 import/export + 语法检查）
│   ├── public/
│   │   ├── theme-new.css        # 深色主题 + 侧边栏（CSS 变量体系）
│   │   └── novel.css            # 小说工作区三栏布局
│   └── src/
│       ├── App.js               # 主应用逻辑（~1673 行）
│       ├── components/
│       │   ├── AudioPlayer.js   # 音频播放器
│       │   └── Toast.js         # 轻提示组件
│       ├── services/
│       │   ├── ttsApi.js        # TTS API 封装
│       │   ├── llmApi.js        # LLM API 封装（情绪分析/音色设计）
│       │   └── fileService.js   # 文件读写（File System Access API）
│       ├── store/
│       │   └── store.js         # EventTarget pub/sub 状态管理
│       └── utils/
│           ├── audio.js         # PCM 音频处理（WAV 解析/拼接/静音生成）
│           ├── chapterSplit.js  # 章节拆分引擎
│           ├── emotions.js      # 情感向量计算
│           ├── encoding.js      # 文件编码检测
│           ├── helpers.js       # 通用工具函数
│           ├── jsonParser.js    # LLM JSON 响应解析
│           └── promptTemplates.js # LLM Prompt 模板
├── backend/                     # Go + Gin 后端
│   ├── main.go                  # 入口
│   ├── go.mod
│   └── app/
│       ├── config/config.go     # 配置管理
│       ├── models/schemas.go    # 数据模型
│       ├── routers/router.go    # REST API 路由
│       ├── services/
│       │   ├── tts_service.go   # TTS 代理
│       │   ├── llm_service.go   # LLM 代理
│       │   ├── audio_service.go # 音频处理
│       │   └── project_service.go # 项目管理 CRUD
│       └── storage/file_storage.go # 本地文件存储
└── shared/
    └── types.md                 # 前后端共享类型定义
```

## 架构

```
┌──────────────────────────────────────────────┐
│                  浏览器                      │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ 侧边栏   │  │ 主面板    │  │ 播放器      │ │
│  │ 导航      │  │ (Tab切换) │  │ (底部固定)  │ │
│  └─────────┘  └──────────┘  └─────────────┘ │
│  ┌──────────────────────────────────────────┐│
│  │           Store (pub/sub)                ││
│  │   连接 API 服务层 → TTS / LLM / File     ││
│  └──────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────┐│
│  │    直连模式         │    代理模式         ││
│  │  前端直连 MiMo/LLM  │  前端 → Gin 后端    ││
│  │  IndexedDB 持久化   │  后端管理 Key/数据  ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

## 安装与使用

### 方式一：直接打开（无需安装）

下载仓库后，用浏览器直接打开 `frontend/index.html` 即可使用（Chrome/Edge 120+）。

> 注意：Chrome 从本地文件打开时部分 API 受限，推荐方式二。

### 方式二：命令行启动（推荐）

```bash
# 1. 克隆或下载仓库
git clone https://github.com/lytssaa/audiobook-tts-studio.git
cd audiobook-tts-studio/frontend

# 2. 启动本地服务器（任选其一）
python -m http.server 8081
# 或
npx serve .
# 或
node -e "require('http').createServer((req,res)=>require('fs').createReadStream('.'+req.url).pipe(res)).listen(8081)"

# 3. 浏览器打开 http://localhost:8081
```

### 方式三：后端代理模式（可选）

如果需要后端统一管理 API Key 和数据：

```bash
cd backend
go mod tidy
go run main.go     # 默认监听 :8080

# 环境变量配置
PORT=8080 STORAGE_DIR=./data DEBUG=true go run main.go
```

然后在前端页面顶部点击「直连」按钮切换为「代理」模式。

### 构建（开发者）

```bash
cd frontend
node build.js    # 合并 14 个源文件 → bundle.js
```

## 技术栈

**前端**：Vanilla JS（纯 ES 模块） · CSS Variables 主题 · IndexedDB · File System Access API · Web Audio API

**后端**：Go 1.21+ · Gin · CORS

**AI 服务**：MiMo TTS（OpenAI 兼容接口） · DeepSeek / OpenAI（LLM 情绪分析与音色设计）

## 浏览器兼容性

Chrome / Edge 120+（File System Access API 要求）。Firefox / Safari 对本地文件访问支持有限，建议使用 Chromium 系浏览器。
