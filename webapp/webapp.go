package webapp

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
	"github.com/andreacioni/keelink-service/webapp/api"
)

func Serve(shutdownHook func()) error {
	glg.Info("initializing web server")

	router := gin.Default()
	group := router.Group("/")
	config := config.GetConfig()

	staticHandlers(group)
	apiHandlers(group)

	if err := listenAndServe(router, shutdownHook, fmt.Sprintf("%s:%d", config.Host, config.Port)); err != nil {
		return fmt.Errorf("unable to listen & serve: %w", err)
	}

	return nil
}

func apiHandlers(group *gin.RouterGroup) {
	api.Init(group)
}

func staticHandlers(group *gin.RouterGroup) {
	group.Static("/css", "./webapp/static/css")
	group.Static("/fonts", "./webapp/static/fonts")
	group.Static("/images", "./webapp/static/images")
	group.Static("/lib", "./webapp/static/lib")
	group.StaticFile("/", "./webapp/static/index.html")
	group.StaticFile("/privacy-policy.html", "./webapp/static/privacy-policy.html")
}

//From: https://github.com/gin-gonic/gin#graceful-restart-or-stop
func listenAndServe(router *gin.Engine, shutdownHook func(), addressPort string) error {
	server := &http.Server{
		Addr:    addressPort,
		Handler: router,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil {
			glg.Error(err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal)
	signal.Notify(quit, os.Interrupt)
	<-quit
	glg.Debug("shutdown server ...")

	shutdownHook()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		glg.Fatal("server shutdown:", err)
	}
	glg.Info("server exiting")

	return nil
}
