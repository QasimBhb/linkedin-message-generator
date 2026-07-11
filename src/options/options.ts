import {
  DEFAULT_SETTINGS,
  getSecrets,
  getSettings,
  setSecrets,
  setSettings,
} from '../lib/storage';
import type { Angle, ProviderId } from '../lib/types';

const providerGeminiEl = document.getElementById(
  'provider-gemini',
) as HTMLInputElement;
const providerDeepseekEl = document.getElementById(
  'provider-deepseek',
) as HTMLInputElement;
const geminiKeyEl = document.getElementById('gemini-key') as HTMLInputElement;
const deepseekKeyEl = document.getElementById(
  'deepseek-key',
) as HTMLInputElement;
const geminiModelEl = document.getElementById(
  'gemini-model',
) as HTMLInputElement;
const deepseekModelEl = document.getElementById(
  'deepseek-model',
) as HTMLInputElement;
const toneEl = document.getElementById('tone') as HTMLTextAreaElement;
const angleListEl = document.getElementById('angle-list') as HTMLDivElement;
const addAngleBtnEl = document.getElementById(
  'add-angle-btn',
) as HTMLButtonElement;
const saveBtnEl = document.getElementById('save-btn') as HTMLButtonElement;
const resetBtnEl = document.getElementById('reset-btn') as HTMLButtonElement;
const saveFeedbackEl = document.getElementById(
  'save-feedback',
) as HTMLSpanElement;
const errorAreaEl = document.getElementById('error-area') as HTMLDivElement;

let angles: Angle[] = [];

function showError(message: string): void {
  errorAreaEl.textContent = message;
  errorAreaEl.classList.remove('hidden');
}

function clearError(): void {
  errorAreaEl.textContent = '';
  errorAreaEl.classList.add('hidden');
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueId(base: string, excludeIndex: number): string {
  const taken = new Set(
    angles.filter((_, i) => i !== excludeIndex).map((a) => a.id),
  );
  let candidate = base || 'angle';
  let suffix = 2;
  while (taken.has(candidate) || candidate === '') {
    candidate = `${base || 'angle'}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function renderAngles(): void {
  angleListEl.innerHTML = '';

  angles.forEach((angle, index) => {
    const item = document.createElement('div');
    item.className = 'angle-item';

    const row = document.createElement('div');
    row.className = 'angle-item__row';

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'field__control angle-item__label-input';
    labelInput.value = angle.label;
    labelInput.placeholder = 'Angle label';
    labelInput.addEventListener('input', () => {
      angle.label = labelInput.value;
      const newId = uniqueId(slugify(labelInput.value), index);
      angle.id = newId;
      idEl.textContent = `id: ${newId}`;
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      angles.splice(index, 1);
      renderAngles();
    });

    row.appendChild(labelInput);
    row.appendChild(deleteBtn);

    const templateEl = document.createElement('textarea');
    templateEl.className = 'angle-item__template';
    templateEl.value = angle.template;
    templateEl.placeholder = 'Prompt template';
    templateEl.addEventListener('input', () => {
      angle.template = templateEl.value;
    });

    const idEl = document.createElement('div');
    idEl.className = 'angle-item__id';
    idEl.textContent = `id: ${angle.id}`;

    item.appendChild(row);
    item.appendChild(templateEl);
    item.appendChild(idEl);
    angleListEl.appendChild(item);
  });
}

function addAngle(): void {
  const label = 'New angle';
  const id = uniqueId(slugify(label), -1);
  angles.push({ id, label, template: '' });
  renderAngles();
}

async function init(): Promise<void> {
  const [settings, secrets] = await Promise.all([getSettings(), getSecrets()]);

  providerGeminiEl.checked = settings.provider === 'gemini';
  providerDeepseekEl.checked = settings.provider === 'deepseek';
  geminiKeyEl.value = secrets.geminiKey;
  deepseekKeyEl.value = secrets.deepseekKey;
  geminiModelEl.value = settings.geminiModel;
  deepseekModelEl.value = settings.deepseekModel;
  toneEl.value = settings.tone;
  angles = settings.angles.map((a) => ({ ...a }));
  renderAngles();
}

function selectedProvider(): ProviderId {
  return providerDeepseekEl.checked ? 'deepseek' : 'gemini';
}

function validateAngles(): string | null {
  if (angles.length === 0) {
    return 'At least one angle is required.';
  }
  const seen = new Set<string>();
  for (const angle of angles) {
    if (!angle.id) {
      return `Angle "${angle.label}" has an empty id.`;
    }
    if (seen.has(angle.id)) {
      return `Duplicate angle id: ${angle.id}`;
    }
    seen.add(angle.id);
    if (!angle.label.trim()) {
      return 'Angle labels cannot be empty.';
    }
  }
  return null;
}

async function save(): Promise<void> {
  clearError();
  const validationError = validateAngles();
  if (validationError) {
    showError(validationError);
    return;
  }

  try {
    await setSettings({
      provider: selectedProvider(),
      geminiModel: geminiModelEl.value,
      deepseekModel: deepseekModelEl.value,
      tone: toneEl.value,
      angles,
    });
    await setSecrets({
      geminiKey: geminiKeyEl.value,
      deepseekKey: deepseekKeyEl.value,
    });

    saveFeedbackEl.classList.remove('hidden');
    setTimeout(() => saveFeedbackEl.classList.add('hidden'), 1500);
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
  }
}

function resetToDefaults(): void {
  clearError();
  geminiModelEl.value = DEFAULT_SETTINGS.geminiModel;
  deepseekModelEl.value = DEFAULT_SETTINGS.deepseekModel;
  toneEl.value = DEFAULT_SETTINGS.tone;
  angles = DEFAULT_SETTINGS.angles.map((a) => ({ ...a }));
  renderAngles();
}

addAngleBtnEl.addEventListener('click', addAngle);
saveBtnEl.addEventListener('click', () => void save());
resetBtnEl.addEventListener('click', resetToDefaults);

void init();
