package cache

import (
	"fmt"

	"github.com/patrickmn/go-cache"
)

type MemoryCacheClient struct {
	memoryCache *cache.Cache
}

func (c MemoryCacheClient) Insert(entry CacheEntry) {
	cc := c.memoryCache
	cc.SetDefault(entry.SessionID, entry)
}

func (c MemoryCacheClient) Get(sessionID string) (CacheEntry, bool) {
	entry, _ := c.memoryCache.Get(sessionID)

	if entry != nil {
		return entry.(CacheEntry), true
	}

	return CacheEntry{}, false
}

func (c MemoryCacheClient) Update(entry CacheEntry) error {
	return c.memoryCache.Replace(entry.SessionID, entry, cache.DefaultExpiration)
}

func (c MemoryCacheClient) Remove(entry CacheEntry) error {
	if _, found := c.memoryCache.Get(entry.SessionID); !found {
		return fmt.Errorf("entry not found")
	}

	c.memoryCache.Delete(entry.SessionID)

	return nil
}
