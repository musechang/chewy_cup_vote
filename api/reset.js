import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { secret } = req.body || {};
  if (secret !== process.env.RESET_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Delete votes hash, total_voters, and all voter keys
  const voterKeys = await redis.keys('voter:*');
  const pipeline = redis.pipeline();
  pipeline.del('votes');
  pipeline.del('total_voters');
  for (const k of voterKeys) pipeline.del(k);
  await pipeline.exec();

  return res.status(200).json({ ok: true, deletedVoterKeys: voterKeys.length });
}
