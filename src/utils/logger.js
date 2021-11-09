const pino = require("pino");
const path = require("path");

const logger = pino(
  {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  },
  process.env.NODE_ENV === "development"
    ? undefined
    : pino.destination(
        path.join(
          path.join(require("os").homedir(), "silex"),
          ".silex_desktop_log"
        )
      )
);

module.exports = logger;
