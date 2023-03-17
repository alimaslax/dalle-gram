import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const imageFilePath = 'public/canvas-image.png';
      const imageBuffer = fs.readFileSync(imageFilePath);
      const imageType = 'image/png';

      const form = new FormData();
      form.append('image', imageBuffer, { contentType: imageType, filename: 'canvas-image.png' });
      form.append('prompt', 'Make the shoe blue in this picture');
      form.append('n', 1);
      form.append('size', '512x512');
      form.append('response_format', 'url');
      form.append('user', 'your-end-user-unique-id');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Replace with your API key
          ...form.getHeaders(),
        },
        body: form,
      });

      const completion = await response.json();

      res.status(200).json(completion);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}