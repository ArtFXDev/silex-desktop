const pino = require("pino");
const path = require("path");
const fs = require("fs");

// Creates the log dir if doesn't exist
// Runs only once because node caches requires
if (process.env.SILEX_LOG_DIR && !fs.existsSync(process.env.SILEX_LOG_DIR)) {
  fs.mkdirSync(process.env.SILEX_LOG_DIR, { recursive: true });
}

const logger = pino(
  {
    prettyPrint: true,
    colorize: process.env.NODE_ENV === "development",
    translateTime: true,
  },
  process.env.NODE_ENV === "development"
    ? undefined
    : path.join(process.env.SILEX_LOG_DIR, ".silex_desktop_log")
);

module.exports = logger;
