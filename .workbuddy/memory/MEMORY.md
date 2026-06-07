# MiMo TTS Studio - 项目记忆

## 项目概述
有声书TTS工作室，原为单文件HTML(~3158行)，现重构为前后端分离架构。

## 技术栈
- **前端**: 纯模块化 HTML+JS (ES Modules)，无需构建工具
- **后端**: Go + Gin 框架
- **存储**: 前端 File System Access API + IndexedDB；后端本地文件系统

## 目录结构
```
mimo-tts-studio/
├── frontend/                    # 纯ES模块化前端
│   ├── index.html               # 入口
│   ├── public/theme.css         # Apple风格主题
│   └── src/
│       ├── App.js               # 主应用逻辑
│       ├── components/          # UI组件
│       ├── services/            # API服务层
│       ├── store/               # 状态管理
│       └── utils/               # 工具函数
├── backend/                     # Go后端
│   ├── main.go
│   ├── go.mod
│   └── app/
│       ├── config/              # 配置
│       ├── models/              # 数据模型
│       ├── routers/             # 路由
│       ├── services/            # 业务逻辑
│       └── storage/             # 文件存储
└── shared/types.md              # 共享类型定义
```

## 功能模块
1. TTS基础合成 - 文本→语音
2. VoiceDesign音色设计 - 自然语言→定制音色
3. VoiceClone音色克隆 - 音频样本→克隆音色
4. 小说朗读 - TXT→章节拆分→LLM情绪分析→音色设计→批量合成

## 当前状态
- 目录结构与所有模块文件已创建（26个文件）
- 前端：主题系统/工具函数/状态管理/服务层/组件已拆分
- 后端：Gin路由/TTS代理/LLM代理/项目管理/音频处理框架已搭建
- 复杂功能（情绪分析、批量合成、角色管理）的完整实现在原文件中，需逐步迁移
