const store = require("./utils/store");
const { restoreStore } = require("./utils/store/persistence");
const { app, BrowserWindow, protocol, Notification } = require("electron");
const silexSocketService = require("@artfxdev/silex-socket-service");
const mainWindow = require("./windows/main");
const AutoLaunch = require("auto-launch");
const { initializeTray } = require("./tray");
const { autoUpdater } = require("electron-updater");
const cron = require("node-cron");
const logger = require("./utils/logger");
const updateWindow = require("./windows/update");
const { setLogLevel } = require("./utils/settings");

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

function initialize() {
  // Initialize socket service
  silexSocketService.initialize();
  // Add desktop to the socket service
  silexSocketService.app.get("/desktop/status", (req, res) => {
    res.json(store.instance.data);
  });

  // Before any code restore the store
  restoreStore();

  // Initialize the log level
  setLogLevel(store.instance.data.logLevel);
}

/**
 * Called when the electron process is ready
 */
app.whenReady().then(() => {
  initialize();
  initializeTray();

  // Create a custom file protocol to bypass the file:// protection
  // See: https://www.electronjs.org/docs/latest/api/protocol#protocolregisterfileprotocolscheme-handler-completion
  // It allows the front-end to display images that are local
  protocol.registerFileProtocol("local", (request, callback) => {
    const url = request.url.slice(7);
    callback({ path: url });
  });

  // If using the --hidden argument hide the window on startup
  mainWindow.createMainWindow(process.argv.includes("--hidden"));

  autoUpdater.on("error", (err) => {
    logger.error(`Auto updater error: ${err}`);
  });

  cron.schedule("0 5 * * *", () => {
    logger.info("Daily checking for releases...");

    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();

      // Clear the cache so we refresh the single page
      mainWindow.mainWindow.webContents.session.clearCache(() =>
        logger.info("Cleared window cache")
      );

      mainWindow.loadSilexFrontUrl();
    }, Math.random() * 2 * 60 * 60 * 1000);
  });

  autoUpdater.on("update-available", () => {
    logger.info("Update available");
    new Notification({
      title: "Silex",
      body: "Found a new version, downloading...",
    });
  });

  autoUpdater.on("update-not-available", () => {
    logger.error("not available");
    new Notification({ title: "Silex", body: "Silex is up to date!" });
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
  logger.info("Starting NIMBY event loop...");
  require("./utils/nimby").startNimbyEventLoop();

  // Run the socket server
  silexSocketService.run();

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
