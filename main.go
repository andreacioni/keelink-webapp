package main

import (
	"flag"
	"os"

	"github.com/andreacioni/keelink-service/cache"
	"github.com/andreacioni/keelink-service/config"
	"github.com/andreacioni/keelink-service/server"
	"github.com/kpango/glg"
)

var (
	configFile string
	logLevel   string
)

func main() {

	parseArgs()

	setupLogger()

	loadConfig()

	cacheInit()

	if err := server.Serve(); err != nil {
		glg.Errorf("Cannot startup API: %v", err)
		os.Exit(3)
	}
}

func cacheInit() {
	cache.Init()
}

func loadConfig() {
	if configFile != "" {
		if err := config.Load(configFile); err != nil {
			glg.Errorf("cannot parse config file: %v", err)
			os.Exit(1)
		}
	} else {
		if err := config.LoadEnv(); err != nil {
			glg.Errorf("cannot parse config file: %v", err)
			os.Exit(1)
		}
	}

}

func setupLogger() {
	glg.Get().SetMode(glg.STD).AddStdLevel(logLevel, glg.STD, false)
}

func parseArgs() {
	flag.StringVar(&configFile, "c", "", "configuration file path")
	flag.StringVar(&logLevel, "l", "WARN", "set log level")

	flag.Parse()
}
