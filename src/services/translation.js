class TranslationService {
  async translate(text) {
    const electronAPI = typeof window === 'undefined' ? undefined : window['electronAPI'];

    if (!electronAPI) {
      throw new Error('Translation only works inside the Electron app');
    }

    try {
      return await electronAPI.translateText(text);
    } catch (error) {
      throw new Error(error.message || 'Translation error');
    }
  }
}

export default TranslationService;
