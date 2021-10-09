package api

import (
	"github.com/andreacioni/keelink-service/cache"
	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
	"net/http"
)

func deleteEntry(c *gin.Context) {
	entry, found := getEntryFromSessionID(c)

	if !found {
		return
	}

	if err := cache.Remove(entry); err != nil {
		glg.Errorf("Cannot remove entry for: %s", entry.SessionID)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Entry not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": "OK"})

}
