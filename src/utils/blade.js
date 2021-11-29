const axios = require("axios").default;
const logger = require("../utils/logger");

const BLADE_URL = "http://localhost:9005";

/**
 * Returns a promise with the blade status
 */
async function getBladeStatus() {
  const response = await axios.get(`${BLADE_URL}/blade/status`);
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

module.exports = { getBladeStatus, setNimbyValue, toggleNimby };
