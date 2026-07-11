import type { BgRequest, BgResponse } from '../lib/messages';
import { buildPrompt } from '../lib/prompt';
import { generate } from '../lib/providers';
import { getSecrets, getSettings } from '../lib/storage';

async function handleGenerate(req: BgRequest): Promise<BgResponse> {
  try {
    const [settings, secrets] = await Promise.all([
      getSettings(),
      getSecrets(),
    ]);

    const angle = settings.angles.find((a) => a.id === req.angleId);
    if (!angle) {
      return { ok: false, error: `Unknown angle: ${req.angleId}` };
    }

    const prompt = buildPrompt(req.profile, angle, settings.tone);

    const text = await generate(
      {
        provider: settings.provider,
        apiKey:
          settings.provider === 'gemini'
            ? secrets.geminiKey
            : secrets.deepseekKey,
        model:
          settings.provider === 'gemini'
            ? settings.geminiModel
            : settings.deepseekModel,
      },
      prompt,
    );

    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

chrome.runtime.onMessage.addListener((msg: BgRequest, _sender, sendResponse) => {
  if (msg?.type !== 'GENERATE') return false;
  handleGenerate(msg).then(sendResponse);
  return true; // keep the channel open for the async response
});
