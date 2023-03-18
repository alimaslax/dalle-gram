import FormData from 'form-data';
import fetch from "node-fetch";
import { Buffer } from "buffer";
import querystring from 'querystring';
import sharp from "sharp";

const fs = require("fs");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb", // Set desired value here
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      console.log("$$$$$$$$$$");
      const imageType = "image/png";
      const imageBase64Data = req.body.image.split(',')[1];
      const maskBase64Data = req.body.mask.split(',')[1];
      const prompt = req.body.prompt;
      let imageBuffer = Buffer.from(imageBase64Data, "base64");
      let editBuffer = Buffer.from(maskBase64Data, "base64");

      // Resize the image to a square aspect ratio
      editBuffer = await sharp(editBuffer)
      .resize({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true
      })
      .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

      if (imageBuffer.length > 4 * 1024 * 1024) {
        // Compress the image if it is larger than 4MB
        imageBuffer = await sharp(imageBuffer)
          .png({ quality: 80, compressionLevel: 9 })
          .toBuffer();
      }

      if (editBuffer.length > 4 * 1024 * 1024) {
        // Compress the image if it is larger than 4MB
        editBuffer = await sharp(editBuffer)
          .png({ quality: 80, compressionLevel: 9 })
          .toBuffer();
      }
    
      // const form = new FormData();
      // form.append('image', imageBuffer, { contentType: imageType, filename: 'canvas-image.png' });
      // form.append('mask', editBuffer, { contentType: imageType, filename: 'canvas-image.png' });
      // form.append('prompt', prompt);
      // form.append('n', 1);
      // form.append('size', '512x512');
      // form.append('response_format', 'url');
      // form.append('user', 'your-end-user-unique-id');

      // const response = await fetch('https://api.openai.com/v1/images/edits', {
      //   method: 'POST',
      //   hostname: 'api.openai.com',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Replace with your API key
      //     ...form.getHeaders(),
      //   },
      //   body: form,
      // });

      // Read the file as a binary data buffer
      // Encode the buffer as a base64-encoded string
      // Construct the `data` object with the base64-encoded string as the image data
      // const imgBuffer = fs.readFileSync("./public/canvas-image.png");
      const base64Img = editBuffer.toString("base64");
      const completion = {
        data: [
          {
            url: "data:image/png;base64," + base64Img,
          },
        ],
      };

      //const completion = await response.json();
      res.status(200).json(completion);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
