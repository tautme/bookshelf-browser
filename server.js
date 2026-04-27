const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const IMAGES_DIR = path.join(__dirname, 'images');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

app.use('/images', express.static(IMAGES_DIR));
app.use(express.static(__dirname));

app.get('/random-image', (req, res) => {
  fs.readdir(IMAGES_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not read images folder' });

    const images = files.filter(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()));
    if (images.length === 0) return res.status(404).json({ error: 'No images found' });

    const filename = images[Math.floor(Math.random() * images.length)];
    res.json({ filename });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
