package cache

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/andreacioni/keelink-service/config"
	"github.com/go-redis/redis/v8"
)

type RedisCacheProvider struct {
	client  *redis.Client
	context context.Context
}

func (rcp *RedisCacheProvider) Init() error {
	rcp.client = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	rcp.context = context.Background()

	return nil
}

func (rcp *RedisCacheProvider) Insert(entry CacheEntry) error {
	byteEntry, err := json.Marshal(&entry)

	if err != nil {
		return fmt.Errorf("failed to encode entry: %v", entry)
	}

	return rcp.client.Set(rcp.context, entry.SessionID, string(byteEntry), config.GetConfig().Cache.ExpiresInSec).Err()
}

func (rcp *RedisCacheProvider) Update(entry CacheEntry) error {
	return rcp.Insert(entry)
}

func (rcp *RedisCacheProvider) Get(key string) (entry CacheEntry, found bool, err error) {
	redisEntry, err := rcp.client.Get(rcp.context, key).Result()

	if err == redis.Nil {
		return CacheEntry{}, false, fmt.Errorf("no value found")
	} else if err != nil {
		return CacheEntry{}, false, fmt.Errorf("failed to get value: %w", err)
	}

	if err = json.Unmarshal([]byte(redisEntry), &entry); err != nil {
		return CacheEntry{}, false, fmt.Errorf("failed decoding value '%s': %w", redisEntry, err)
	}

	return entry, false, fmt.Errorf("failed to get value for key: %s", key)
}

func (rcp *RedisCacheProvider) Remove(entry CacheEntry) error {
	if _, err := rcp.client.Del(rcp.context, entry.SessionID).Result(); err != nil {
		if err == redis.Nil {
			return fmt.Errorf("entry not found for key: %s", entry.SessionID)
		}

		return fmt.Errorf("failed to delete value for key: %s, %w", entry.SessionID, err)

	}

	return nil
}

func (rcp *RedisCacheProvider) Destroy() error {
	if rcp.client != nil {
		return rcp.client.Close()
	}

	return nil
}
