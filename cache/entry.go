package cache

import (
	"reflect"
)

type CacheEntry struct {
	IP                string  `redis:"ip"`
	SessionID         string  `redis:"session-id"`
	Token             string  `redis:"token"`
	PublicKey         string  `redis:"pub-key"`
	Username          *string `binding:"exists" redis:"username"`
	EncryptedPassword *string `binding:"exists" redis:"enc-password"`
}

func (c CacheEntry) IsEmpty() {
	reflect.DeepEqual(c, CacheEntry{})
}
