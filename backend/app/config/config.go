package config

import "os"

// Config 应用配置
type Config struct {
	Port       string
	Debug      bool
	StorageDir string

	// MiMo TTS API 配置（默认值，可由客户端请求覆盖）
	DefaultTTSBaseURL string
	DefaultLLMBaseURL string
}

// Load 加载配置（优先级：环境变量 > 默认值）
func Load() *Config {
	return &Config{
		Port:              getEnv("PORT", "8080"),
		Debug:             getEnv("DEBUG", "true") == "true",
		StorageDir:        getEnv("STORAGE_DIR", "./data"),
		DefaultTTSBaseURL: getEnv("TTS_BASE_URL", "https://api.xiaomimimo.com/v1"),
		DefaultLLMBaseURL: getEnv("LLM_BASE_URL", "https://api.deepseek.com"),
	}
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
