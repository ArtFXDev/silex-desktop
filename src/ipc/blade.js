const { ipcMain } = require("electron");
const { setNimbyValue } = require("../utils/blade");
const { sendBladeStatusToFront, setNimbyAutoMode } = require("../utils/nimby");
const logger = require("../utils/logger");

ipcMain.on("setNimbyStatus", (_event, newStatus) => {
  setNimbyValue(newStatus)
    .then(() => {
      sendBladeStatusToFront();
    })
    .catch((err) => {
      logger.error("[NIMBY] Couldn't set the nimby status", err);
    });
});

ipcMain.on("setNimbyAutoMode", (_event, newMode) => {
  setNimbyAutoMode(newMode);
  sendBladeStatusToFront();
});

module.exports = { sendBladeStatusToFront };
