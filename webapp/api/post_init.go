package api

import (
	"net/http"

	"github.com/andreacioni/keelink-service/cache"
	"github.com/google/uuid"
	"github.com/kpango/glg"

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

	var token string
	if uuidV4, err := uuid.NewRandom(); err != nil {
		glg.Errorf("Supplied base64 string is not valid: %s", publicKey)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Cannot generate token"})
		return
	} else {
		token = uuidV4.String()
	}

	cache.Insert(cache.CacheEntry{IP: c.Request.RemoteAddr, SessionID: sid, PublicKey: publicKey, Token: token})

	c.JSON(http.StatusOK, gin.H{"status": true, "message": sid + "###" + token})
}
