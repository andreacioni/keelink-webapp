package api

import (
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
)

type sseCredForSessionIDResponse struct {
	Status            bool
	Message           string
	Username          string
	EncryptedPassword string
}

func getCredForSessionID(c *gin.Context) {

	clientChan := make(chan sseCredForSessionIDResponse)
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")
	c.Writer.Flush()

	go func() {
		timeout := time.Now().Add(time.Minute)

		for {
			entry, found := getEntryFromSessionID(c, true)

			if time.Now().Compare(timeout) > 0 {
				glg.Errorf("Timeout waiting for SID: %s", entry.SessionID)
				clientChan <- sseCredForSessionIDResponse{Status: false, Message: "Timeout reached"}
				return
			}

			if !found {
				clientChan <- sseCredForSessionIDResponse{Status: false, Message: "Credentials not yet received"}
				time.Sleep(time.Second)
				continue
			}

			if entry.EncryptedPassword == nil && entry.Username == nil {
				glg.Errorf("Credentials not yet received for session ID: %s", entry.SessionID)

				clientChan <- sseCredForSessionIDResponse{Status: false, Message: "Credentials not yet received, empty"}
				//c.JSON(http.StatusOK, gin.H{"status": false, "message": "Credentials not yet received"})
				time.Sleep(time.Second)
				continue
			}

			clientChan <- sseCredForSessionIDResponse{Status: true, Username: *entry.Username, EncryptedPassword: *entry.EncryptedPassword}
			//c.JSON(http.StatusOK, gin.H{"status": true, "username": entry.Username, "password": entry.EncryptedPassword})

		}

	}()

	c.Stream(func(w io.Writer) bool {
		// Stream message to client from message channel
		if response, ok := <-clientChan; ok {
			c.SSEvent("message", gin.H{"status": response.Status, "username": response.Username, "password": response.EncryptedPassword, "message": response.Message})
			close(clientChan)
			return true
		}
		return false
	})

}

func getPasswordForSessionID(c *gin.Context) {
	entry, found := getEntryFromSessionID(c, true)

	if !found {
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": entry.EncryptedPassword})

}
