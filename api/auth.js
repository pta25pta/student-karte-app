// Vercel Serverless Function for Authentication
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  console.log('Login attempt for:', email);

  if (email?.trim() === 'pta25pta@gmail.com' && password?.trim() === 'pta2025pta44') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
}