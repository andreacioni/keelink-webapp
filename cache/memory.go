package cache

import (
	"time"

	"github.com/andreacioni/keelink-service/config"
	"github.com/patrickmn/go-cache"
)

type MemCacheProvider struct {
	memcache *cache.Cache
}

func (p *MemCacheProvider) Init() error {
	config := config.GetConfig()

	p.memcache = cache.New(config.Cache.ExpiresInSec*time.Second, config.Cache.PurgesEverySec*time.Second)

	return nil
}

func (p *MemCacheProvider) Insert(entry CacheEntry) error {
	p.memcache.SetDefault(entry.SessionID, entry)

	return nil
}

func (p *MemCacheProvider) Get(sessionID string) (CacheEntry, bool, error) {
	entry, found := p.memcache.Get(sessionID)

	if !found && entry != nil {
		return entry.(CacheEntry), true, nil
	}

	return CacheEntry{}, false, nil
}

func (p *MemCacheProvider) Update(entry CacheEntry) error {
	return p.memcache.Replace(entry.SessionID, entry, cache.DefaultExpiration)
}

func (p *MemCacheProvider) Remove(entry CacheEntry) error {
	p.memcache.Delete(entry.SessionID)

	return nil
}

func (p *MemCacheProvider) Destroy() error {
	p.memcache.Flush()
	p.memcache = nil
	return nil
}
