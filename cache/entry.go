package cache

import (
	"reflect"
)

type CacheEntry struct {
	IP                string  `redis:"ip"`
	SessionID         string  `redis:"session-id"`
	Token             string  `redis:"token"`
	PublicKey         string  `redis:"pub-key"`
	Username          *string `redis:"username"`
	EncryptedPassword *string `redis:"enc-password"`
}

func (c CacheEntry) IsEmpty() {
	reflect.DeepEqual(c, CacheEntry{})
}
