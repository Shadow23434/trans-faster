const { exec } = require('child_process');

function checkAccessibilityPermission() {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') {
      resolve(true);
      return;
    }

    const script = `
      tell application "System Events"
        try
          set frontApp to name of first application process whose frontmost is true
          return frontApp
        on error
          return "ERROR"
        end try
      end tell
    `;

    exec(`osascript -e '${script}'`, (error, stdout) => {
      if (error || stdout.trim() === 'ERROR') {
        console.warn('Accessibility permission may not be granted');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  checkAccessibilityPermission
};
