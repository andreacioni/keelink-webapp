package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getCredForSid(c *gin.Context) {
	entry, found := getEntryFromSessionID(c)

	if !found {
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "username": entry.Username, "password": entry.EncryptedPassword})
}
