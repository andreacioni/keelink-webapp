package api

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"github.com/andreacioni/keelink-service/cache"
	"github.com/google/uuid"
	"github.com/kpango/glg"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
)

func postInit(c *gin.Context) {
	sid := generateSessionID()
	publicKey := c.GetString("PUBLIC_KEY")

	if err := validateBase64(publicKey); err == nil {
		glg.Errorf("Supplied base64 string is not valid: %s", publicKey)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Invalid public key"})
		return
	}

	cache.Insert(cache.CacheEntry{IP: c.Request.RemoteAddr, SessionID: sid, PublicKey: publicKey})

	c.JSON(http.StatusOK, gin.H{"status": true, "message": sid})
}

func validateBase64(base64 string) error {
	if match, err := regexp.MatchString("/^[A-Za-z0-9-_]*={0,4}$/", base64); !match || err != nil {
		return fmt.Errorf("not a base64 string")
	}

	return nil
}

func generateSessionID() string {
	sid := uuid.New().String()

	hash := md5.Sum([]byte(sid))

	return hex.EncodeToString(hash[:])

}
