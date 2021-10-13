package cache

import (
	"reflect"
)

type CacheEntry struct {
	IP                string
	SessionID         string
	Token             string
	PublicKey         string
	Username          *string `binding:"exists"`
	EncryptedPassword *string `binding:"exists"`
}

func (c CacheEntry) IsEmpty() {
	reflect.DeepEqual(c, CacheEntry{})
}
