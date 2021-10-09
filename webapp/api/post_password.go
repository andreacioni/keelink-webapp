package api

import (
	"net/http"

	"github.com/andreacioni/keelink-service/cache"
	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
)

func postUsernameAndPassword(c *gin.Context) {
	entry, found := getEntryFromSessionID(c)

	if !found {
		return
	}

	psw := c.PostForm("password")
	username := c.PostForm("username")

	if psw == "" {
		glg.Errorf("Invalid password supplied: %s", entry.SessionID)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Invalid password supplied"})
		return
	}

	if entry.EncryptedPassword != nil {
		glg.Errorf("There is already a password set for current session ID: %s", entry.SessionID)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Password already set"})
		return
	}

	entry.EncryptedPassword = &psw
	entry.Username = &username

	if err := cache.Update(entry); err != nil {
		glg.Errorf("Cannot update: %v", err)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Cannot update"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": "OK"})
}

func postPassword(c *gin.Context) {
	entry, found := getEntryFromSessionID(c)

	if !found {
		return
	}

	psw := c.PostForm("key")

	if psw == "" {
		glg.Errorf("Invalid password supplied: %s", entry.SessionID)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Invalid password supplied"})
		return
	}

	if entry.EncryptedPassword != nil {
		glg.Errorf("There is already a password set for current session ID: %s", entry.SessionID)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Password already set"})
		return
	}

	entry.EncryptedPassword = &psw

	if err := cache.Update(entry); err != nil {
		glg.Errorf("Cannot update: %v", err)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Cannot update"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": "OK"})
}
