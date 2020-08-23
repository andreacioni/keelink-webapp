package api

import (
	"github.com/andreacioni/keelink-service/cache"
	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
	"net/http"
)

func postPassword(c *gin.Context) {
	entry, found := getEntryFromSessionID(c)

	if !found {
		return
	}

	if entry.EncryptedPassword != "" {
		glg.Errorf("There is already a password set for current session ID: %s", entry.SessionID)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Password already set"})
		return
	}

	entry.EncryptedPassword = c.PostForm("key")

	if err := cache.Update(entry); err != nil {
		glg.Errorf("Cannot update: %v", err)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Cannot update"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": "OK"})
}
