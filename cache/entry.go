package cache

import (
	"reflect"
)

const (
	REDIS  = "redis"
	MEMORY = "memory"
)

type CacheEntry struct {
	IP                string  `json:"ip"`
	SessionID         string  `json:"sessionId"`
	Token             string  `json:"token"`
	PublicKey         string  `json:"publicKey"`
	Username          *string `json:"username,exists"`
	EncryptedPassword *string `json:"encryptedPassword,exists"`
}

func (c CacheEntry) IsEmpty() {
	reflect.DeepEqual(c, CacheEntry{})
}
