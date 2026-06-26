import type { ProviderId } from './types';

export interface GenerateConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
}

async function generateGemini(
  cfg: GenerateConfig,
  prompt: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text.');
  return text.trim();
}

async function generateDeepSeek(
  cfg: GenerateConfig,
  prompt: string,
): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepSeek API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('DeepSeek returned no text.');
  return text.trim();
}

export async function generate(
  cfg: GenerateConfig,
  prompt: string,
): Promise<string> {
  if (!cfg.apiKey) {
    throw new Error(`No API key set for ${cfg.provider}. Add it in options.`);
  }
  switch (cfg.provider) {
    case 'gemini':
      return generateGemini(cfg, prompt);
    case 'deepseek':
      return generateDeepSeek(cfg, prompt);
    default:
      throw new Error(`Unknown provider: ${cfg.provider as string}`);
  }
}
