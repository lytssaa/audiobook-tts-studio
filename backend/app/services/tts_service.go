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

// CallTTSAPI 调用 MiMo TTS API（/chat/completions）
func CallTTSAPI(model, apiKey, apiBaseURL string, messages []map[string]string, audioOpts map[string]interface{}) ([]byte, error) {
	if apiBaseURL == "" {
		apiBaseURL = "https://api.xiaomimimo.com/v1"
	}
	apiBaseURL = strings.TrimRight(apiBaseURL, "/")

	body := map[string]interface{}{
		"model":    model,
		"messages": messages,
		"audio":    audioOpts,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("JSON编码错误: %w", err)
	}

	req, err := http.NewRequest("POST", apiBaseURL+"/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-key", apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("API错误 %d: %s", resp.StatusCode, string(respBody))
	}

	// 解析响应
	var result struct {
		Choices []struct {
			Message struct {
				Audio struct {
					Data string `json:"data"`
				} `json:"audio"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("响应解析错误: %w", err)
	}

	if len(result.Choices) == 0 || result.Choices[0].Message.Audio.Data == "" {
		return nil, fmt.Errorf("响应中无音频数据")
	}

	return []byte(result.Choices[0].Message.Audio.Data), nil
}

// SynthesizeTTS 基础 TTS 合成
func SynthesizeTTS(req *models.TTSRequest) ([]byte, error) {
	if req.Model == "" {
		req.Model = "mimo-v2.5-tts"
	}
	if req.Voice == "" {
		req.Voice = "mimo_default"
	}
	if req.Format == "" {
		req.Format = "wav"
	}

	var messages []map[string]string
	if req.Style != "" {
		messages = append(messages, map[string]string{"role": "user", "content": req.Style})
	}
	messages = append(messages, map[string]string{"role": "assistant", "content": req.Text})

	audioOpts := map[string]interface{}{
		"format": req.Format,
		"voice":  req.Voice,
	}

	return CallTTSAPI(req.Model, req.APIKey, req.APIBaseURL, messages, audioOpts)
}

// SynthesizeVoiceDesign VoiceDesign 合成
func SynthesizeVoiceDesign(req *models.VoiceDesignRequest) ([]byte, error) {
	if req.Model == "" {
		req.Model = "mimo-v2.5-tts-voicedesign"
	}
	if req.Format == "" {
		req.Format = "wav"
	}

	var messages []map[string]string
	messages = append(messages, map[string]string{"role": "user", "content": req.Description})
	if req.Text != "" {
		messages = append(messages, map[string]string{"role": "assistant", "content": req.Text})
	}

	audioOpts := map[string]interface{}{
		"format": req.Format,
	}
	if req.OptimizeText {
		audioOpts["optimize_text_preview"] = true
	}

	return CallTTSAPI(req.Model, req.APIKey, req.APIBaseURL, messages, audioOpts)
}

// SynthesizeVoiceClone VoiceClone 合成
func SynthesizeVoiceClone(req *models.VoiceCloneRequest) ([]byte, error) {
	if req.Model == "" {
		req.Model = "mimo-v2.5-tts-voiceclone"
	}
	if req.Format == "" {
		req.Format = "wav"
	}
	if req.AudioMime == "" {
		req.AudioMime = "audio/wav"
	}

	var messages []map[string]string
	if req.Style != "" {
		messages = append(messages, map[string]string{"role": "user", "content": req.Style})
	} else {
		messages = append(messages, map[string]string{"role": "user", "content": ""})
	}
	messages = append(messages, map[string]string{"role": "assistant", "content": req.Text})

	voice := fmt.Sprintf("data:%s;base64,%s", req.AudioMime, req.AudioData)
	audioOpts := map[string]interface{}{
		"format": req.Format,
		"voice":  voice,
	}

	return CallTTSAPI(req.Model, req.APIKey, req.APIBaseURL, messages, audioOpts)
}
