const { clipboard } = require('electron');
const { exec } = require('child_process');

function getSelectedText() {
  return new Promise((resolve) => {
    if (process.platform === 'darwin') {
      const previousClipboard = clipboard.readText();
      console.log('Previous clipboard:', previousClipboard ? previousClipboard.substring(0, 30) + '...' : '(empty)');

      const copyScript = `
        tell application "System Events"
          keystroke "c" using command down
        end tell
      `;

      console.log('Executing AppleScript to copy selected text...');
      exec(`osascript -e '${copyScript}'`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ AppleScript error:', error.message);
          console.error('stderr:', stderr);

          if (stderr && (stderr.includes('not allowed') || stderr.includes('denied'))) {
            console.error('⚠️ Accessibility permission required!');
            console.error('Please grant permission in: System Settings > Privacy & Security > Accessibility');
          }
        }

        let attempts = 0;
        const maxAttempts = 6;
        const checkClipboard = () => {
          attempts++;
          const newClipboard = clipboard.readText();

          if (newClipboard && newClipboard !== previousClipboard) {
            console.log(`✅ Clipboard updated on attempt ${attempts}!`);
            resolve(newClipboard);
            return;
          }

          if (attempts < maxAttempts) {
            const delay = 100 + (attempts * 50);
            setTimeout(checkClipboard, delay);
          } else {
            if (newClipboard && newClipboard.trim()) {
              console.log('⚠️ Using clipboard content (may not be newly selected text)');
              resolve(newClipboard);
            } else {
              console.log('❌ No text found in clipboard');
              resolve('');
            }
          }
        };

        setTimeout(checkClipboard, 100);
      });
    } else {
      const text = clipboard.readText();
      resolve(text || '');
    }
  });
}

module.exports = {
  getSelectedText
};
