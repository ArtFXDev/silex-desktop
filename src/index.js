const { app, BrowserWindow, Menu, Tray } = require("electron");
const path = require("path");

// Load project specific modules

const mainWindow = require("./mainWindow.js");

/**
 * Add the tray menu (app icon in task bar)
 */
function createTrayMenu() {
  tray = new Tray(path.join(__dirname, "256x256.png"));

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
      click: () => app.quit(),
    },
  ]);

  tray.setToolTip("Silex pipeline dektop app");
  tray.setContextMenu(contextMenu);
}

/**
 * Called when the electron process is ready
 */
app.whenReady().then(() => {
  createTrayMenu();
  mainWindow.createMainWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0)
      mainWindow.createMainWindow();
  });

  // Prevent closing the app when the window is closed
  app.on("window-all-closed", (e) => e.preventDefault());
});
