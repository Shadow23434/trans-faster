const { app, BrowserWindow, globalShortcut, nativeImage } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { existsSync } = require('fs');
const { createWindow } = require('./windows/index.js');
const { initializeOpenAI } = require('./openai/index.js');
const { checkAccessibilityPermission } = require('./clipboard/index.js');
const { registerShortcut, registerDialogShortcut } = require('./shortcuts/index.js');
const { setupAllHandlers } = require('./ipc/index.js');
const { getMainWindow, setTray } = require('./state/index.js');
const { createTray } = require('./tray/index.js');

app.whenReady().then(async () => {
  let iconPath = path.join(__dirname, '..', 'assets', 'translate_faster.png');
  if (!existsSync(iconPath)) {
    iconPath = path.join(__dirname, '..', 'assets', 'translate_faster.svg');
  }

  const appIcon = nativeImage.createFromPath(iconPath);
  if (!appIcon.isEmpty() && process.platform === 'darwin') {
    app.dock?.setIcon(appIcon);
    console.log('✓ Set app icon for dock');
  } else {
    console.warn('⚠ App icon not found or empty:', iconPath);
  }

  createWindow();
  initializeOpenAI();

  if (process.platform === 'darwin') {
    const hasPermission = await checkAccessibilityPermission();
    if (!hasPermission) {
      console.warn('⚠️ Accessibility permission may be required for automatic text selection');
      console.warn('Go to: System Settings > Privacy & Security > Accessibility');
    }
  }

  const shortcutStatus = registerShortcut();
  registerDialogShortcut();
  setupAllHandlers();

  const tray = createTray();
  setTray(tray);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      registerShortcut();
    }
  });

  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('shortcut-status', shortcutStatus);
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
