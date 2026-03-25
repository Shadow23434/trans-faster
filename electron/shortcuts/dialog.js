const { globalShortcut } = require('electron');
const { createDialogWindow } = require('../windows/index.js');

function registerDialogShortcut() {
  const dialogShortcut = globalShortcut.register('CommandOrControl+Shift+Y', () => {
    const dialog = createDialogWindow();
    dialog.show();
    dialog.focus();
  });

  if (!dialogShortcut) {
    return false;
  }

  return true;
}

module.exports = {
  registerDialogShortcut
};
