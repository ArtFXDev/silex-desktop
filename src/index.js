const { app, BrowserWindow, Menu, Tray } = require("electron");
const path = require("path");
const mainWindow = require("./mainWindow.js");

const socketServer = require("@artfxdev/silex-socket-service");

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
});
