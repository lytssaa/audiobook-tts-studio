# MiMo TTS Studio

有声书 TTS 生产工具。支持基础合成、音色设计、音色克隆、小说批量朗读。

## 项目结构

```
mimo-tts-studio/
├── frontend/              # 纯 ES 模块化前端（无需构建）
│   ├── index.html          # 入口页面
│   ├── public/theme.css    # Apple 风格主题
│   └── src/
│       ├── App.js          # 主应用
│       ├── components/     # UI 组件
│       ├── services/       # API 服务层
│       ├── store/          # 状态管理
│       └── utils/          # 工具函数
├── backend/               # Go + Gin 后端
│   ├── main.go
│   └── app/
│       ├── config/         # 配置
│       ├── models/         # 数据模型
│       ├── routers/        # 路由
│       ├── services/       # 业务逻辑
│       └── storage/        # 文件存储
└── shared/types.md         # 类型定义
```

## 启动方式

### 前端（直连模式，无需后端）
直接用浏览器打开 `frontend/index.html`，或通过本地服务器：
```bash
cd frontend
npx serve .        # 或 python -m http.server 8000
```

### 后端（可选，代理模式）
```bash
# 1. 安装 Go（https://go.dev/dl/）
# 2. 下载依赖并启动
cd backend
go mod tidy
go run main.go     # 默认 :8080

# 环境变量（可选）
PORT=8080 DEBUG=true STORAGE_DIR=./data go run main.go
```

### 切换直连/代理
点击页面顶部「直连」按钮切换。代理模式时 API Key 由后端管理，前端不暴露。

## 功能

| 标签页 | 功能 | 说明 |
|--------|------|------|
| TTS 基础合成 | 文本→语音 | 多语音角色、风格标签、音频格式 |
| VoiceDesign | 音色设计 | 自然语言描述定制音色，AI 辅助 |
| VoiceClone | 音色克隆 | 上传音频样本，克隆音色 |
| 小说朗读 | 整本小说→有声书 | TXT导入→章节拆分→LLM情绪分析→音色设计→批量合成 |

## 技术依赖

### 前端
- **浏览器 API**：File System Access API（Chrome/Edge）、IndexedDB、localStorage
- **外部 CDN**：JSZip（导出打包）

### 后端
- **Go 1.21+** + Gin + CORS
- **API**：MiMo TTS（OpenAI 兼容接口）、DeepSeek/OpenAI（LLM）

## 数据存储

- **直连模式**：数据存于用户选择的本地文件夹（`showDirectoryPicker`），句柄存 IndexedDB
- **代理模式**：数据存于后端 `data/` 目录
