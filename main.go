package main

import (
	"flag"
	"os"

	"github.com/andreacioni/keelink-service/api"
	"github.com/andreacioni/keelink-service/cache"
	"github.com/andreacioni/keelink-service/config"
	"github.com/kpango/glg"

	_ "github.com/heroku/x/hmetrics/onload"
)

var (
	configFile string
	logLevel   string
)

func main() {

	parseArgs()

	setupLogger()

	if err := config.Load(configFile); err != nil {
		glg.Errorf("Cannot parse config file: %v", err)
		os.Exit(1)
	}

	cache.Init()

	if err := api.Init(shutdown); err != nil {
		glg.Errorf("Cannot startup API: %v", err)
		os.Exit(3)
	}

	glg.Info("KeeLink service is up and running!")
}

func setupLogger() {
	glg.Get().SetMode(glg.STD).AddStdLevel(logLevel, glg.STD, false)
}

func parseArgs() {
	flag.StringVar(&configFile, "c", "config.yaml", "configuration file path")
	flag.StringVar(&logLevel, "l", "WARN", "set log level")

	flag.Parse()
}

func shutdown() {

}
