package cache

import (
	"fmt"
	"github.com/andreacioni/keelink-service/config"
	"github.com/patrickmn/go-cache"
	"time"
)

var (
	c *cache.Cache
)

func Init() {
	config := config.GetConfig()

	c = cache.New(config.Cache.ExpiresInSec*time.Second, config.Cache.PurgesEverySec*time.Second)
}

func Insert(entry CacheEntry) {
	c.SetDefault(entry.SessionID, entry)
}

func Get(sessionID string) (CacheEntry, bool) {
	entry, _ := c.Get(sessionID)

	if entry != nil {
		return entry.(CacheEntry), true
	}

	return CacheEntry{}, false
}

func Update(entry CacheEntry) error {
	return c.Replace(entry.SessionID, entry, cache.DefaultExpiration)
}

func Remove(entry CacheEntry) error {
	if _, found := c.Get(entry.SessionID); !found {
		return fmt.Errorf("Entry not found")
	}

	c.Delete(entry.SessionID)

	return nil
}
