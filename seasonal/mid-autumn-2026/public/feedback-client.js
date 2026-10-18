import { feedbackConfig } from './feedback-config.js';

export const NETLIFY_FORM_NAME = 'draw-one-midautumn-2026';
const failureMessage = '暫時無法送出，請稍後再試。';

export async function submitFeedback(payload, { mode = feedbackConfig.mode, honeypot = '', fetchImpl = fetch } = {}) {
  if (honeypot) throw new Error(failureMessage);
  if (mode === 'netlify') {
    const body = new URLSearchParams({
      'form-name': NETLIFY_FORM_NAME,
      'submission-id': payload.id,
      q1: payload.q1,
      q2: payload.q2,
      q3: payload.q3,
      'bot-field': ''
    }).toString();
    const response = await fetchImpl('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(failureMessage);
    return;
  }
  if (mode !== 'local') throw new Error(failureMessage);
  const response = await fetchImpl('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000)
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) throw new Error(result.error || failureMessage);
}
