const express = require("express");
const next = require("next");
const cors = require("cors");
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

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});