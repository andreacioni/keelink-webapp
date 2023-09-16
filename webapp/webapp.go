package webapp

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"

	"github.com/andreacioni/keelink-service/config"
	"github.com/andreacioni/keelink-service/webapp/api"
)

func Serve() (err error) {
	glg.Info("initializing web server")

	router := gin.Default()
	group := router.Group("/")
	config := config.GetConfig()

	staticHandlers(group)
	apiHandlers(group)

	if strings.TrimSpace(config.SSLCert) != "" && strings.TrimSpace(config.SSLKey) == "" {
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
	group.Static("/css", "./webapp/static/css")
	group.Static("/fonts", "./webapp/static/fonts")
	group.Static("/images", "./webapp/static/images")
	group.Static("/lib", "./webapp/static/lib")
	group.StaticFile("/", "./webapp/static/index.html")
	group.StaticFile("/privacy-policy.html", "./webapp/static/privacy-policy.html")
}
