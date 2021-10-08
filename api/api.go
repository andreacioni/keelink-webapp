package api

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"regexp"
	"time"

	"github.com/andreacioni/keelink-service/cache"
	"github.com/google/uuid"

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
	"init.php":          {method: http.MethodPost, f: postInit},
	"getpublickey.php":  {method: http.MethodGet, f: getPublicKey},
	"getcredforsid.php": {method: http.MethodGet, f: getCredForSid},
	"updatepsw.php":     {method: http.MethodPost, f: postPassword},
	"removeentry.php":   {method: http.MethodPost, f: deleteEntry},
}

func Init(shutdownHook func()) error {
	glg.Info("Initializing REST API ...")

	var group *gin.RouterGroup
	router := gin.Default()
	group = router.Group("/")

	group.Static("/css", "./static/css")
	group.Static("/fonts", "./staticfonts")
	group.Static("/images", "./static/images")
	group.Static("/lib", "./static/lib")
	group.StaticFile("/", "./static/index.html")
	group.StaticFile("/privacy-policy.html", "./static/privacy-policy.html")

	for path, handler := range handlersMap {
		group.Handle(handler.method, path, append(handler.m, handler.f)...)
	}

	if err := listenAndServe(router, shutdownHook, fmt.Sprintf("%s:%s", ":", os.Getenv("PORT")), config.GetConfig()); err != nil {
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

func getEntryFromSessionID(c *gin.Context) (entry cache.CacheEntry, found bool) {
	c.Request.Method = "POST" //TODO - workaround: PostForm doesn'T parse a request if the method is not "POST"

	sid := c.PostForm("sid")

	if sid == "" {
		sid = c.Query("sid")
	}

	if err := validateMD5(sid); err != nil {
		glg.Errorf("Invalid MD5 string: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Invalid MD5 string"})
		return
	}

	if entry, found = cache.Get(sid); !found {
		glg.Errorf("Entry not found for session ID: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Entry not found"})
		return
	}

	return
}

func validateMD5(sid string) error {
	if match, err := regexp.MatchString("^[A-Za-z0-9]{32}$", sid); !match || err != nil {
		return fmt.Errorf("not an MD5 string string")
	}

	return nil
}

func validateBase64(base64 string) error {
	if match, err := regexp.MatchString("^[A-Za-z0-9-_]*={0,4}$", base64); !match || err != nil {
		return fmt.Errorf("not a base64 string")
	}

	return nil
}

func generateSessionID() string {
	sid := uuid.New().String()
	hash := md5.Sum([]byte(sid))

	return hex.EncodeToString(hash[:])

}
