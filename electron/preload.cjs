const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Shortcut status
  getShortcutStatus: () => ipcRenderer.invoke('get-shortcut-status'),
  getShortcutRaw: () => ipcRenderer.invoke('get-shortcut-raw'),
  setShortcut: (shortcut) => ipcRenderer.invoke('set-shortcut', shortcut),
  
  // Translation
  translateText: (text) => ipcRenderer.invoke('translate-text', text),
  
  // Listen for shortcut translations (for main window)
  onShortcutTranslate: (callback) => {
    ipcRenderer.on('shortcut-translate', (event, text, autoTranslate) => callback(text, autoTranslate));
  },
  
  // Listen for shortcut translations (for dialog window - same event name, but sent to different window)
  onDialogShortcutTranslate: (callback) => {
    ipcRenderer.on('shortcut-translate', (event, text, autoTranslate) => callback(text, autoTranslate));
  },
  
  // Listen for translation result
  onTranslationResult: (callback) => {
    ipcRenderer.on('translation-result', (event, translation) => callback(translation));
  },
  
  // Listen for translation errors
  onTranslationError: (callback) => {
    ipcRenderer.on('translation-error', (event, errorMessage) => callback(errorMessage));
  },
  
  // Listen for shortcut status
  onShortcutStatus: (callback) => {
    ipcRenderer.on('shortcut-status', (event, status) => callback(status));
  },
  
  // Test AppleScript
  testAppleScript: () => ipcRenderer.invoke('test-applescript'),

  onCloseDialog: (callback) => {
    ipcRenderer.on('close-dialog', () => callback());
  },

  closeDialogWindow: () => ipcRenderer.invoke('close-dialog-window'),
  
  // Resize dialog window
  resizeDialogWindow: (height) => ipcRenderer.invoke('resize-dialog-window', height),
  
  // Set dialog window position (giống Spotlight - center X, Y khoảng 20-25% từ top)
  setDialogWindowPosition: (x, y) => ipcRenderer.invoke('set-dialog-window-position', x, y),
  
  // Get screen size để tính toán position
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  
  // Log to terminal (main process)
  log: (...args) => {
    ipcRenderer.send('renderer-log', 'log', ...args);
  },
  logError: (...args) => {
    ipcRenderer.send('renderer-log', 'error', ...args);
  },
  logWarn: (...args) => {
    ipcRenderer.send('renderer-log', 'warn', ...args);
  },
});

