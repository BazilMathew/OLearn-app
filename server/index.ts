import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { z } from 'zod';
import { classifyQuery, transcribeAudio, UpstreamError } from './openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || '';
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN?.trim() || '';

const MAX_AUDIO_BYTES = 1024 * 1024;
const MAX_QUERY_CHARS = 300;

// Whisper infers the container format from the file extension.
const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav'
};

const LanguageSchema = z.enum(['en', 'hi', 'ml']);

const SttBodySchema = z.object({ language: LanguageSchema });

const RouteBodySchema = z.object({
  query: z.string().trim().min(1).max(MAX_QUERY_CHARS),
  language: LanguageSchema,
  tasks: z
    .array(z.object({ id: z.string().min(1).max(64), title: z.string().max(200) }))
    .min(1)
    .max(20)
});

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN || false }));
app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'too_many_requests' }
  })
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1, fields: 2 }
});

function requireApiKey(_req: Request, res: Response, next: NextFunction) {
  if (!OPENAI_API_KEY) {
    res.status(503).json({ error: 'ai_unavailable' });
    return;
  }
  next();
}

function badRequest(res: Response) {
  res.status(400).json({ error: 'invalid_request' });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/stt', requireApiKey, upload.single('audio'), async (req, res) => {
  const body = SttBodySchema.safeParse(req.body);
  const file = req.file;
  const mimeType = file?.mimetype.split(';')[0].trim().toLowerCase() ?? '';
  const extension = AUDIO_EXTENSIONS[mimeType];
  if (!body.success || !file || !extension) return badRequest(res);

  const text = await transcribeAudio(OPENAI_API_KEY, file.buffer, mimeType, extension, body.data.language);
  res.json({ text });
});

app.post('/api/route', requireApiKey, express.json({ limit: '10kb' }), async (req, res) => {
  const body = RouteBodySchema.safeParse(req.body);
  if (!body.success) return badRequest(res);

  const result = await classifyQuery(
    OPENAI_API_KEY,
    body.data.query,
    body.data.tasks.map(t => t.id)
  );
  if (!result) {
    res.status(502).json({ error: 'upstream_error' });
    return;
  }
  res.json(result);
});

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Generic responses only. Never log request bodies, audio, user text or the key.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'payload_too_large' });
    } else {
      badRequest(res);
    }
    return;
  }
  if (err instanceof UpstreamError) {
    res.status(502).json({ error: 'upstream_error' });
    return;
  }
  const status = (err as { status?: unknown })?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status === 413 ? 413 : 400).json({ error: status === 413 ? 'payload_too_large' : 'invalid_request' });
    return;
  }
  console.error('[server] unexpected error:', err instanceof Error ? err.name : 'unknown');
  res.status(500).json({ error: 'internal_error' });
});

app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT} (AI ${OPENAI_API_KEY ? 'enabled' : 'disabled: OPENAI_API_KEY not set'})`);
});
