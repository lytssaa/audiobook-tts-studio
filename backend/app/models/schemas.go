package models

// ======================== 请求模型 ========================

// TTSRequest 基础 TTS 请求
type TTSRequest struct {
	Text      string `json:"text" binding:"required"`
	Voice     string `json:"voice"`
	Format    string `json:"format"`
	Style     string `json:"style"`
	Model     string `json:"model"`
	APIKey    string `json:"api_key"`
	APIBaseURL string `json:"api_base_url"`
}

// VoiceDesignRequest 音色设计请求
type VoiceDesignRequest struct {
	Description   string `json:"description" binding:"required"`
	Text          string `json:"text"`
	Format        string `json:"format"`
	OptimizeText  bool   `json:"optimize_text"`
	Model         string `json:"model"`
	APIKey        string `json:"api_key"`
	APIBaseURL    string `json:"api_base_url"`
}

// VoiceCloneRequest 音色克隆请求
type VoiceCloneRequest struct {
	Text      string `json:"text" binding:"required"`
	AudioData string `json:"audio_data" binding:"required"` // base64 编码的音频
	AudioMime string `json:"audio_mime"`
	Format    string `json:"format"`
	Style     string `json:"style"`
	Model     string `json:"model"`
	APIKey    string `json:"api_key"`
	APIBaseURL string `json:"api_base_url"`
}

// LLMAnalyzeRequest 章节分析请求
type LLMAnalyzeRequest struct {
	Title      string `json:"title" binding:"required"`
	Content    string `json:"content" binding:"required"`
	Model      string `json:"model"`
	APIKey     string `json:"api_key"`
	APIBaseURL string `json:"api_base_url"`
}

// LLMVoiceDesignRequest 角色音色设计请求
type LLMVoiceDesignRequest struct {
	Characters []CharacterInfo `json:"characters" binding:"required"`
	Model      string          `json:"model"`
	APIKey     string          `json:"api_key"`
	APIBaseURL string          `json:"api_base_url"`
}

// CharacterInfo 角色信息
type CharacterInfo struct {
	Name        string `json:"name"`
	Gender      string `json:"gender"`
	Age         string `json:"age"`
	RoleTag     string `json:"role_tag"`
	Personality string `json:"personality"`
	Timbre      string `json:"timbre"`
}

// LLMTestRequest LLM 连接测试
type LLMTestRequest struct {
	Model      string `json:"model"`
	APIKey     string `json:"api_key"`
	APIBaseURL string `json:"api_base_url"`
}

// BatchGenerateRequest 批量合成请求
type BatchGenerateRequest struct {
	Chapters []ChapterAudioRequest `json:"chapters" binding:"required"`
	Voice    string                `json:"voice"`
	Model    string                `json:"model"`
	APIKey   string                `json:"api_key"`
	APIBaseURL string              `json:"api_base_url"`
}

// ChapterAudioRequest 单章合成请求
type ChapterAudioRequest struct {
	Title   string        `json:"title"`
	Script  []ScriptItem  `json:"script"`
	Content string        `json:"content"`
}

// ScriptItem 脚本项
type ScriptItem struct {
	Speaker       string    `json:"speaker"`
	SpeakerEmo    string    `json:"speaker_emo"`
	Content       string    `json:"content"`
	EmoVector     []float64 `json:"emo_vector"`
	Delay         int       `json:"delay"`
	VoiceAssignment *VoiceAssignment `json:"_voice_assignment,omitempty"`
}

// VoiceAssignment 音色分配
type VoiceAssignment struct {
	Type   string `json:"type"`   // "preset" | "voicedesign"
	Voice  string `json:"voice"`
	Prompt string `json:"prompt"`
}

// ======================== 项目相关 ========================

// Project 项目
type Project struct {
	Name            string                `json:"name"`
	Time            int64                 `json:"time"`
	Chapters        []Chapter             `json:"chapters"`
	GlobalCharacters map[string]Character `json:"global_characters"`
}

// Chapter 章节
type Chapter struct {
	Title        string                `json:"title"`
	Content      string                `json:"content"`
	Checked      bool                  `json:"checked"`
	Mood         string                `json:"mood,omitempty"`
	CharacterMap map[string]CharacterInfo `json:"character_map,omitempty"`
	Script       []ScriptItem           `json:"script,omitempty"`
	HasAnalysis  bool                  `json:"has_analysis"`
}

// Character 角色
type Character struct {
	Name             string   `json:"name"`
	Gender           string   `json:"gender"`
	Age              string   `json:"age"`
	RoleTag          string   `json:"role_tag"`
	Personality      string   `json:"personality"`
	Timbre           string   `json:"timbre"`
	VoiceDesignPrompt string  `json:"voice_design_prompt,omitempty"`
	TTStyle          string   `json:"tts_style,omitempty"`
	Chapters         []int    `json:"chapters"`
}

// ProjectListItem 项目列表项
type ProjectListItem struct {
	Name string `json:"name"`
	Time int64  `json:"time"`
}
