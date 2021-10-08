package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
)

func getCredForSid(c *gin.Context) {
	entry, found := getEntryFromSessionID(c)

	if !found {
		return
	}

	if entry.EncryptedPassword == nil || entry.Username == nil {
		glg.Errorf("Credentials not yet received for session ID: %s", entry.SessionID)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Credentials not yet received"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "username": entry.Username, "password": entry.EncryptedPassword})
}
