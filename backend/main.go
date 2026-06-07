package main

import (
	"log"
	"mimo-tts-studio/app/config"
	"mimo-tts-studio/app/routers"
	"mimo-tts-studio/app/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化存储
	if err := storage.Init(cfg.StorageDir); err != nil {
		log.Fatalf("存储初始化失败: %v", err)
	}

	// 设置 Gin 模式
	if cfg.Debug {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	r := gin.Default()

	// CORS 中间件
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "api-key"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
	}))

	// 注册路由
	routers.Register(r, cfg)

	// 启动服务
	addr := ":" + cfg.Port
	log.Printf("MiMo TTS Studio 后端启动于 %s", addr)
	log.Printf("存储目录: %s", cfg.StorageDir)
	if err := r.Run(addr); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
