const { ipcMain, shell } = require("electron");

ipcMain.on("openSilexFront", () => {
  shell.openExternal(process.env.SILEX_FRONT_URL);
});
