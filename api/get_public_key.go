package api

import (
	"fmt"
	"github.com/andreacioni/keelink-service/cache"
	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
	"net/http"
	"regexp"
)

func getPublicKey(c *gin.Context) {
	sid := c.GetString("sid")
	var entry cache.CacheEntry
	var found bool

	if err := validateMD5(sid); err != nil {
		glg.Errorf("Invalid MD5 string: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Invalid MD5 string"})
		return
	}

	if entry, found = cache.Get(sid); found == false {
		glg.Errorf("Entry not found for sid: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Entry not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": entry.PublicKey})
}

func validateMD5(sid string) error {
	if match, err := regexp.MatchString("^[A-Za-z0-9]{32}$", sid); !match || err != nil {
		return fmt.Errorf("not an MD5 string string")
	}

	return nil
}
