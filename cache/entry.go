package cache

import (
	"reflect"
)

type CacheEntry struct {
	IP        string
	SessionID string
	PublicKey string
}

func (c CacheEntry) IsEmpty() {
	reflect.DeepEqual(c, CacheEntry{})
}
