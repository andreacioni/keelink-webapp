package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"

	"github.com/andreacioni/keelink-service/config"
)

// MethodHandler utility struct that contains method and associated handler
type MethodHandler struct {
	method string
	f      func(*gin.Context)
	m      []gin.HandlerFunc
}

var handlersMap = map[string]MethodHandler{
	"init.php":         {method: http.MethodPost, f: postInit},
	"getpublickey.php": {method: http.MethodGet, f: getPublicKey},
}

func Init(shutdownHook func()) error {
	glg.Info("Initializing REST API ...")

	conf := config.GetConfig()

	if conf.Host == "" || conf.Port <= 0 {
		return fmt.Errorf("Address and/or port not defined in configuration")
	}

	var group *gin.RouterGroup
	router := gin.Default()
	group = router.Group("/")

	for path, handler := range handlersMap {
		group.Handle(handler.method, path, append(handler.m, handler.f)...)
	}

	if err := listenAndServe(router, shutdownHook, fmt.Sprintf("%s:%d", conf.Host, conf.Port), conf); err != nil {
		return fmt.Errorf("unable to listen & serve: %v", err)
	}

	return nil
}

//From: https://github.com/gin-gonic/gin#graceful-restart-or-stop
func listenAndServe(router *gin.Engine, shutdownHook func(), addressPort string, config config.Configuration) error {
	server := &http.Server{
		Addr:    addressPort,
		Handler: router,
	}

	go func() {
		if config.CertFile != "" && config.KeyFile != "" {
			glg.Info("SSL/TLS enabled for API")
			if err := server.ListenAndServeTLS(config.CertFile, config.KeyFile); err != nil {
				glg.Error(err)
			}
		} else {
			glg.Warn("SSL/TLS NOT enabled for API")
			if err := server.ListenAndServe(); err != nil {
				glg.Error(err)
			}
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal)
	signal.Notify(quit, os.Interrupt)
	<-quit
	glg.Debug("Shutdown server ...")

	shutdownHook()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		glg.Fatal("Server Shutdown:", err)
	}
	glg.Info("Server exiting")

	return nil
}
