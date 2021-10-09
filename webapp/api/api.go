package api

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"regexp"

	"github.com/andreacioni/keelink-service/cache"
	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
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
	"updatecred.php":    {method: http.MethodPost, f: postUsernameAndPassword},
	"removeentry.php":   {method: http.MethodPost, f: deleteEntry},
}

func Init(group *gin.RouterGroup) {

	for path, handler := range handlersMap {
		group.Handle(handler.method, path, append(handler.m, handler.f)...)
	}
}

func getEntryFromSessionID(c *gin.Context) (entry cache.CacheEntry, found bool) {
	c.Request.Method = "POST" //TODO - workaround: PostForm doesn'T parse a request if the method is not "POST"

	sid := c.PostForm("sid")

	if sid == "" {
		sid = c.Query("sid")
	}

	if err := validateMD5(sid); err != nil {
		glg.Errorf("invalid MD5 string: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "invalid MD5 string"})
		return
	}

	if entry, found = cache.Get(sid); !found {
		glg.Errorf("entry not found for session ID: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "entry not found"})
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