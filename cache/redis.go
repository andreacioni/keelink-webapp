package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCacheClient struct {
	expiresIn time.Duration
	client    *redis.Client
}

func (c RedisCacheClient) Insert(entry CacheEntry) {
	ctx := context.TODO()
	c.client.HSet(ctx, entry.SessionID, entry)
	c.client.Expire(ctx, entry.SessionID, c.expiresIn)
}

func (c RedisCacheClient) Get(sessionID string) (CacheEntry, bool) {
	result := c.client.HGetAll(context.TODO(), sessionID)
	entry := CacheEntry{}

	if result != nil {
		if result.Scan(&entry) != nil {
			return entry, true
		}
	}

	return entry, false
}

func (c RedisCacheClient) Update(entry CacheEntry) error {
	return c.client.HSet(context.TODO(), entry.SessionID, entry).Err()
}

func (c RedisCacheClient) Remove(entry CacheEntry) error {
	res := c.client.Del(context.TODO(), entry.SessionID)

	if res == nil {
		return fmt.Errorf("failed to delete key: %s", entry.SessionID)
	}

	deleted, err := res.Result()

	if err != nil {
		return err
	}

	if deleted == 0 {
		return fmt.Errorf("session id: %s not found", entry.SessionID)
	}

	return nil
}
