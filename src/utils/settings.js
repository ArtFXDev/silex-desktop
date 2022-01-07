const store = require("./store");
const logger = require("./logger");
const { persistStore } = require("./store/persistence");
const silexSocketService = require("@artfxdev/silex-socket-service");

const formatLevelForPino = {
  INFO: "info",
  WARNING: "warn",
  DEBUG: "debug",
};

function setLogLevel(newLogLevel) {
  logger.info(`Setting log level to ${newLogLevel}`);

  // Set the environment variable (useful for silex_client)
  process.env.SILEX_LOG_LEVEL = newLogLevel;

  // Store it
  store.instance.data.logLevel = newLogLevel;

  // Change the log level of the socket service
  logger.level = formatLevelForPino[newLogLevel];
  silexSocketService.setLogLevel(formatLevelForPino[newLogLevel]);

  persistStore();
}

module.exports = { setLogLevel };
