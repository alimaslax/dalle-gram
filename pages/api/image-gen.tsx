import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const imageFilePath = 'public/canvas-image.png';
      const imageBuffer = fs.readFileSync(imageFilePath);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Replace with your API key
          'Content-Type': 'application/json',
          //...form.getHeaders(),
        },
        body: JSON.stringify({
            prompt: 'Lord of the Rings Scenery',
            imageBuffer: imageBuffer,
            n: 1,
            size: '512x512',
        }),
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