import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '12sPBIRduRE9wPTopHn_cdq_eCMMpvqUU';

async function getDriveClient() {
    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageData, fileName, studentId, eventId, fieldName } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Extract base64 data from data URL
        const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid image data format' });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Create readable stream from buffer
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Generate file name
        const timestamp = Date.now();
        const extension = mimeType.split('/')[1] || 'jpg';
        const finalFileName = fileName || `${studentId}_${eventId}_${fieldName}_${timestamp}.${extension}`;

        const drive = await getDriveClient();

        // Upload file to Google Drive
        const fileMetadata = {
            name: finalFileName,
            parents: [FOLDER_ID],
        };

        const media = {
            mimeType: mimeType,
            body: stream,
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
            supportsAllDrives: true,
        });

        // Make the file publicly accessible
        await drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true,
        });

        // Get the direct view URL
        const fileId = file.data.id;
        const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

        res.json({
            success: true,
            fileId: fileId,
            url: directUrl,
            webViewLink: file.data.webViewLink,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
}
