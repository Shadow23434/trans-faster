const { getClient, getOpenAIConfig } = require('./client.js');

async function translateText(text) {
  const client = getClient();

  if (!client) {
    throw new Error('OPENAI_API_KEY chưa được cấu hình trong file .env');
  }

  const { model } = getOpenAIConfig();
  const prompt = `Translate the following English text to Vietnamese. Only provide the translation, no explanations or additional text:\n\n${text}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a professional translator. Translate English to Vietnamese accurately and naturally.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });

  return response.choices[0]?.message?.content?.trim() || 'Không thể dịch được';
}

module.exports = {
  translateText
};
