const { BrowserWindow, nativeImage, app } = require('electron');
const path = require('path');
const { existsSync } = require('fs');
const { setMainWindow } = require('../state/index.js');

function createWindow() {
  let iconPath = path.join(__dirname, '..', '..', 'assets', 'translate_faster.png');
  if (!existsSync(iconPath)) {
    iconPath = path.join(__dirname, '..', '..', 'assets', 'translate_faster.svg');
  }
  const appIcon = nativeImage.createFromPath(iconPath);

  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    transparent: true,
    icon: !appIcon.isEmpty() ? appIcon : undefined,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#00000000',
    vibrancy: 'window',
    visualEffectState: 'active'
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    const loadDevURL = () => {
      console.log('Loading from http://localhost:5173');
      mainWindow.loadURL('http://localhost:5173').catch(err => {
        console.error('Failed to load URL:', err);
      });
    };

    setTimeout(loadDevURL, 500);

    mainWindow.webContents.openDevTools();

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.log('Failed to load:', errorCode, errorDescription, validatedURL);
      if (errorCode === -106 || errorCode === -105) {
        console.log('Retrying in 2 seconds...');
        setTimeout(loadDevURL, 2000);
      }
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('App loaded successfully');
    });
  } else {
    const appPath = app.getAppPath();
    console.log('Production mode - App path:', appPath);
    console.log('Resources path:', process.resourcesPath);
    console.log('__dirname:', __dirname);

    const possiblePaths = [
      path.join(appPath, 'dist', 'index.html'),
      path.join(__dirname, '..', '..', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html')
    ];

    const tryLoadPath = async (index) => {
      if (index >= possiblePaths.length) {
        return;
      }

      const distPath = possiblePaths[index];

      try {
        await mainWindow.loadFile(distPath);
      } catch (err) {
        try {
          const fileUrl = distPath.startsWith('file://') ? distPath : `file://${distPath}`;
          await mainWindow.loadURL(fileUrl);
          console.log(`✅ Successfully loaded via URL: ${distPath}`);
        } catch (err2) {
          tryLoadPath(index + 1);
        }
      }
    };

    tryLoadPath(0);
  }

  setMainWindow(mainWindow);
  return mainWindow;
}

module.exports = {
  createWindow
};
