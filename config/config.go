package config

import (
	"io/ioutil"
	"time"

	"github.com/kpango/glg"

	"gopkg.in/yaml.v2"
)

type Configuration struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`

	//SSL
	CertFile string `yaml:"cert"`
	KeyFile  string `yaml:"key"`

	//Cache
	Cache Cache `yaml:"cache"`
}

type Cache struct {
	ExpiresInSec   time.Duration `yaml:"expiresInSec"`
	PurgesEverySec time.Duration `yaml:"purgesEverySec"`
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

	glg.Debugf("Current config: %+v", conf)

	return nil
}

func Unload() {
	glg.Debug("Unloading configuration")

	conf = Configuration{}
}

func GetConfig() Configuration {
	return conf
}
