package services

import (
	"mimo-tts-studio/app/models"
	"mimo-tts-studio/app/storage"
	"time"
)

// CreateProject 创建项目
func CreateProject(name string) (*models.Project, error) {
	project := &models.Project{
		Name:             name,
		Time:             nowMs(),
		Chapters:         []models.Chapter{},
		GlobalCharacters: make(map[string]models.Character),
	}
	if err := storage.SaveProject(project); err != nil {
		return nil, err
	}
	return project, nil
}

// GetProject 获取项目
func GetProject(name string) (*models.Project, error) {
	return storage.LoadProject(name)
}

// UpdateProject 更新项目
func UpdateProject(project *models.Project) error {
	project.Time = nowMs()
	return storage.SaveProject(project)
}

// RemoveProject 删除项目
func RemoveProject(name string) error {
	return storage.DeleteProject(name)
}

// GetAllProjects 获取所有项目
func GetAllProjects() ([]models.ProjectListItem, error) {
	return storage.ListProjects()
}

func nowMs() int64 {
	return time.Now().UnixMilli()
}
