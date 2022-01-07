const pino = require("pino");
const path = require("path");
const fs = require("fs");
const homedir = require("os").homedir();

const silexLogDir = path.join(homedir, "silex");

// Creates the log dir if doesn't exist
// Runs only once because node caches requires
if (!fs.existsSync(silexLogDir)) {
  fs.mkdirSync(silexLogDir, { recursive: true });
}

// Setting the log level (debug if we are in development mode)
const isInDev = process.env.NODE_ENV === "development";

const logger = pino(
  {
    prettyPrint: {
      colorize: isInDev,
      translateTime: "mm/dd/yyyy - HH:MM:ss",
      ignore: "pid,hostname",
      messageFormat: "[silex-desktop] {msg}",
    },
  },
  isInDev ? undefined : path.join(silexLogDir, ".silex_desktop_log")
);

module.exports = logger;
