<script>
  import { onMount } from 'svelte';

  let message = '';
  let messageType = ''; // 'success' or 'error'
  let testingPermission = false;
  let shortcut = 'CommandOrControl+Shift+T';
  let shortcutDisplay = '';
  let testingShortcut = false;
  const configExample = `OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo`;

  const shortcutOptions = [
    { value: 'CommandOrControl+T', label: 'Cmd/Ctrl+T (auto translate)' },
    { value: 'CommandOrControl+Shift+T', label: 'Cmd/Ctrl+Shift+T (default)' },
    { value: 'CommandOrControl+Shift+V', label: 'Cmd/Ctrl+Shift+V' },
    { value: 'CommandOrControl+Option+T', label: 'Cmd/Ctrl+Option+T' },
    { value: 'CommandOrControl+Option+V', label: 'Cmd/Ctrl+Option+V' },
    { value: 'CommandOrControl+F12', label: 'Cmd/Ctrl+F12' },
    { value: 'CommandOrControl+Shift+F12', label: 'Cmd/Ctrl+Shift+F12' },
  ];

  onMount(async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      const rawShortcut = await window.electronAPI.getShortcutRaw();
      if (rawShortcut) {
        shortcut = rawShortcut;
      }

      const displayShortcut = await window.electronAPI.getShortcutStatus();
      shortcutDisplay = displayShortcut;

      if (typeof window.electronAPI.setShortcut !== 'function') {
        console.warn('setShortcut function not found. Please restart the app.');
      }
    } catch (err) {
      console.error('Error getting settings:', err);
    }
  });

  function showMessage(msg, type) {
    message = msg;
    messageType = type;
    setTimeout(() => {
      message = '';
      messageType = '';
    }, 3000);
  }

  async function testAppleScript() {
    if (!window.electronAPI) {
      showMessage('Only works in Electron app', 'error');
      return;
    }

    testingPermission = true;
    try {
      const result = await window.electronAPI.testAppleScript();
      if (result.success) {
        showMessage('AppleScript works well. Accessibility permission has been granted.', 'success');
      } else {
        if (result.hasPermission === false) {
          showMessage('Need to grant Accessibility permission. Go to System Settings > Privacy & Security > Accessibility', 'error');
        } else {
          showMessage('AppleScript error: ' + result.message, 'error');
        }
      }
    } catch (err) {
      showMessage('Error testing: ' + err.message, 'error');
    } finally {
      testingPermission = false;
    }
  }

  async function saveShortcut() {
    if (!window.electronAPI) {
      showMessage('Only works in Electron app', 'error');
      return;
    }

    if (typeof window.electronAPI.setShortcut !== 'function') {
      showMessage('setShortcut function does not exist. Please restart app.', 'error');
      console.error('electronAPI.setShortcut is not a function. Available methods:', Object.keys(window.electronAPI || {}));
      return;
    }

    testingShortcut = true;
    try {
      await window.electronAPI.setShortcut(shortcut);
      const displayShortcut = await window.electronAPI.getShortcutStatus();
      shortcutDisplay = displayShortcut;
      showMessage('New shortcut saved: ' + displayShortcut, 'success');

      if (shortcut === 'CommandOrControl+T') {
        setTimeout(() => {
          showMessage('Note: Cmd+T may conflict with the new tab shortcut in browsers. If it does not work, try another shortcut.', 'error');
        }, 3000);
      }
    } catch (err) {
      showMessage('Error: ' + err.message, 'error');
      console.error('Error setting shortcut:', err);
    } finally {
      testingShortcut = false;
    }
  }

  function formatShortcut(value) {
    return value
      .replace('CommandOrControl', 'Cmd/Ctrl')
      .replace('Command', 'Cmd')
      .replace('Control', 'Ctrl')
      .replace(/\+/g, '+');
  }
</script>

<div class="settings-container">
  <div class="settings-content">
    <div class="settings-header">
      <h2>Settings</h2>
    </div>

    <div class="settings-body">
      <div class="form-group">
        <div class="label-text">OpenAI Configuration</div>
        <div class="config-card">
          <p class="hint">
            API key, base URL, and model are now loaded from <code>.env</code> in the project root.
            Translation requests only run through the Electron main process.
          </p>
          <pre class="config-example">{configExample}</pre>
          <p class="hint">
            Update <code>.env</code> and restart the app after changing these values.
          </p>
          <p class="hint">
            Get your API key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a>
          </p>
        </div>
      </div>

      {#if window.electronAPI}
        <div class="form-group">
          <label for="shortcut">Translation Shortcut:</label>
          <select
            id="shortcut"
            bind:value={shortcut}
            class="shortcut-select"
            disabled={testingShortcut}
          >
            {#each shortcutOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <p class="hint">
            Current shortcut: <strong>{shortcutDisplay || formatShortcut(shortcut)}</strong>
          </p>
          <button
            on:click={saveShortcut}
            disabled={testingShortcut}
            class="test-btn"
          >
            {testingShortcut ? 'Saving...' : 'Save Shortcut'}
          </button>
          <p class="hint">
            Select a shortcut and click "Save" to apply. The shortcut will work immediately after saving.
          </p>
        </div>

        <div class="form-group">
          <div class="label-text">Check Accessibility Permission:</div>
          <button
            on:click={testAppleScript}
            disabled={testingPermission}
            class="test-btn"
          >
            {testingPermission ? 'Testing...' : 'Test AppleScript'}
          </button>
          <p class="hint">
            This button will check if the app has Accessibility permission to automatically copy text.
            If the test fails, you need to grant permission in System Settings.
          </p>
        </div>
      {/if}

      {#if message}
        <div class="message {messageType}">
          {message}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .settings-content {
    background: transparent;
    border-radius: 12px;
    padding: 0;
    width: 100%;
  }

  .settings-header {
    padding: 1.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .settings-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #ffffff;
  }

  .settings-body {
    padding: 2rem 0;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  .label-text {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  .config-card {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
  }

  .config-example {
    margin: 0.75rem 0;
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.25);
    color: #ffffff;
    font-size: 0.9rem;
    line-height: 1.5;
    overflow-x: auto;
  }

  .hint {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .hint code {
    font-family: monospace;
    color: rgba(255, 255, 255, 0.85);
  }

  .hint a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
  }

  .hint a:hover {
    text-decoration: underline;
    color: #ffffff;
  }

  .message {
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .message.success {
    background: rgba(16, 185, 129, 0.15);
    color: #6ee7b7;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .message.error {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .test-btn {
    padding: 0.75rem 1.5rem;
    background: rgba(16, 185, 129, 0.2);
    color: #ffffff;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    margin-top: 0.5rem;
  }

  .test-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.3);
    border-color: rgba(16, 185, 129, 0.4);
  }

  .test-btn:disabled {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.4);
    cursor: not-allowed;
    border-color: rgba(255, 255, 255, 0.05);
  }

  .shortcut-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    cursor: pointer;
  }

  .shortcut-select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }

  .shortcut-select:disabled {
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.4);
    cursor: not-allowed;
  }

  .shortcut-select option {
    background: #1a1a1a;
    color: #ffffff;
  }
</style>
