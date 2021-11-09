const { app, ipcMain } = require("electron");
const { mainWindow } = require("../mainWindow");

ipcMain.on("bringWindowToFront", () => {
  if (process.platform === "darwin") {
    app.show();
  }

  app.focus();

  mainWindow.setAlwaysOnTop(true);
  mainWindow.show();
  mainWindow.setAlwaysOnTop(false);

  mainWindow.focus();
});
