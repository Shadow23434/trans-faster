<script>
  import { onMount, onDestroy } from 'svelte';
  import TranslationService from '../services/translation.js';
  
  let inputText = '';
  let translationResult = '';
  let isLoading = false;
  let error = '';
  let inputElement;
  let dialogContentElement;
  let resizeObserver;
  
  const translationService = new TranslationService();
  
  let resizeTimeout;
  let isFirstUpdate = true;
  let screenSize = { width: 0, height: 0 };
  
  async function updateWindowHeight() {
    if (dialogContentElement && window.electronAPI) {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        const offsetHeight = dialogContentElement.offsetHeight - 10;
        const height = offsetHeight;
        window.electronAPI.log('📏 updateWindowHeight - offsetHeight:', offsetHeight, 'calculated height:', height);
        
        if (height > 0) {
          if (isFirstUpdate) {
            isFirstUpdate = false;
            try {
              screenSize = await window.electronAPI.getScreenSize();
              window.electronAPI.log('✅ First resize, calling resizeDialogWindow with height:', height);
              const result = await window.electronAPI.resizeDialogWindow(height);
              window.electronAPI.log('✅ resizeDialogWindow result:', result);
            } catch (err) {
              window.electronAPI.logError('❌ Error in resizeDialogWindow:', err);
              try {
                await window.electronAPI.resizeDialogWindow(height);
              } catch (err2) {
                window.electronAPI.logError('❌ Retry also failed:', err2);
              }
            }
          } else {
            window.electronAPI.log('✅ Subsequent resize, calling resizeDialogWindow with height:', height);
            try {
              const result = await window.electronAPI.resizeDialogWindow(height);
              window.electronAPI.log('✅ resizeDialogWindow result:', result);
            } catch (err) {
              window.electronAPI.logError('❌ Error in resizeDialogWindow:', err);
            }
          }
        } else {
          window.electronAPI.logWarn('⚠️ Height is 0 or negative, skipping resize');
        } 
      }, 50); 
    } else {
      if (window.electronAPI) {
        window.electronAPI.logWarn('⚠️ Cannot update height - missing dialogContentElement or electronAPI');
      }
    }
  }
  
  onMount(() => {
    if (inputElement) {
      inputElement.focus();
    }
    
    if (window.electronAPI) {
      window.electronAPI.onCloseDialog(() => {
        handleClose();
      });
      
      window.electronAPI.onDialogShortcutTranslate((text, autoTranslate) => {
        window.electronAPI.log('Received text from shortcut:', text, 'autoTranslate:', autoTranslate);
        
        inputText = text;
        
        if (autoTranslate && text && text.trim()) {
          setTimeout(() => {
            handleTranslate();
          }, 100);
        }
        
        if (inputElement) {
          inputElement.focus();
          inputElement.select();
        }
      });
    }
    
  });
  
  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
  
  async function handleTranslate() {
    if (!inputText.trim()) {
      translationResult = '';
      return;
    }
    
    isLoading = true;
    error = '';
    translationResult = '';
    
    try {
      const result = await translationService.translate(inputText);
      translationResult = result;
    } catch (err) {
      error = err.message || 'Translation error';
    } finally {
      isLoading = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleTranslate();
    } else if (event.key === 'Escape') {
      handleClose();
    }
  }
  
  function handleClose(event) {
    if (event && event.target && event.target.closest('.dialog-content')) {
      return;
    }
    if (window.electronAPI) {
      window.electronAPI.closeDialogWindow();
    }
  }
  
  let translateTimeout;
  $: if (inputText && inputText.trim()) {
    clearTimeout(translateTimeout);
    translateTimeout = setTimeout(() => {
      handleTranslate();
    }, 500);
  }
  
  $: if (translationResult || error || isLoading || inputText) {
    setTimeout(() => {
      updateWindowHeight();
    }, 50);
  }
</script>

<div class="dialog-content" bind:this={dialogContentElement} role="dialog" aria-label="Translation dialog">
    <div class="input-section">
      <input
        bind:this={inputElement}
        type="text"
        bind:value={inputText}
        on:keydown={handleKeyPress}
        placeholder="Enter English text to translate..."
        class="search-input"
        autocomplete="off"
      />
      {#if isLoading}
        <div class="loading-indicator"></div>
      {/if}
    </div>
    
    {#if error}
      <div class="result-section error-section">
        <div class="error-message">⚠️ {error}</div>
      </div>
    {:else if translationResult}
      <div class="result-section">
        <div class="result-item" role="presentation">
          <div class="result-text">{translationResult}</div>
        </div>
      </div>
    {:else if inputText && !isLoading}
      <div class="result-section empty-section">
        <div class="empty-message">Press Enter to translate...</div>
      </div>
    {/if}
    
    <div class="footer">
      <span class="footer-hint">Press <kbd>Enter</kbd> to translate</span>
      <span class="footer-hint">Press <kbd>Esc</kbd> to close</span>
    </div>
  </div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  
  :global(html) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  
  :global(#dialog-app) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }
  
  .dialog-content {
    position: relative;
    width: 100%;
    min-height: 120px;
    background: rgba(28, 28, 30, 0.85);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }
  
  .input-section {
    position: relative;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .search-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #f5f5f7;
    font-size: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 0;
    margin: 0;
  }
  
  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .loading-indicator {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: translateY(-50%) rotate(360deg); }
  }
  
  .result-section {
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
  }
  
  .result-item {
    padding: 12px 20px;
    cursor: default;
    transition: background-color 0.15s;
  }
  
  .result-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .result-text {
    color: #f5f5f7;
    font-size: 15px;
    line-height: 1.5;
    word-wrap: break-word;
  }
  
  .error-section {
    padding: 16px 20px;
  }
  
  .error-message {
    color: #ff6b6b;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .empty-section {
    padding: 16px 20px;
  }
  
  .empty-message {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    text-align: center;
  }
  
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
  }
  
  .footer-hint {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  kbd {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
    color: rgba(255, 255, 255, 0.8);
  }
  
  /* Scrollbar styling */
  .result-section::-webkit-scrollbar {
    width: 8px;
  }
  
  .result-section::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .result-section::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
  
  .result-section::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
