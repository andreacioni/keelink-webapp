package cache

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	keyPrefix = "keelink:session:"
)

type RedisCacheClient struct {
	expiresIn time.Duration
	client    *redis.Client
}

type redisCacheEntry struct {
	IP                string `redis:"ip"`
	SessionID         string `redis:"session-id"`
	Token             string `redis:"token"`
	PublicKey         string `redis:"pub-key"`
	Username          string `redis:"username"`
	EncryptedPassword string `redis:"enc-password"`
}

func toRedisCacheEntry(entry CacheEntry) redisCacheEntry {
	res := redisCacheEntry{
		IP:        entry.IP,
		SessionID: keyPrefix + entry.SessionID,
		Token:     entry.Token,
		PublicKey: entry.PublicKey,
	}

	if entry.Username != nil {
		res.Username = *entry.Username
	}

	if entry.EncryptedPassword != nil {
		res.EncryptedPassword = *entry.EncryptedPassword
	}

	return res
}

func fromRedisCacheEntry(entry redisCacheEntry) CacheEntry {
	sessionId := strings.Replace(entry.IP, keyPrefix, "", 1)
	res := CacheEntry{
		IP:        entry.IP,
		SessionID: sessionId,
		Token:     entry.Token,
		PublicKey: entry.PublicKey,
	}

	if entry.Username != "" {
		res.Username = &entry.Username
	}

	if entry.EncryptedPassword != "" {
		res.EncryptedPassword = &entry.EncryptedPassword
	}

	return res
}

func (c RedisCacheClient) Insert(entry CacheEntry) {
	ctx := context.TODO()
	redisEntry := toRedisCacheEntry(entry)
	c.client.HSet(ctx, redisEntry.SessionID, redisEntry)
	c.client.Expire(ctx, redisEntry.SessionID, c.expiresIn)
}

func (c RedisCacheClient) Get(sessionID string) (CacheEntry, bool) {
	result := c.client.HGetAll(context.TODO(), sessionID)
	entry := redisCacheEntry{}

	if result != nil {
		if result.Scan(&entry) != nil {
			return fromRedisCacheEntry(entry), true
		}
	}

	return fromRedisCacheEntry(entry), false
}

func (c RedisCacheClient) Update(entry CacheEntry) error {
	return c.client.HSet(context.TODO(), entry.SessionID, toRedisCacheEntry(entry)).Err()
}

func (c RedisCacheClient) Remove(entry CacheEntry) error {
	redisEntry := toRedisCacheEntry(entry)
	res := c.client.Del(context.TODO(), redisEntry.SessionID)

	if res == nil {
		return fmt.Errorf("failed to delete key: %s", redisEntry.SessionID)
	}

	deleted, err := res.Result()

	if err != nil {
		return err
	}

	if deleted == 0 {
		return fmt.Errorf("session id: %s not found", redisEntry.SessionID)
	}

	return nil
}
