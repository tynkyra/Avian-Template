import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Serve recordings with correct Content-Type
router.get('/recordings/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', 'recordings', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  // Set Content-Type based on file extension
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.ogg') contentType = 'audio/ogg';
  else if (ext === '.wav') contentType = 'audio/wav';
  else if (ext === '.webm') contentType = 'audio/webm';

  res.setHeader('Content-Type', contentType);
  fs.createReadStream(filePath).pipe(res);
});

export default router;
