const axios = require("axios").default;
const logger = require("../utils/logger");
const { asciiToHexa } = require("../utils/string");

const BLADE_URL = "http://localhost:9005";

/**
 * Returns a promise with the blade status
 */
async function getBladeStatus() {
  let response = await axios.get(`${BLADE_URL}/blade/status`);
  response.data.nimbyON = !(response.data.nimby === "None");

  return response;
}

/**
 * Sets the nimby status to ON or OFF. Returns a promise
 */
async function setNimbyValue(newStatus) {
  const { updateTrayMenu } = require("../tray");

  logger.info(`[NIMBY] Setting Nimby value to ${newStatus}`);

  const response = await axios.get(
    `${BLADE_URL}/blade/ctrl?nimby=${newStatus ? 1 : 0}`
  );

  if (response.data.rc === 0) updateTrayMenu(newStatus);
}

/**
 * Toggle the status of the Nimby
 */
async function toggleNimby() {
  const response = await getBladeStatus();
  return await setNimbyValue(response.data.nimby === "None");
}

async function killRunningTasksOnBlade(hnm) {
  const response = await axios.get("http://tractor/Tractor/monitor?q=gentoken");

  const challengeEncoded = asciiToHexa(response.data.challenge + "|");

  const response_1 = await axios.get(
    `http://tractor/Tractor/monitor?q=login&user=nimby&c=${challengeEncoded}`
  );

  if (response_1.data.rc === 0) {
    await axios.get(
      `http://tractor/Tractor/queue?q=ejectall&blade=${hnm}&tsid=${response_1.data.tsid}`
    );

    // Kill all running jobs with special service running
    const status = await getBladeStatus();

    for (const process of status.data.pids) {
      await axios.post(`http://localhost:5119/kill/${process.pid}`);
    }
  } else {
    throw new Error("Can't login to Tractor with nimby account");
  }
}

module.exports = {
  getBladeStatus,
  setNimbyValue,
  toggleNimby,
  killRunningTasksOnBlade,
};
