package cache

import (
	"reflect"
)

type CacheEntry struct {
	IP                string
	SessionID         string
	PublicKey         string
	EncryptedPassword string
}

func (c CacheEntry) IsEmpty() {
	reflect.DeepEqual(c, CacheEntry{})
}
