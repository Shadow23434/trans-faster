let mainWindow = null;
let dialogWindow = null;
let openaiClient = null;
let isFirstResize = true;
let tray = null;

function setMainWindow(window) {
  mainWindow = window;
}

function getMainWindow() {
  return mainWindow;
}

function setDialogWindow(window) {
  dialogWindow = window;
}

function getDialogWindow() {
  return dialogWindow;
}

function setOpenAIClient(client) {
  openaiClient = client;
}

function getOpenAIClient() {
  return openaiClient;
}

function setIsFirstResize(value) {
  isFirstResize = value;
}

function getIsFirstResize() {
  return isFirstResize;
}

function setTray(trayInstance) {
  tray = trayInstance;
}

function getTray() {
  return tray;
}

module.exports = {
  setMainWindow,
  getMainWindow,
  setDialogWindow,
  getDialogWindow,
  setOpenAIClient,
  getOpenAIClient,
  setIsFirstResize,
  getIsFirstResize,
  setTray,
  getTray
};
