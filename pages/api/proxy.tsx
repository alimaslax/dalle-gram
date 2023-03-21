import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) {
          res.status(400).send("Missing 'url' query parameter");
          return;
        }
        
        return fetch(imageUrl)
        .then((imageResponse) => {
          if (imageResponse.status !== 200) {
            res
              .status(imageResponse.status)
              .send(imageResponse.statusText);
            return;
          }
      
          res.setHeader("Content-Type", imageResponse.headers.get("content-type"));
          res.status(200);
          imageResponse.body.pipe(res);
        })
        .catch((error) => {
          console.error("Error fetching image:", error);
          res.status(500).send("Error fetching image");
        });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}