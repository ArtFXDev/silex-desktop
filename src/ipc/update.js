const { ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const updateWindow = require("../window/updateWindow");

ipcMain.on("restartApp", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on("closeSilexUpdate", () => {
  updateWindow.closeUpdateWindow();
});
