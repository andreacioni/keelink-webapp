package config

import (
	"io/ioutil"
	"os"
	"strconv"
	"time"

	"github.com/kpango/glg"
	"gopkg.in/yaml.v2"
)

type Configuration struct {
	//Network
	Host string
	Port int

	//Cache
	Cache Cache `yaml:"cache"`
}

type Redis struct {
	Url string `yaml:"url"`
}

type Cache struct {
	Provider       string        `yaml:"provider"`
	ExpiresInSec   time.Duration `yaml:"expiresInSec"`
	PurgesEverySec time.Duration `yaml:"purgesEverySec"`

	Redis Redis `yaml:"redis"`
}

var (
	conf Configuration
)

func Load(filename string) error {
	glg.Debugf("Loading configuration from %s ...", filename)

	raw, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}

	err = yaml.Unmarshal(raw, &conf)
	if err != nil {
		return err
	}

	glg.Debugf("current config: %+v", conf)

	return nil
}

func LoadEnv() error {
	glg.Debugf("loading configuration from environment variables ...")

	conf = Configuration{
		Host: os.Getenv("HOST"),
		Port: parseInt(os.Getenv("PORT")),
		Cache: Cache{
			Provider:       os.Getenv("CACHE_PROVIDER"),
			ExpiresInSec:   parseDuration(os.Getenv("EXPIRES_IN_SEC")),
			PurgesEverySec: parseDuration(os.Getenv("PURGES_EVERY_SEC")),

			Redis: Redis{Url: os.Getenv("REDIS_URL")},
		},
	}

	glg.Debugf("current config: %+v", conf)

	return nil
}

func parseInt(str string) int {
	integer, err := strconv.Atoi(str)

	if err != nil {
		panic(err)
	}

	return integer
}

func parseDuration(str string) time.Duration {
	duration, err := time.ParseDuration(str)

	if err != nil {
		panic(err)
	}

	return duration
}

func Unload() {
	glg.Debug("unloading configuration")

	conf = Configuration{}
}

func GetConfig() Configuration {
	return conf
}
