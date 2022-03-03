const { mainWindow } = require("../windows/main");
const { getBladeStatus, setNimbyValue } = require("./blade");
const { powerMonitor } = require("electron");
const os = require("os-utils");
const findProcess = require("find-process");
const path = require("path");
const CONFIG = require("../config/config.json");
const logger = require("../utils/logger");
const store = require("./store");
const { persistStore } = require("./store/persistence");

// The auto mode interval
let autoInterval = null;

/**
 * Set the nimby auto mode value. If set to true
 */
function setNimbyAutoMode(newMode) {
  if (newMode) {
    store.instance.data.nimbyAutoMode = true;
    checkIfUsed();
    triggerAutoInterval();
  } else {
    store.instance.data.nimbyAutoMode = false;

    getBladeStatus().then((response) => {
      store.instance.data.nimbyStatus = response.data.nimbyON ? "on" : "off";
    });

    // Stop the auto mode loop
    clearInterval(autoInterval);
  }

  persistStore();
}

/**
 * Queries the blade status and send it to the window process with IPC
 */
function sendBladeStatusToFront() {
  getBladeStatus()
    .then((response) => {
      if (mainWindow.isVisible()) {
        mainWindow.webContents.send("bladeStatusUpdate", {
          ...response.data,
          nimbyAutoMode: store.instance.data.nimbyAutoMode,
        });
      }
    })
    .catch((err) => logger.debug(err.message));
}

/**
 * The Auto mode is enabled after a certain hour in the afternoon
 */
function checkForNimbyAutoMode() {
  logger.debug("[NIMBY] Checking for auto mode...");
  const hour = new Date().getHours();

  const shouldGoAuto =
    hour >= CONFIG.nimby.autoMode.startHour ||
    hour <= CONFIG.nimby.autoMode.endHour;

  if (!store.instance.data.nimbyAutoMode && shouldGoAuto) {
    logger.debug(`[NIMBY] Auto mode activation because of ${hour}h`);
    setNimbyAutoMode(true);
  }
}

/**
 * Returns true if a user was active recently
 */
function isUserActive() {
  const idleTime = powerMonitor.getSystemIdleTime();
  return idleTime < CONFIG.nimby.autoMode.maxUserIdleTime;
}

/**
 * Returns the cpu usage in percent
 */
async function cpuUsage() {
  return new Promise((resolve) => {
    os.cpuUsage((cpu) => {
      logger.debug("[NIMBY] CPU: " + Math.round(cpu * 100) + "%");
      resolve(Math.round(cpu * 100));
    });
  });
}

/**
 * Returns true if any of the running processes are in the config blacklist
 */
async function checkForRunningProcesses() {
  logger.debug("[NIMBY] Check for running processes ...");

  const processes = await findProcess("name", "");

  for (const process of processes) {
    const processName = path.parse(process.name).name;

    if (CONFIG.nimby.autoMode.softwares.includes(processName)) {
      return processName;
    }
  }

  return false;
}

/**
 * Checks if the computer is used by someone and toggles the Nimby ON/OFF depending on that
 * It checks the CPU usage and if there are any processes like Maya our Houdini running on the computer
 */
async function checkIfUsed() {
  const bladeStatus = (await getBladeStatus()).data;
  const runningJobs = bladeStatus.pids;

  // When a job is running we don't need to set the nimby value
  if (runningJobs.length > 0) {
    logger.debug("[NIMBY] A job is currently running");
    store.instance.data.nimbyStatus = `job running: ${runningJobs[0].jid} (${runningJobs[0].login})`;
    return;
  }

  // Same when the user is active
  if (isUserActive()) {
    logger.debug("[NIMBY] User is active");
    store.instance.data.nimbyStatus = "user active";
    if (!bladeStatus.nimbyON) setNimbyValue(true);
    return;
  }

  const cpuUse = await cpuUsage();
  const cpuUsed = cpuUse > 50;
  if (cpuUsed) {
    logger.debug(`[NIMBY] CPU is active at ${cpuUse}%`);
    store.instance.data.nimbyStatus = `CPU is active at ${cpuUse}%`;
  }

  const runningProcess = await checkForRunningProcesses();
  if (runningProcess) {
    logger.debug(`[NIMBY] ${runningProcess} is running`);
    store.instance.data.nimbyStatus = `${runningProcess} is running`;
  }

  // Set the nimby to ON if there's some activity on the computer
  if (cpuUsed || runningProcess) {
    if (!bladeStatus.nimbyON) setNimbyValue(true);
  } else {
    // Otherwise set it to OFF because it's unused
    if (bladeStatus.nimbyON) setNimbyValue(false);
    store.instance.data.nimbyStatus = "unused";
  }
}

/**
 * Starts the interval when in auto mode
 */
function triggerAutoInterval() {
  autoInterval = setInterval(() => {
    checkIfUsed();
    persistStore();
  }, 60000 * 2);
}

/**
 * Starts the nimby event loop (auto mode)
 */
function startNimbyEventLoop() {
  // Sends a ping every X seconds to the frontend that updates the blade status
  setInterval(sendBladeStatusToFront, 4000);

  // Switch to auto mode after a certain hour
  setInterval(checkForNimbyAutoMode, 60000 * 2);

  // By default it's in auto mode
  if (store.instance.data.nimbyAutoMode) triggerAutoInterval();
}

module.exports = {
  sendBladeStatusToFront,
  startNimbyEventLoop,
  setNimbyAutoMode,
};
