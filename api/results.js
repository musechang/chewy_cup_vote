import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

  const [votes, totalVoters] = await Promise.all([
    kv.hgetall('votes'),
    kv.get('total_voters'),
  ]);

  return res.status(200).json({
    votes: votes || {},
    totalVoters: totalVoters || 0,
  });
}
