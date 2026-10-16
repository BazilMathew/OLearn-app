import { z } from 'zod';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const UPSTREAM_TIMEOUT_MS = 10_000;
const ROUTE_MAX_TOKENS = 300;

export class UpstreamError extends Error {}

export type Language = 'en' | 'hi' | 'ml';

export type RouteResult =
  | { matched: true; taskId: string }
  | {
      matched: false;
      clarifyQuestion: { text: string; options: Array<{ taskId: string; label: string }> };
    };

// Ported verbatim from the former client-side TaskRouterService.callLLMClassifier.
const ROUTER_SYSTEM_PROMPT = `You are the task router for OLearn, an elderly digital literacy assistant in India.
The user is requesting assistance in English, Hindi, or Malayalam.
Match their request to EXACTLY ONE of the following 8 task IDs:
1. whatsapp_send_text: Send text message on WhatsApp
2. whatsapp_send_photo: Send a photo or picture on WhatsApp
3. whatsapp_voice_call: Make a voice phone call on WhatsApp
4. whatsapp_video_call: Make a face-to-face video call on WhatsApp
5. gpay_check_balance: Check bank account balance in Google Pay
6. gpay_scan_qr: Scan QR code at a shop to pay money in Google Pay
7. gpay_send_contact: Send money to a saved contact / family member in Google Pay
8. gpay_transaction_history: View previous payment history / passbook receipts in Google Pay

Return a valid JSON object ONLY with one of these structures:
If matched with confidence:
{"task_id": "one_of_the_8_ids"}

If ambiguous or unclear:
{"no_match": true, "clarify_question": "in-language clarifying question for elderly user", "options": [{"task_id": "id1", "label": "label1"}, {"task_id": "id2", "label": "label2"}]}`;

const WhisperResponseSchema = z.object({ text: z.string() });

const ChatResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1)
});

const ClassifierOutputSchema = z.object({
  task_id: z.string().optional(),
  no_match: z.boolean().optional(),
  clarify_question: z.string().optional(),
  options: z.array(z.object({ task_id: z.string(), label: z.string() })).optional().catch(undefined)
});

async function postToOpenAI(path: string, apiKey: string, body: FormData | string): Promise<unknown> {
  const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
  if (typeof body === 'string') headers['Content-Type'] = 'application/json';

  let res: globalThis.Response;
  try {
    res = await fetch(`${OPENAI_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
  } catch {
    throw new UpstreamError('unreachable');
  }

  if (!res.ok) {
    // Status code only: never log the key, the request body or the response body.
    console.warn(`[openai] ${path} failed with status ${res.status}`);
    throw new UpstreamError('bad_status');
  }

  try {
    return await res.json();
  } catch {
    throw new UpstreamError('bad_json');
  }
}

export async function transcribeAudio(
  apiKey: string,
  audio: Buffer,
  mimeType: string,
  extension: string,
  language: Language
): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), `audio.${extension}`);
  form.append('model', 'whisper-1');
  form.append('language', language);

  const parsed = WhisperResponseSchema.safeParse(await postToOpenAI('/audio/transcriptions', apiKey, form));
  if (!parsed.success) throw new UpstreamError('bad_shape');
  return parsed.data.text;
}

/** Returns null when the model output is unusable, so the client falls back to local matching. */
export async function classifyQuery(apiKey: string, query: string, taskIds: string[]): Promise<RouteResult | null> {
  const data = await postToOpenAI(
    '/chat/completions',
    apiKey,
    JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      temperature: 0.1,
      max_tokens: ROUTE_MAX_TOKENS,
      response_format: { type: 'json_object' }
    })
  );

  const chat = ChatResponseSchema.safeParse(data);
  if (!chat.success) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(chat.data.choices[0].message.content);
  } catch {
    return null;
  }

  const parsed = ClassifierOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { task_id, no_match, clarify_question, options } = parsed.data;

  if (task_id && taskIds.includes(task_id)) {
    return { matched: true, taskId: task_id };
  }
  if (no_match) {
    return {
      matched: false,
      clarifyQuestion: {
        text: clarify_question || 'Please select one of the following:',
        options: (options ?? [])
          .filter(o => taskIds.includes(o.task_id))
          .map(o => ({ taskId: o.task_id, label: o.label }))
      }
    };
  }
  return null;
}
