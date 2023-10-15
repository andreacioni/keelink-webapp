package server

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"

	"github.com/andreacioni/keelink-service/config"
	"github.com/andreacioni/keelink-service/server/api"
)

func Serve() (err error) {
	glg.Info("initializing web server")

	router := gin.Default()
	group := router.Group("/")
	config := config.GetConfig()

	staticHandlers(group)
	apiHandlers(group)

	if strings.TrimSpace(config.SSLCert) != "" && strings.TrimSpace(config.SSLKey) != "" {
		glg.Debugf("tls encryption enabled, using '%s' cert and '%s'", config.SSLCert, config.SSLKey)
		err = router.RunTLS(fmt.Sprintf("%s:%d", config.Host, config.Port), config.SSLCert, config.SSLKey)
	} else {
		glg.Debug("plain http connection server")
		err = router.Run(fmt.Sprintf("%s:%d", config.Host, config.Port))
	}

	/*if err := listenAndServe(router, shutdownHook, fmt.Sprintf("%s:%d", config.Host, config.Port)); err != nil {
		return fmt.Errorf("unable to listen & serve: %w", err)
	}*/

	return err
}

func apiHandlers(group *gin.RouterGroup) {
	api.Init(group)
}

func staticHandlers(group *gin.RouterGroup) {
	group.Static("/_next", "./static/_next")
	group.Static("/libs", "./static/libs")
	group.StaticFile("/404.html", "./static/404.html")
	group.StaticFile("/", "./static/index.html")
	group.StaticFile("/favicon.ico", "./static/favicon.ico")
	group.StaticFile("/index.txt", "./static/index.txt")
}
