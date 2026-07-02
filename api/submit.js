import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, voterId } = req.body || {};
  if (!code || !voterId) return res.status(400).json({ error: 'Missing code or voterId' });

  // Check duplicate vote
  const already = await redis.get(`voter:${voterId}`);
  if (already) return res.status(409).json({ error: 'Already voted' });

  // Parse code: CHEWY123:t1,t2,...,Sxxx,Mxxx
  const match = code.match(/^CHEWY\d+:(.+)$/);
  if (!match) return res.status(400).json({ error: 'Invalid code format' });

  const tokens = match[1].split(',');

  // Tally votes via pipeline
  const pipeline = redis.pipeline();
  for (const token of tokens) {
    if (!token || token === 'SKIP') continue;
    const id = token.replace(/^[SM]/, '');
    if (/^\d+$/.test(id)) {
      pipeline.hincrby('votes', id, 1);
    }
  }
  pipeline.set(`voter:${voterId}`, Date.now(), { ex: 60 * 60 * 24 * 30 });
  pipeline.incr('total_voters');
  await pipeline.exec();

  return res.status(200).json({ ok: true });
}
