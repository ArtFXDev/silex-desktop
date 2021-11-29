const { ipcMain } = require("electron");
const { setNimbyValue } = require("../utils/blade");
const { sendBladeStatusToFront, setNimbyAutoMode } = require("../utils/nimby");
const logger = require("../utils/logger");
const { asciiToHexa } = require("../utils/string");
const axios = require("axios").default;
const { mainWindow } = require("../mainWindow");

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
  axios
    .get("http://tractor/Tractor/monitor?q=gentoken")
    .then((response) => {
      const challengeEncoded = asciiToHexa(response.data.challenge + "|");

      return axios.get(
        `http://tractor/Tractor/monitor?q=login&user=nimby&c=${challengeEncoded}`
      );
    })
    .then((response) => {
      if (response.data.rc === 0) {
        return axios.get(
          `http://tractor/Tractor/queue?q=ejectall&blade=${hnm}&tsid=${response.data.tsid}`
        );
      } else {
        throw new Error("Can't login to Tractor with nimby account");
      }
    })
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
