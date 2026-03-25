const { BrowserWindow, screen, app } = require('electron');
const path = require('path');
const { getDialogWindow, setDialogWindow, setIsFirstResize } = require('../state/index.js');

function calculateDialogPosition() {
  const cursorPoint = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const screenWidth = currentDisplay.workAreaSize.width;
  const screenHeight = currentDisplay.workAreaSize.height;
  const screenX = currentDisplay.workArea.x;
  const screenY = currentDisplay.workArea.y;
  const dialogWidth = 720;
  const x = screenX + Math.floor((screenWidth - dialogWidth) / 2);
  const y = screenY + Math.floor(screenHeight * 0.15);
  return { x, y };
}

function createDialogWindow() {
  const existingDialog = getDialogWindow();
  if (existingDialog && !existingDialog.isDestroyed()) {
    const { x, y } = calculateDialogPosition();
    existingDialog.setPosition(x, y);
    existingDialog.show();
    existingDialog.focus();
    return existingDialog;
  }

  setIsFirstResize(true);
  const isDev = !app.isPackaged;
  const { x, y } = calculateDialogPosition();

  const dialogWindow = new BrowserWindow({
    width: 720,
    minWidth: 400,
    maxWidth: 900,
    height: 100,
    minHeight: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    fullscreenable: false,
    movable: false,
    focusable: true,
    hasShadow: true,
    parent: null,
    modal: false,
    visualEffectState: 'active',
    vibrancy: 'popover',
    x,
    y,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    },
    backgroundColor: '#00000000'
  });

  dialogWindow.show();
  dialogWindow.focus();

  try {
    dialogWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    dialogWindow.setAlwaysOnTop(true, 'screen-saver');
  } catch (e) {
    console.warn('Failed to elevate dialog window level:', e.message);
  }

  if (isDev) {
    dialogWindow.loadURL('http://localhost:5173/dialog.html').catch(err => {
      console.error('Failed to load dialog URL:', err);
    });
  } else {
    const appPath = app.getAppPath();
    const dialogPath = path.join(appPath, 'dist', 'dialog.html');
    dialogWindow.loadFile(dialogPath).catch(err => {
      console.error('Failed to load dialog file:', err);
    });
  }

  let blurTimeout;
  dialogWindow.on('blur', () => {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
    }

    blurTimeout = setTimeout(() => {
      if (dialogWindow && !dialogWindow.isDestroyed()) {
        console.log('[DialogWindow] Blur timeout - hiding window');
        dialogWindow.hide();
      }
    }, 300);
  });

  dialogWindow.on('focus', () => {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
  });

  dialogWindow.on('closed', () => {
    setDialogWindow(null);
  });

  setDialogWindow(dialogWindow);
  return dialogWindow;
}

module.exports = {
  createDialogWindow
};
