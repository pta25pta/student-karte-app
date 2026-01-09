export default function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    // Get credentials from environment variables (set in Vercel dashboard)
    const validEmail = process.env.ADMIN_EMAIL;
    const validPassword = process.env.ADMIN_PASSWORD;

    // Validate credentials
    if (email === validEmail && password === validPassword) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
}
