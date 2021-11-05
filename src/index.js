const { app, BrowserWindow, Menu, Tray } = require("electron");
const path = require("path");
const mainWindow = require("./mainWindow.js");
const AutoLaunch = require("auto-launch");
const socketServer = require("@artfxdev/silex-socket-service");

process.env.SILEX_FRONT_URL = "http://localhost:3000";
const gotTheLock = app.requestSingleInstanceLock();

let tray;

/**
 * Add the tray menu (app icon in task bar)
 */
function createTrayMenu() {
  tray = new Tray(path.join(__dirname, "assets", "images", "256x256.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Silex",
      type: "normal",
      click: () => mainWindow.openMainWindow(),
    },
    { type: "separator" },
    {
      label: `Toggle Nimby`,
    },
    { type: "separator" },
    {
      label: "Quit Silex",
      type: "normal",
      click: () => {
        app.quit();
        app.exit();
      },
    },
  ]);

  tray.setToolTip("Silex desktop app");
  tray.setContextMenu(contextMenu);
}

if (!gotTheLock) {
  app.quit();
  return;
}

app.on("second-instance", () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow && mainWindow.mainWindow) {
    console.log(mainWindow.mainWindow.isMinimized());
    if (mainWindow.mainWindow.isMinimized()) mainWindow.mainWindow.restore();
    mainWindow.mainWindow.show();
    mainWindow.mainWindow.focus();
  }
});

/**
 * Called when the electron process is ready
 */
app.whenReady().then(() => {
  // Create tray menu and window
  createTrayMenu();
  mainWindow.createMainWindow();

  // Register IPC events
  require("./ipc");

  // Run the socket server
  socketServer.run();

  // Specific to macos
  // See: https://www.electronjs.org/docs/latest/api/app#event-activate-macos
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow.createMainWindow();
    }
  });

  // Called on quit
  app.on("quit", () => socketServer.persistStore());

  // Prevent closing the app when the main window is closed
  app.on("window-all-closed", (e) => e.preventDefault());

  // start on startup
  const silexLauncher = new AutoLaunch({
    name: "SilexDesktop",
    path: app.getPath("exe"),
  });
  silexLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) silexLauncher.enable();
  });
});
