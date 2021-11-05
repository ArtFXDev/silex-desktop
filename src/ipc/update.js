const { ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const updateWindow = require("../windows/update/updateWindow");

ipcMain.on("restartApp", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on("closeSilexUpdate", () => {
  updateWindow.closeUpdateWindow();
});
