import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

  const [votes, totalVoters] = await Promise.all([
    redis.hgetall('votes'),
    redis.get('total_voters'),
  ]);

  return res.status(200).json({
    votes: votes || {},
    totalVoters: totalVoters || 0,
  });
}
