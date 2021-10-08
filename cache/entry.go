package cache

import (
	"reflect"
)

type CacheEntry struct {
	IP                string
	SessionID         string
	PublicKey         string
	Username          *string `binding:"exists"`
	EncryptedPassword string
}

func (c CacheEntry) IsEmpty() {
	reflect.DeepEqual(c, CacheEntry{})
}
