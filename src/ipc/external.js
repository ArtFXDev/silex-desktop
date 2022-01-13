const { ipcMain, shell, clipboard } = require("electron");
const fs = require("fs");

ipcMain.on("openSilexFront", () => {
  shell.openExternal(process.env.SILEX_FRONT_URL);
});

ipcMain.on("openPath", (_event, path) => {
  shell.openPath(path);
});

ipcMain.on("pathExists", (event, path) => {
  event.returnValue = fs.existsSync(path);
});

ipcMain.on("mkdir", (event, path) => {
  fs.mkdirSync(path, { recursive: true });
});

ipcMain.on("clipboardWriteText", (event, text) => {
  clipboard.writeText(text);
});
