<script>
  import { onMount } from 'svelte';
  import TranslationService from './services/translation.js';
  import Settings from './components/Settings.svelte';
  
  let inputText = '';
  let outputText = '';
  let isLoading = false;
  let error = '';
  let activeTab = 'dich'; // 'dich' or 'setting'
  
  const translationService = new TranslationService();
  
  onMount(async () => {
    // Check if running in Electron
    if (window.electronAPI) {
      // Listen for shortcut translations
      window.electronAPI.onShortcutTranslate(async (text, autoTranslate = false) => {
        console.log('📥 Received shortcut translate:', {
          textLength: text ? text.length : 0,
          autoTranslate: autoTranslate
        });
        
        if (text) {
          inputText = text;
          error = '';
          outputText = '';
          // Switch to translate tab when receiving text
          activeTab = 'dich';
          console.log('✅ Text set to input field');
          
          // If auto-translate, set loading state immediately
          if (autoTranslate) {
            isLoading = true;
            console.log('⚡ Auto-translate started, waiting for result...');
          } else {
            console.log('ℹ️ Auto-translate disabled, waiting for manual translate');
          }
        } else {
          console.warn('⚠️ No text received');
        }
      });
      
      // Listen for translation result (when auto-translate completes)
      window.electronAPI.onTranslationResult((translation) => {
        console.log('📥 Received translation result');
        outputText = translation;
        isLoading = false;
      });
      
      // Listen for translation errors
      window.electronAPI.onTranslationError((errorMessage) => {
        console.error('📥 Translation error:', errorMessage);
        error = errorMessage;
        isLoading = false;
      });
    }
  });
  
  async function translate(text = inputText) {
    if (!text.trim()) {
      error = 'Please enter text to translate';
      return;
    }
    
    isLoading = true;
    error = '';
    outputText = '';
    
    try {
      const result = await translationService.translate(text);
      outputText = result;
    } catch (err) {
      error = err.message || 'An error occurred while translating';
      console.error('Translation error:', err);
    } finally {
      isLoading = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      translate();
    }
  }
</script>

<main>
  <div class="app-container">
    <nav class="tab-navigation">
      <button 
        class="tab-button" 
        class:active={activeTab === 'dich'}
        on:click={() => activeTab = 'dich'}
      >
        <span class="tab-icon">🌐</span>
        <span class="tab-label">Translate</span>
      </button>
      <button 
        class="tab-button" 
        class:active={activeTab === 'setting'}
        on:click={() => activeTab = 'setting'}
      >
        <span class="tab-icon">⚙️</span>
        <span class="tab-label">Setting</span>
      </button>
    </nav>
    
    <div class="tab-content">
      {#if activeTab === 'dich'}
        <div class="translate-tab">
          <div class="container">
            <h1>Translation Faster</h1>
            <p class="subtitle">Translate English to Vietnamese using GPT</p>
            
            <div class="input-section">
              <label for="input">English Text:</label>
              <textarea
                id="input"
                bind:value={inputText}
                placeholder="Enter English text to translate or select text and press shortcut..."
                onkeydown={handleKeyPress}
                rows="6"
              ></textarea>
            </div>
            
            <div class="button-section">
              <button 
                on:click={() => translate()} 
                disabled={isLoading || !inputText.trim()}
                class="translate-btn"
              >
                {isLoading ? 'Translating...' : 'Translate'}
              </button>
              {#if inputText}
                <button 
                  on:click={() => { inputText = ''; outputText = ''; error = ''; }}
                  class="clear-btn"
                >
                  Clear
                </button>
              {/if}
            </div>
            
            {#if error}
              <div class="error">
                ⚠️ {error}
              </div>
            {/if}
            
            <div class="output-section">
              <label for="output">Translation Result (Vietnamese):</label>
              <textarea
                id="output"
                value={outputText}
                placeholder={isLoading ? 'Translating...' : 'Translation result will appear here'}
                readonly
                rows="6"
              ></textarea>
            </div>
          </div>
        </div>
      {:else if activeTab === 'setting'}
        <div class="settings-tab">
          <Settings />
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
  
  .tab-navigation {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: #1a1a1a;
    -webkit-app-region: drag;
    user-select: none;
  }
  
  .tab-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s;
    min-width: 60px;
    -webkit-app-region: no-drag;
  }
  
  .tab-button:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .tab-button.active {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-weight: 600;
  }
  
  .tab-icon {
    font-size: 1.25rem;
    line-height: 1;
  }
  
  .tab-label {
    line-height: 1.2;
    font-size: 0.6875rem;
    letter-spacing: 0.01em;
  }
  
  .tab-content {
    flex: 1;
    overflow-y: auto;
    background: #1a1a1a;
  }
  
  .translate-tab,
  .settings-tab {
    height: 100%;
    padding: 2rem;
  }
  
  .container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #ffffff;
  }
  
  .subtitle {
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 1rem;
  }
  
  .input-section,
  .output-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  label {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }
  
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
  
  textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  textarea:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }
  
  textarea[readonly] {
    background-color: rgba(255, 255, 255, 0.03);
    cursor: default;
  }
  
  .button-section {
    display: flex;
    gap: 1rem;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .translate-btn {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    flex: 1;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .translate-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .translate-btn:disabled {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.4);
    cursor: not-allowed;
    border-color: rgba(255, 255, 255, 0.05);
  }
  
  .clear-btn {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .clear-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    padding: 1rem;
    border-radius: 8px;
  }
</style>

