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
    logger.warn(`The store file ${storeFile} doesn't exist: ${err}`);
    persistStore();
  }
};

module.exports = { persistStore, restoreStore };
