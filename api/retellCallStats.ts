import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRetellCallStats } from '../server/retellStats.js';

const RETELL_API_KEY = process.env.RETELL_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RETELL_API_KEY) {
    return res.status(500).json({ error: 'Missing RETELL_API_KEY environment variable' });
  }

  try {
    const stats = await fetchRetellCallStats(RETELL_API_KEY);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching Retell call stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch Retell call stats';
    return res.status(500).json({ error: message });
  }
}
