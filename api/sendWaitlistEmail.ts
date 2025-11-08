import type { VercelRequest, VercelResponse } from '@vercel/node';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'support@simblyai.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY configuration' });
  }

  try {
    const { full_name, email } = (await req.json()) as {
      full_name?: string;
      email?: string;
    };

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const payload = {
      from: `SimblyAI <${FROM_EMAIL}>`,
      to: [email],
      subject: 'Thanks for joining the waitlist!',
      html: `<p>Hi ${full_name || 'there'},</p><p>Thanks for signing up. We’ll get back to you shortly!</p>`,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend error:', errorText);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ sent: true });
  } catch (error) {
    console.error('Unexpected error sending waitlist email:', error);
    return res.status(500).json({ error: 'Unexpected error sending email' });
  }
}

