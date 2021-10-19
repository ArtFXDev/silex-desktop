const { app, ipcMain } = require("electron");
const { mainWindow } = require("../mainWindow");

ipcMain.on("bringWindowToFront", () => {
  if (process.platform === "darwin") {
    app.show();
  }

  app.focus();

  mainWindow.show();
  mainWindow.focus();
});
