package api

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"regexp"
	"strings"

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
	"getcredforsid.php": {method: http.MethodGet, f: getCredForSessionID},
	"updatepsw.php":     {method: http.MethodPost, f: postPassword},
	"updatecred.php":    {method: http.MethodPost, f: postUsernameAndPassword},
	"removeentry.php":   {method: http.MethodPost, f: deleteEntry},
}

func Init(group *gin.RouterGroup) {
	for path, handler := range handlersMap {
		group.Handle(handler.method, path, append(handler.m, handler.f)...)
	}
}

func enforceRequestOrigin(c *gin.Context, entry cache.CacheEntry) bool {
	return entry.IP == strings.Split(c.Request.RemoteAddr, ":")[0]
}

func enforceToken(c *gin.Context, entry cache.CacheEntry) bool {
	return c.Query("token") == entry.Token
}

func getEntryFromSessionID(c *gin.Context, enforceSameOriginRequest bool) (entry cache.CacheEntry, sid string, found bool) {
	if sid == "" {
		sid = c.Query("sid")
	}

	if err := validateMD5(sid); err != nil {
		glg.Warnf("invalid MD5 string: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "invalid MD5 string"})
		return
	}

	if entry, found = cache.Get(sid); !found {
		glg.Debugf("entry not found for session ID: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "entry not found"})
		return
	}

	if enforceSameOriginRequest {
		/*
			This method doesn't work behind Heroku

			if !enforceRequestOrigin(c, entry) {
				glg.Errorf("failed enforcing same IP constraint on request for SID: %s (%s != %s)", sid, c.Request.RemoteAddr, entry.IP)
				c.JSON(http.StatusOK, gin.H{"status": false, "message": "entry not found"})
				found = false
				entry = cache.CacheEntry{}
				return
			}
		*/

		if !enforceToken(c, entry) {
			glg.Errorf("failed enforcing token constraint on request for SID: %s (%s != %s)", sid, c.Query("token"), entry.Token)
			c.JSON(http.StatusOK, gin.H{"status": false, "message": "entry not found"})
			found = false
			entry = cache.CacheEntry{}
			return
		}
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
