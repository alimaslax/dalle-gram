const express = require("express");
const next = require("next");
const cors = require("cors");
const https = require("https"); // Import the built-in https module
const multer = require("multer");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.argv[3] || 3000;

console.log(port)

app.prepare().then(() => {
  const server = express();

  // Create a multer instance with the desired storage options
  const storage = multer.memoryStorage();
  const upload = multer({
    storage: storage,
    limits: {
      fieldSize: 4 * 1024 * 1024, // Set the field size limit to 4MB
    },
  });

  // Enable CORS for all routes
  server.use(cors());

  // Use the multer middleware to handle the request body
  server.use(upload.fields([]));

  // Add middleware to log incoming requests
  server.use((req, res, next) => {
    //console.log(`${req.method} request received for ${req.url}`);
    next();
  });

  // Add the /proxy route
  server.get("/proxy", (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      res.status(400).send("Missing 'url' query parameter");
      return;
    }

    https
      .get(imageUrl, (imageResponse) => {
        if (imageResponse.statusCode !== 200) {
          res
            .status(imageResponse.statusCode)
            .send(imageResponse.statusMessage);
          return;
        }

        res.setHeader("Content-Type", imageResponse.headers["content-type"]);
        imageResponse.pipe(res);
      })
      .on("error", (error) => {
        console.error("Error fetching image:", error);
        res.status(500).send("Error fetching image");
      });
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});