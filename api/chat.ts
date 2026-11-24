
import { puter } from '../src/puterClient.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await puter.ai.chat(message);

    const reply =
      typeof result === 'string'
        ? result
        : result?.message?.content ?? JSON.stringify(result);

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: 'AI request failed'
    });
  }
}
