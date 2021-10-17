package cache

import (
	"fmt"

	"github.com/andreacioni/keelink-service/config"
)

var (
	cacheProvider CacheProvider
)

func Init() error {
	if cacheProvider != nil {
		return fmt.Errorf("cache provider already set")
	}

	if config.GetConfig().Cache.Provider == REDIS {
		cacheProvider = &RedisCacheProvider{}
	} else {
		cacheProvider = &MemCacheProvider{}
	}

	return nil
}

func Provider() CacheProvider {
	return cacheProvider
}

func Destroy() error {
	defer func() {
		cacheProvider = nil
	}()

	if cacheProvider != nil {
		return cacheProvider.Destroy()
	}

	return nil
}

type CacheProvider interface {
	Init() error
	Insert(CacheEntry) error
	Get(string) (CacheEntry, bool, error)
	Update(CacheEntry) error
	Remove(CacheEntry) error
	Destroy() error
}
