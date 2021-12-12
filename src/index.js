const { app, BrowserWindow } = require("electron");
const socketServer = require("@artfxdev/silex-socket-service");
const mainWindow = require("./windows/main");
const AutoLaunch = require("auto-launch");
const { restoreStore, persistStore } = require("./utils/store/persistence");
const { initializeTray } = require("./tray");
const { autoUpdater } = require("electron-updater");
const cron = require("node-cron");
const logger = require("./utils/logger");
const updateWindow = require("./windows/update");

// Early exit to prevent the application to be opened twice
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
}

// Someone tried to run a second instance, we should focus our window.
app.on("second-instance", () => {
  if (mainWindow && mainWindow.mainWindow) {
    if (mainWindow.mainWindow.isMinimized()) mainWindow.mainWindow.restore();
    mainWindow.mainWindow.show();
    mainWindow.mainWindow.focus();
  }
});

// Catch all uncaught exceptions to the console
process.on("uncaughtException", function (error) {
  logger.error(error);
});

/**
 * Called when the electron process is ready
 */
app.whenReady().then(() => {
  // Make sure the store gets written
  restoreStore();
  persistStore();

  initializeTray();

  // If using the --hidden argument hide the window on startup
  mainWindow.createMainWindow(process.argv.includes("--hidden"));

  autoUpdater.on("error", (err) => {
    logger.error(`Auto updater error: ${err}`);
  });

  cron.schedule("0 7 * * *", () => {
    logger.info("Daily checking for releases...");
    autoUpdater.checkForUpdatesAndNotify();
  });

  autoUpdater.on("update-available", () => {
    logger.info("Update available");
  });

  autoUpdater.on("update-downloaded", () => {
    logger.info("Update downloaded!");
    updateWindow.createUpdateWindow();
    updateWindow.onUpdateDownloaded();
  });

  // Check for updates when it runs automatically on startup
  // The --hidden parameter gets added in the registry command with auto startup
  if (process.argv.includes("--hidden")) {
    autoUpdater.checkForUpdatesAndNotify();
  }

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

  // Auto launch on startup
  const silexLauncher = new AutoLaunch({
    name: "silex-desktop",
    path: app.getPath("exe"),
    isHidden: true,
  });

  silexLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled && process.env.NODE_ENV !== "development") {
      logger.debug("Enabling auto launch");
      silexLauncher.enable();
    }
  });
});
