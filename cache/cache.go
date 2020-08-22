package cache

import (
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
