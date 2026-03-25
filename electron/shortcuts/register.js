const { globalShortcut } = require('electron');
const store = require('../config/store.js');
const { getSelectedText } = require('../clipboard/index.js');
const { createDialogWindow } = require('../windows/index.js');

function registerShortcut(customShortcut = null) {
  const defaultShortcut = 'CommandOrControl+Shift+T';
  const shortcut = customShortcut || store.get('custom_shortcut') || defaultShortcut;
  const autoTranslate = shortcut === 'CommandOrControl+T';

  globalShortcut.unregisterAll();

  const ret = globalShortcut.register(shortcut, async () => {
    try {
      const selectedText = await getSelectedText();
      const dialog = createDialogWindow();

      if (selectedText && selectedText.trim()) {
        const sendText = () => {
          if (dialog && !dialog.isDestroyed() && dialog.webContents) {
            try {
              dialog.webContents.send('shortcut-translate', selectedText, autoTranslate);
            } catch (err) {
              console.error('Error sending text to dialog:', err);
            }
          }
        };

        if (dialog.webContents && !dialog.webContents.isLoading()) {
          sendText();
        } else {
          const timeoutId = setTimeout(sendText, 300);
          dialog.webContents.once('did-finish-load', () => {
            clearTimeout(timeoutId);
            sendText();
          });
        }
      }
    } catch (error) {
      console.error('Error in shortcut handler:', error);
      const dialog = createDialogWindow();
      if (dialog && !dialog.isDestroyed()) {
        dialog.show();
        dialog.focus();
      }
    }
  });

  if (!ret) {
    globalShortcut.unregisterAll();
    const retry = globalShortcut.register(shortcut, async () => {});

    if (!retry) {
      return `❌ Không thể đăng ký phím tắt: ${shortcut}. Có thể đã bị trùng.`;
    }
  }

  const readable = shortcut
    .replace('CommandOrControl', 'Cmd/Ctrl')
    .replace('Command', 'Cmd')
    .replace('Control', 'Ctrl')
    .replace(/\+/g, '+');

  return readable;
}

module.exports = {
  registerShortcut
};
