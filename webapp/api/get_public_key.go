package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getPublicKey(c *gin.Context) {
	entry, found := getEntryFromSessionID(c, false)

	if !found {
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": entry.PublicKey})
}
