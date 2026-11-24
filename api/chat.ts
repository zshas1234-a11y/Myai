
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await openai.responses.create({
      model: 'gpt-5.5',
      instructions: 'You are MyAI, a helpful assistant. Reply in English, Urdu or Roman Urdu according to the user. Be friendly and accurate.',
      input: message
    });

    return res.status(200).json({
      reply: response.output_text
    });

  } catch (error) {
    console.error('OpenAI API error:', error);

    return res.status(500).json({
      error: 'AI request failed. Please try again.'
    });
  }
}
