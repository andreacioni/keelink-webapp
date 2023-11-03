package cache

import (
	"time"

	"github.com/andreacioni/keelink-service/config"
	"github.com/kpango/glg"
	"github.com/patrickmn/go-cache"
	"github.com/redis/go-redis/v9"
)

var (
	cacheClient CacheClient
)

type CacheClient interface {
	Insert(CacheEntry)
	Get(string) (CacheEntry, bool)
	Update(CacheEntry) error
	Remove(CacheEntry) error
}

func Init() {
	config := config.GetConfig()

	if config.Cache.Redis.Host != "" {
		glg.Info("use Redis cache instance")
		cacheClient = &RedisCacheClient{
			expiresIn: time.Duration(config.Cache.ExpiresInSec) * time.Second,
			client: redis.NewClient(&redis.Options{
				Addr:     config.Cache.Redis.Host,
				Password: config.Cache.Redis.Password,
				DB:       0}),
		}
	} else {
		glg.Info("use in-memory cache instance")
		cacheClient = &MemoryCacheClient{memoryCache: cache.New(time.Duration(config.Cache.ExpiresInSec)*time.Second, time.Duration(config.Cache.PurgesEverySec)*time.Second)}
	}

}

func Insert(entry CacheEntry) {
	cacheClient.Insert(entry)
}

func Get(sessionID string) (CacheEntry, bool) {
	return cacheClient.Get(sessionID)
}

func Update(entry CacheEntry) error {
	return cacheClient.Update(entry)
}

func Remove(entry CacheEntry) error {
	return cacheClient.Remove(entry)
}
