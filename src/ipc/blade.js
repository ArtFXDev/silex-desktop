const { ipcMain } = require("electron");
const { setNimbyValue, killRunningTasksOnBlade } = require("../utils/blade");
const { sendBladeStatusToFront, setNimbyAutoMode } = require("../utils/nimby");
const logger = require("../utils/logger");

const { mainWindow } = require("../windows/main");

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

ipcMain.on("killAllActiveTasksOnBlade", (_event, hnm) => {
  // For tractor authentication see: https://rmanwiki.pixar.com/display/TRA/Login+Management
  killRunningTasksOnBlade(hnm)
    .then(() => {
      mainWindow.webContents.send("operationSuccess", {
        channel: "killAllActiveTasksOnBlade",
      });
    })
    .catch((error) =>
      mainWindow.webContents.send("operationError", {
        channel: "killAllActiveTasksOnBlade",
        error,
      })
    );
});

module.exports = { sendBladeStatusToFront };
