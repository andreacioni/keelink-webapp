package api

import (
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kpango/glg"
)

type sseCredForSessionIDResponse struct {
	Status            bool
	Message           string
	Username          string
	EncryptedPassword string

	TimeoutReached bool
}

func getCredForSessionID(c *gin.Context) {

	if shouldHandleWithSSE(c.Request.Header) {
		handleWithSSE(c)
	} else {
		handleLegacy(c)
	}

}

func handleLegacy(c *gin.Context) {
	entry, sid, found := getEntryFromSessionID(c, true)

	if !found {
		return
	}

	if entry.EncryptedPassword == nil && entry.Username == nil {
		glg.Errorf("Credentials not yet received for session ID: %s", sid)
		c.JSON(http.StatusOK, gin.H{"status": false, "message": "Credentials not yet received"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "username": entry.Username, "password": entry.EncryptedPassword})
}

func handleWithSSE(c *gin.Context) {
	clientChan := make(chan sseCredForSessionIDResponse)
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")
	c.Writer.Flush()

	go func() {
		timeout := time.Now().Add(time.Minute)

		for {
			entry, sid, found := getEntryFromSessionID(c, true)

			if time.Now().Compare(timeout) > 0 {
				glg.Warnf("Timeout waiting for SID: %s", sid)
				clientChan <- sseCredForSessionIDResponse{Status: false, Message: "Timeout reached", TimeoutReached: true}
				return
			}

			if !found {
				clientChan <- sseCredForSessionIDResponse{Status: false, Message: "Credentials not yet received"}
				time.Sleep(time.Second * 2)
				continue
			}

			if entry.EncryptedPassword == nil && entry.Username == nil {
				glg.Debugf("Credentials not yet received for session ID: %s", sid)

				clientChan <- sseCredForSessionIDResponse{Status: false, Message: "Credentials not yet received, empty"}
				time.Sleep(time.Second * 2)
				continue
			}

			clientChan <- sseCredForSessionIDResponse{Status: true, Username: *entry.Username, EncryptedPassword: *entry.EncryptedPassword}

		}

	}()

	clientDisconnected := c.Stream(func(w io.Writer) bool {
		// Stream message to client from message channel
		if response, ok := <-clientChan; ok {
			if response.Status {
				c.SSEvent("message", gin.H{"status": response.Status, "username": response.Username, "password": response.EncryptedPassword})
			} else {
				c.SSEvent("message", gin.H{"status": response.Status, "message": response.Message})
			}

			if response.TimeoutReached {
				close(clientChan)
			}

			return true
		}
		return false
	})

	glg.Debugf("client disconnect: %t", clientDisconnected)
}

func shouldHandleWithSSE(headers map[string][]string) bool {
	acceptHeaders := headers["Accept"]

	if len(acceptHeaders) > 0 {
		for _, h := range acceptHeaders {
			headerValue := strings.ToLower(h)
			if strings.Contains(headerValue, "text/event-stream") {
				return true
			}
		}
	}

	return false
}

func getPasswordForSessionID(c *gin.Context) {
	entry, _, found := getEntryFromSessionID(c, true)

	if !found {
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": true, "message": entry.EncryptedPassword})

}
