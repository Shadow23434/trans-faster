const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const { existsSync } = require('fs');
const { getMainWindow } = require('../state/index.js');
const { createDialogWindow } = require('../windows/index.js');
const { getSelectedText } = require('../clipboard/index.js');

let tray = null;

function createTray() {
  let icon = nativeImage.createEmpty();

  if (process.platform === 'darwin') {
    const pngTemplatePath = path.join(__dirname, '..', '..', 'assets', 'tray-icon-template.png');
    if (existsSync(pngTemplatePath)) {
      icon = nativeImage.createFromPath(pngTemplatePath);
      console.log('✓ Loaded tray icon from PNG template');
    }

    if (icon.isEmpty()) {
      const mainPngPath = path.join(__dirname, '..', '..', 'assets', 'translate_faster.png');
      if (existsSync(mainPngPath)) {
        icon = nativeImage.createFromPath(mainPngPath);
        console.log('✓ Loaded tray icon from main PNG');
      }
    }
  } else {
    const pngPath = path.join(__dirname, '..', '..', 'assets', 'translate_faster.png');
    if (existsSync(pngPath)) {
      icon = nativeImage.createFromPath(pngPath);
      console.log('✓ Loaded tray icon from PNG');
    }
  }

  if (process.platform === 'darwin' && !icon.isEmpty()) {
    const resizedIcon = icon.resize({ width: 22, height: 22 });
    resizedIcon.setTemplateImage(true);
    tray = new Tray(resizedIcon);
  } else if (!icon.isEmpty()) {
    const resizedIcon = icon.resize({ width: 16, height: 16 });
    tray = new Tray(resizedIcon);
  } else {
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Translate Selected Text',
      click: async () => {
        try {
          const selectedText = await getSelectedText();
          if (selectedText && selectedText.trim()) {
            createDialogWindow();
          }
        } catch (error) {
          console.error('Error getting selected text:', error);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Translation Tool');
  tray.setContextMenu(contextMenu);

  if (process.platform === 'darwin') {
    tray.on('click', () => {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  }

  return tray;
}

function getTray() {
  return tray;
}

module.exports = {
  createTray,
  getTray
};
