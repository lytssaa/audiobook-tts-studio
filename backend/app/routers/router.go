package routers

import (
	"fmt"
	"net/http"

	"mimo-tts-studio/app/config"
	"mimo-tts-studio/app/models"
	"mimo-tts-studio/app/services"
	"mimo-tts-studio/app/storage"

	"github.com/gin-gonic/gin"
)

// Register 注册所有路由
func Register(r *gin.Engine, cfg *config.Config) {
	api := r.Group("/api")

	// 健康检查
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// ======================== TTS 路由 ========================
	tts := api.Group("/tts")

	// 基础合成
	tts.POST("/synthesize", func(c *gin.Context) {
		var req models.TTSRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		audioData, err := services.SynthesizeTTS(&req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusOK, "audio/wav", audioData)
	})

	// VoiceDesign 合成
	tts.POST("/voice-design", func(c *gin.Context) {
		var req models.VoiceDesignRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		audioData, err := services.SynthesizeVoiceDesign(&req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusOK, "audio/wav", audioData)
	})

	// VoiceClone 合成
	tts.POST("/voice-clone", func(c *gin.Context) {
		var req models.VoiceCloneRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		audioData, err := services.SynthesizeVoiceClone(&req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusOK, "audio/wav", audioData)
	})

	// 批量合成
	tts.POST("/batch", func(c *gin.Context) {
		var req models.BatchGenerateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// 批量合成（简化版，应实现并发+音频拼接）
		results := make([]gin.H, 0)
		for _, ch := range req.Chapters {
			if ch.Content == "" {
				continue
			}
			ttsReq := &models.TTSRequest{
				Text:      ch.Content,
				Voice:     req.Voice,
				Format:    "wav",
				Model:     req.Model,
				APIKey:    req.APIKey,
				APIBaseURL: req.APIBaseURL,
			}
			audioData, err := services.SynthesizeTTS(ttsReq)
			if err != nil {
				results = append(results, gin.H{"title": ch.Title, "error": err.Error()})
			} else {
				// 保存音频
				_ = storage.SaveAudio("batch", ch.Title, audioData)
				results = append(results, gin.H{"title": ch.Title, "size": len(audioData)})
			}
		}
		c.JSON(http.StatusOK, gin.H{"results": results})
	})

	// ======================== LLM 路由 ========================
	llm := api.Group("/llm")

	// 测试连接
	llm.POST("/test", func(c *gin.Context) {
		var req models.LLMTestRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		result, err := services.TestLLMConnection(&req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"result": result})
	})

	// 分析章节
	llm.POST("/analyze", func(c *gin.Context) {
		var req models.LLMAnalyzeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		result, err := services.AnalyzeChapter(&req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"result": result})
	})

	// 角色音色设计
	llm.POST("/voice-design", func(c *gin.Context) {
		var req models.LLMVoiceDesignRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		prompts, err := services.GenerateVoiceDesigns(&req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"prompts": prompts})
	})

	// ======================== 项目管理路由 ========================
	projects := api.Group("/projects")

	// 列表
	projects.GET("", func(c *gin.Context) {
		list, err := services.GetAllProjects()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"projects": list})
	})

	// 创建
	projects.POST("", func(c *gin.Context) {
		var req struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		project, err := services.CreateProject(req.Name)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, project)
	})

	// 获取
	projects.GET("/:name", func(c *gin.Context) {
		name := c.Param("name")
		project, err := services.GetProject(name)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "项目不存在"})
			return
		}
		c.JSON(http.StatusOK, project)
	})

	// 更新
	projects.PUT("/:name", func(c *gin.Context) {
		name := c.Param("name")
		var project models.Project
		if err := c.ShouldBindJSON(&project); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		project.Name = name
		if err := services.UpdateProject(&project); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 删除
	projects.DELETE("/:name", func(c *gin.Context) {
		name := c.Param("name")
		if err := services.RemoveProject(name); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 获取章节音频
	projects.GET("/:name/audio/:chapter", func(c *gin.Context) {
		name := c.Param("name")
		chapter := c.Param("chapter")
		audioData, err := storage.GetAudio(name, chapter)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "音频不存在"})
			return
		}
		c.Data(http.StatusOK, "audio/wav", audioData)
	})

	// 保存章节分析结果
	projects.POST("/:name/chapters/:idx", func(c *gin.Context) {
		name := c.Param("name")
		idx := 0
		if _, err := fmt.Sscanf(c.Param("idx"), "%d", &idx); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的章节索引"})
			return
		}
		body, err := c.GetRawData()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := storage.SaveChapterResult(name, idx, body); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
}
