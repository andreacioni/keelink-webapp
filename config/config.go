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
	Host    string
	Port    int
	SSLCert string `yaml:"sslCert"`
	SSLKey  string `yaml:"sslKey"`

	//Cache
	Cache Cache `yaml:"cache"`
}

type Cache struct {
	ExpiresInSec   uint64 `yaml:"expiresInSec"`
	PurgesEverySec uint64 `yaml:"purgesEverySec"`

	//Redis
	Redis Redis `yaml:"redis"`
}

type Redis struct {
	Host     string `yaml:"host"`
	Password string `yaml:"password"`
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
			ExpiresInSec:   parseUint(os.Getenv("EXPIRES_IN_SEC")),
			PurgesEverySec: parseUint(os.Getenv("PURGES_EVERY_SEC")),
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

func parseUint(str string) uint64 {
	duration, err := strconv.ParseUint(str, 10, 64)

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
