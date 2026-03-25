const { OpenAI } = require('openai');
const { getOpenAIClient, setOpenAIClient } = require('../state/index.js');

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo';

function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() || '',
    baseURL: process.env.OPENAI_BASE_URL?.trim() || DEFAULT_OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
  };
}

function createClient(apiKey = getOpenAIConfig().apiKey) {
  if (!apiKey) {
    return null;
  }

  const { baseURL } = getOpenAIConfig();
  const client = new OpenAI({ apiKey, baseURL });
  setOpenAIClient(client);
  return client;
}

function initializeOpenAI() {
  createClient();
}

function getClient() {
  let client = getOpenAIClient();
  if (!client) {
    client = createClient();
  }
  return client;
}

module.exports = {
  initializeOpenAI,
  getClient,
  createClient,
  getOpenAIConfig
};
