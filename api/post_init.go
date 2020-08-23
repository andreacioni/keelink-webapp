package api

import (
	"github.com/andreacioni/keelink-service/cache"
	"github.com/kpango/glg"
	"net/http"

	"github.com/gin-gonic/gin"
)

func postInit(c *gin.Context) {
	sid := generateSessionID()
	publicKey := c.PostForm("PUBLIC_KEY")

	if err := validateBase64(publicKey); err != nil {
		glg.Errorf("Supplied base64 string is not valid: %s", publicKey)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Invalid public key"})
		return
	}

	cache.Insert(cache.CacheEntry{IP: c.Request.RemoteAddr, SessionID: sid, PublicKey: publicKey})

	c.JSON(http.StatusOK, gin.H{"status": true, "message": sid})
}
