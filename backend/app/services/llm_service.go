package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mimo-tts-studio/app/models"
	"net/http"
	"strings"
)

// CallLLMAPI 调用 LLM API (OpenAI 兼容接口)
func CallLLMAPI(model, apiKey, apiBaseURL string, messages []map[string]string, temperature float64) (string, error) {
	if apiBaseURL == "" {
		apiBaseURL = "https://api.deepseek.com"
	}
	apiBaseURL = strings.TrimRight(apiBaseURL, "/")
	if model == "" {
		model = "deepseek-v4-flash"
	}

	body := map[string]interface{}{
		"model":       model,
		"messages":    messages,
		"temperature": temperature,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", apiBaseURL+"/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("LLM请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("LLM错误 %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("LLM响应解析错误: %w", err)
	}

	if result.Error != nil {
		return "", fmt.Errorf("LLM错误: %s", result.Error.Message)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("LLM返回空内容")
	}

	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}

// TestLLMConnection 测试 LLM 连接
func TestLLMConnection(req *models.LLMTestRequest) (string, error) {
	messages := []map[string]string{
		{"role": "user", "content": "回复\"连接成功\"两个字"},
	}
	return CallLLMAPI(req.Model, req.APIKey, req.APIBaseURL, messages, 0.1)
}

// AnalyzeChapter 分析章节（简化版，实际应调用 CallLLMAPI + SCRIPT_ANALYSIS_PROMPT）
func AnalyzeChapter(req *models.LLMAnalyzeRequest) (string, error) {
	prompt := buildAnalysisPrompt(req.Title, req.Content)
	messages := []map[string]string{
		{"role": "user", "content": prompt},
	}
	return CallLLMAPI(req.Model, req.APIKey, req.APIBaseURL, messages, 0.3)
}

// GenerateVoiceDesigns 批量生成角色音色设计
func GenerateVoiceDesigns(req *models.LLMVoiceDesignRequest) (map[string]string, error) {
	prompt := buildVoiceDesignPrompt(req.Characters)
	messages := []map[string]string{
		{"role": "user", "content": prompt},
	}
	raw, err := CallLLMAPI(req.Model, req.APIKey, req.APIBaseURL, messages, 0.4)
	if err != nil {
		return nil, err
	}

	// 简单解析 JSON
	var result map[string]string
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return nil, fmt.Errorf("LLM返回格式无效: %w", err)
	}
	return result, nil
}

// ======================== Prompt 构建 ========================

func buildAnalysisPrompt(title, content string) string {
	return fmt.Sprintf(`你是一个专业有声书脚本分析师。请仔细阅读提供的小说章节文本，将其转换为包含深度角色分析和精密有声书脚本的 JSON 格式。

## 输出结构
输出必须是纯净的 JSON，严禁包含 markdown 标记。
根对象包含两个顶级字段：character_map 和 script。

## 小说章节内容如下：
章节标题：%s

%s`, title, content)
}

func buildVoiceDesignPrompt(chars []models.CharacterInfo) string {
	var descs string
	for _, c := range chars {
		descs += fmt.Sprintf("- %s: %s, %s, %s, 性格:%s, 音色:%s\n",
			c.Name, c.Gender, c.Age, c.RoleTag, c.Personality, c.Timbre)
	}

	return fmt.Sprintf(`你是有声书音色设计师。根据以下角色信息，为每个角色生成 MiMo TTS VoiceDesign 音色描述。
返回纯 JSON，格式：{"角色名": "voice design prompt", ...}

角色列表：
%s`, descs)
}
