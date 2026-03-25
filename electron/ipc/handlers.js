const { ipcMain, globalShortcut, screen, BrowserWindow } = require('electron');
const store = require('../config/store.js');
const {
  getMainWindow,
  getDialogWindow,
  setDialogWindow,
  getIsFirstResize,
  setIsFirstResize
} = require('../state/index.js');
const { registerShortcut } = require('../shortcuts/index.js');
const { translateText } = require('../openai/index.js');
const { exec } = require('child_process');

function setupShortcutHandlers() {
  ipcMain.on('update-shortcut', (event, newShortcut) => {
    const status = registerShortcut(newShortcut);
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('shortcut-status', status);
    }
  });

  ipcMain.handle('get-shortcut-status', () => {
    const shortcut = store.get('custom_shortcut') || 'CommandOrControl+Shift+T';
    const readable = shortcut
      .replace('CommandOrControl', 'Cmd/Ctrl')
      .replace('Command', 'Cmd')
      .replace('Control', 'Ctrl')
      .replace(/\+/g, '+');
    return readable;
  });

  ipcMain.handle('get-shortcut-raw', () => {
    return store.get('custom_shortcut') || 'CommandOrControl+Shift+T';
  });

  ipcMain.handle('set-shortcut', async (event, shortcut) => {
    console.log('Setting new shortcut:', shortcut);

    globalShortcut.unregisterAll();

    const ret = globalShortcut.register(shortcut, () => {
      console.log('Test shortcut triggered');
    });

    if (!ret) {
      console.error('❌ Cannot register shortcut:', shortcut);
      console.error('💡 This shortcut may be already used by:');
      console.error('   - System shortcuts (like Cmd+T for new tab in browsers)');
      console.error('   - Other applications');
      console.error('   - macOS system shortcuts');

      globalShortcut.unregisterAll();

      throw new Error(`Không thể đăng ký phím tắt "${shortcut}". Có thể đã bị trùng với phím tắt hệ thống hoặc ứng dụng khác. Hãy thử phím tắt khác như Cmd+Shift+V hoặc Cmd+Option+T.`);
    }

    globalShortcut.unregisterAll();

    store.set('custom_shortcut', shortcut);
    console.log('✅ Shortcut saved to store:', shortcut);

    const status = registerShortcut(shortcut);
    console.log('✅ Shortcut registered with handler:', status);

    return true;
  });
}

function setupDialogHandlers() {
  ipcMain.on('renderer-log', (event, level, ...args) => {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    switch (level) {
      case 'error':
        console.error(`[Renderer] ${message}`);
        break;
      case 'warn':
        console.warn(`[Renderer] ${message}`);
        break;
      default:
        console.log(`[Renderer] ${message}`);
    }
  });

  ipcMain.handle('close-dialog-window', () => {
    const dialogWindow = getDialogWindow();
    if (dialogWindow && !dialogWindow.isDestroyed()) {
      dialogWindow.hide();
    }
    return true;
  });

  ipcMain.handle('resize-dialog-window', (event, height) => {
    let dialogWindow = getDialogWindow();

    if (!dialogWindow && event.sender) {
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      if (senderWindow && !senderWindow.isDestroyed()) {
        const mainWindow = getMainWindow();
        if (senderWindow !== mainWindow) {
          dialogWindow = senderWindow;
          console.log('[Main] Found dialog window from event sender');
        }
      }
    }

    if (!dialogWindow) {
      const allWindows = BrowserWindow.getAllWindows();
      const mainWindow = getMainWindow();
      for (const win of allWindows) {
        if (win !== mainWindow && !win.isDestroyed()) {
          const [width, winHeight] = win.getSize();
          if (width <= 900 && winHeight <= 600) {
            dialogWindow = win;
            setDialogWindow(win);
            break;
          }
        }
      }
    }

    if (!dialogWindow) {
      console.error('[Main] ❌ dialogWindow is null! Trying to get from state or windows...');
      console.error('[Main] All windows:', BrowserWindow.getAllWindows().map(w => ({
        id: w.id,
        visible: w.isVisible(),
        destroyed: w.isDestroyed()
      })));
      return false;
    }

    if (dialogWindow.isDestroyed()) {
      console.error('[Main] ❌ dialogWindow is destroyed!');
      return false;
    }

    if (height <= 0) {
      console.warn(`[Main] ⚠️ Invalid height: ${height}`);
      return false;
    }

    try {
      const [currentWidth] = dialogWindow.getSize();
      const newHeight = Math.ceil(height) + 10;

      const wasResizable = dialogWindow.isResizable();
      if (!wasResizable) {
        console.log('[Main] Temporarily enabling resizable...');
        dialogWindow.setResizable(true);
      }

      if (getIsFirstResize()) {
        setIsFirstResize(false);
        console.log('[Main] First resize - setting size and showing window');
        dialogWindow.setSize(currentWidth, newHeight, false);

        if (!dialogWindow.isVisible()) {
          dialogWindow.show();
          dialogWindow.focus();
          dialogWindow.setAlwaysOnTop(true, 'screen-saver');
        }
      } else {
        console.log('[Main] Subsequent resize - setting size only');
        dialogWindow.setSize(currentWidth, newHeight, false);
      }

      if (!wasResizable) {
        dialogWindow.setResizable(false);
        console.log('[Main] Resizable disabled again');
      }

      const [actualWidth, actualHeight] = dialogWindow.getSize();
      console.log(`[Main] ✅ Size after setSize: ${actualWidth}x${actualHeight}`);

      if (actualHeight !== newHeight) {
        console.error(`[Main] ❌ Size mismatch! Expected: ${newHeight}, Got: ${actualHeight}`);
      }

      return true;
    } catch (error) {
      console.error('[Main] ❌ Error resizing window:', error);
      return false;
    }
  });

  ipcMain.handle('set-dialog-window-position', (event, x, y) => {
    const dialogWindow = getDialogWindow();
    if (dialogWindow && !dialogWindow.isDestroyed()) {
      dialogWindow.setPosition(x, y);
    }
    return true;
  });

  ipcMain.handle('get-screen-size', () => {
    const cursorPoint = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
    const { width, height } = currentDisplay.workAreaSize;
    return { width, height };
  });
}

function setupAPIHandlers() {
  ipcMain.handle('translate-text', async (event, text) => {
    try {
      return await translateText(text);
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(error.message || 'Lỗi khi dịch');
    }
  });
}

function setupTestHandlers() {
  ipcMain.handle('test-applescript', async () => {
    return new Promise((resolve) => {
      if (process.platform !== 'darwin') {
        resolve({ success: false, message: 'Only available on macOS' });
        return;
      }

      const script = `
        tell application "System Events"
          try
            keystroke "c" using command down
            return "SUCCESS"
          on error errMsg
            return "ERROR: " & errMsg
          end try
        end tell
      `;

      exec(`osascript -e '${script}'`, { timeout: 2000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            message: error.message,
            stderr,
            hasPermission: !stderr || !stderr.includes('not allowed')
          });
        } else {
          resolve({
            success: true,
            message: 'AppleScript executed successfully',
            stdout
          });
        }
      });
    });
  });
}

function setupAllHandlers() {
  setupShortcutHandlers();
  setupDialogHandlers();
  setupAPIHandlers();
  setupTestHandlers();
}

module.exports = {
  setupShortcutHandlers,
  setupDialogHandlers,
  setupAPIHandlers,
  setupTestHandlers,
  setupAllHandlers
};
