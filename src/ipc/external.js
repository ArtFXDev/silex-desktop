const { ipcMain, shell } = require("electron");

ipcMain.on("openSilexFront", () => {
  shell.openExternal(process.env.SILEX_FRONT_URL);
});

ipcMain.on("openFolderOrFile", (_event, path) => {
  shell.openPath(path);
});
