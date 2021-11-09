const { ipcMain } = require("electron");
const { setNimbyValue } = require("../utils/blade");
const { sendBladeStatusToFront, setNimbyAutoMode } = require("../utils/nimby");
const logger = require("../utils/logger");

ipcMain.on("setNimbyStatus", (_event, newStatus) => {
  setNimbyValue(newStatus)
    .then(() => {
      sendBladeStatusToFront();
    })
    .catch(() => logger.error("[NIMBY] Couldn't set the nimby status"));
});

ipcMain.on("setNimbyAutoMode", (_event, newMode) => {
  setNimbyAutoMode(newMode);
  sendBladeStatusToFront();
});

module.exports = { sendBladeStatusToFront };
