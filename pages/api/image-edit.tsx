import FormData from 'form-data';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

export const config = {
  api: {
      bodyParser: {
          sizeLimit: '4mb' // Set desired value here
      }
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const imageType = 'image/png';
      const imageBase64Data = req.body.split(',')[1];
      const editBase64Data = req.body.split(',')[2];
      //const prompt = req.body.split(',')[3];
      const imageBuffer = Buffer.from(imageBase64Data, 'base64');
      const editBuffer = Buffer.from(editBase64Data, 'base64');
      const form = new FormData();
      form.append('image', imageBuffer, { contentType: imageType, filename: 'canvas-image.png' });
      form.append('mask', editBuffer, { contentType: imageType, filename: 'canvas-image-mask.png' });
      form.append('prompt', '3D Style');
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