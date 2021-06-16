const { ipcMain } = require('electron');
const { exec } = require('child_process');
const getPort = require('get-port');

/**
 * Execute a shell command
 */
function execShellCommand(command) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    console.log(`stdout:\n${stdout}`);
  });
}

ipcMain.on('openDCC', (event, arg) => {
  const command = `rez env ${arg.name} -- ${arg.name}`;

  // Get an available tcp port and run the command
  getPort().then(port => {
    console.log("Choosen port : " + port);
    console.log("Running command " + command);

    execShellCommand(command);
  });
});

ipcMain.on('getDCCClients', (event, arg) => {
  console.log('get clients');
});
