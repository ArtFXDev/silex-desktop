const fs = require("fs");
const logger = require("../logger");
const store = require("./index");
const merge = require("deepmerge");
const path = require("path");
const os = require("os");

const storeFile = path.join(
  process.env.SILEX_LOG_DIR || path.join(os.homedir(), "silex"),
  ".silex_desktop_store"
);

/**
 * Write the store in json format on the disk
 */
const persistStore = () => {
  try {
    fs.writeFileSync(storeFile, JSON.stringify(store.instance.data));
    logger.info(`Written store to ${storeFile}`);
  } catch (err) {
    logger.error(`Error writing store: ${err}`);
  }
};

/**
 * Reload the store from that file
 */
const restoreStore = () => {
  try {
    const rawdata = fs.readFileSync(storeFile, { encoding: "utf8", flag: "r" });
    store.instance.data = merge(store.instance.data, JSON.parse(rawdata));
    logger.info(`Loaded store from ${storeFile}`);
  } catch (err) {
    logger.error(`Error when reading back the store: ${err}`);
  }
};

module.exports = { persistStore, restoreStore };
