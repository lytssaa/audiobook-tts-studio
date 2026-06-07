package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"mimo-tts-studio/app/models"
)

var (
	storageDir string
	mu         sync.RWMutex
)

// Init 初始化存储目录
func Init(dir string) error {
	storageDir = dir
	// 创建子目录
	for _, sub := range []string{"projects", "audio", "chapters"} {
		path := filepath.Join(dir, sub)
		if err := os.MkdirAll(path, 0755); err != nil {
			return err
		}
	}
	return nil
}

// GetStorageDir 返回存储根目录
func GetStorageDir() string {
	return storageDir
}

// ======================== 项目操作 ========================

// SaveProject 保存项目
func SaveProject(project *models.Project) error {
	mu.Lock()
	defer mu.Unlock()

	dir := filepath.Join(storageDir, "projects", project.Name)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(project, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(dir, "project.json"), data, 0644)
}

// LoadProject 加载项目
func LoadProject(name string) (*models.Project, error) {
	mu.RLock()
	defer mu.RUnlock()

	path := filepath.Join(storageDir, "projects", name, "project.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var project models.Project
	if err := json.Unmarshal(data, &project); err != nil {
		return nil, err
	}
	return &project, nil
}

// DeleteProject 删除项目
func DeleteProject(name string) error {
	mu.Lock()
	defer mu.Unlock()

	dir := filepath.Join(storageDir, "projects", name)
	return os.RemoveAll(dir)
}

// ListProjects 列出所有项目
func ListProjects() ([]models.ProjectListItem, error) {
	mu.RLock()
	defer mu.RUnlock()

	entries, err := os.ReadDir(filepath.Join(storageDir, "projects"))
	if err != nil {
		if os.IsNotExist(err) {
			return []models.ProjectListItem{}, nil
		}
		return nil, err
	}

	var projects []models.ProjectListItem
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		// 读取 project.json 获取时间戳
		data, err := os.ReadFile(filepath.Join(storageDir, "projects", entry.Name(), "project.json"))
		if err != nil {
			continue
		}
		var p models.Project
		if err := json.Unmarshal(data, &p); err != nil {
			continue
		}
		projects = append(projects, models.ProjectListItem{
			Name: p.Name,
			Time: p.Time,
		})
	}
	return projects, nil
}

// ======================== 音频操作 ========================

// SaveAudio 保存音频文件
func SaveAudio(projectName, chapterTitle string, data []byte) error {
	mu.Lock()
	defer mu.Unlock()

	dir := filepath.Join(storageDir, "audio", projectName)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// 清理文件名
	filename := sanitizeFilename(chapterTitle) + ".wav"
	return os.WriteFile(filepath.Join(dir, filename), data, 0644)
}

// GetAudio 获取音频文件
func GetAudio(projectName, chapterTitle string) ([]byte, error) {
	mu.RLock()
	defer mu.RUnlock()

	filename := sanitizeFilename(chapterTitle) + ".wav"
	return os.ReadFile(filepath.Join(storageDir, "audio", projectName, filename))
}

// ======================== 章节操作 ========================

// SaveChapterResult 保存章节分析结果
func SaveChapterResult(projectName string, idx int, data []byte) error {
	mu.Lock()
	defer mu.Unlock()

	dir := filepath.Join(storageDir, "chapters", projectName)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	filename := formatChapterFilename(idx)
	return os.WriteFile(filepath.Join(dir, filename), data, 0644)
}

// LoadChapterResult 加载章节分析结果
func LoadChapterResult(projectName string, idx int) ([]byte, error) {
	mu.RLock()
	defer mu.RUnlock()

	filename := formatChapterFilename(idx)
	return os.ReadFile(filepath.Join(storageDir, "chapters", projectName, filename))
}

// ======================== 工具函数 ========================

func sanitizeFilename(name string) string {
	// 移除不安全字符
	unsafe := []string{"/", "\\", ":", "*", "?", "\"", "<", ">", "|"}
	result := name
	for _, ch := range unsafe {
		// 手动替换（Go 1.21 不支持 strings.ReplaceAll 对 []string 的批量操作）
		for i := 0; i < len(result); i++ {
			if string(result[i]) == ch {
				result = result[:i] + "_" + result[i+1:]
			}
		}
	}
	if len(result) > 100 {
		result = result[:100]
	}
	return result
}

func formatChapterFilename(idx int) string {
	return "ch_" + padLeft(idx, 3) + ".json"
}

func padLeft(n, width int) string {
	s := ""
	v := n
	for v > 0 {
		s = string(rune('0'+v%10)) + s
		v /= 10
	}
	if s == "" {
		s = "0"
	}
	for len(s) < width {
		s = "0" + s
	}
	return s
}
