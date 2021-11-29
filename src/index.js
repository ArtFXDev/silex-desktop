const { app, BrowserWindow } = require("electron");
const socketServer = require("@artfxdev/silex-socket-service");
const mainWindow = require("./mainWindow");
const AutoLaunch = require("auto-launch");
const { restoreStore, persistStore } = require("./utils/store/persistence");
const { initializeTray } = require("./tray");

// Early exit to prevent the application to be opened twice
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

app.on("second-instance", () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow && mainWindow.mainWindow) {
    if (mainWindow.mainWindow.isMinimized()) mainWindow.mainWindow.restore();
    mainWindow.mainWindow.show();
    mainWindow.mainWindow.focus();
  }
});

/**
 * Catch all uncaught exceptions to the console
 */
process.on("uncaughtException", function (error) {
  console.log(error);
});

/**
 * Called when the electron process is ready
 */
app.whenReady().then(() => {
  restoreStore();
  persistStore();

  initializeTray();
  mainWindow.createMainWindow();

  // Register IPC events
  require("./ipc");

  // Start Nimby monitoring
  require("./utils/nimby").startNimbyEventLoop();

  // Run the socket server
  socketServer.run();

  // Specific to macos
  // See: https://www.electronjs.org/docs/latest/api/app#event-activate-macos
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow.createMainWindow();
    }
  });

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
