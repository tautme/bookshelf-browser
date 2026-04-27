const express = require('express');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;
const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
const PREFIX = process.env.S3_PREFIX || '';
const URL_TTL = parseInt(process.env.S3_URL_TTL || '3600', 10);
const LIST_CACHE_MS = parseInt(process.env.LIST_CACHE_MS || '30000', 10);
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const s3 = new S3Client({ region: REGION });

let cache = { keys: null, fetchedAt: 0 };

async function listImages() {
  if (cache.keys && Date.now() - cache.fetchedAt < LIST_CACHE_MS) {
    return cache.keys;
  }
  const keys = [];
  let token;
  do {
    const out = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: PREFIX,
      ContinuationToken: token,
    }));
    for (const obj of out.Contents || []) {
      if (IMAGE_EXTS.includes(path.extname(obj.Key).toLowerCase())) {
        keys.push(obj.Key);
      }
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  cache = { keys, fetchedAt: Date.now() };
  return keys;
}

app.use(express.static(__dirname));

app.get('/random-image', async (req, res) => {
  if (!BUCKET) {
    return res.status(500).json({ error: 'S3_BUCKET env var is not set' });
  }
  try {
    const keys = await listImages();
    if (keys.length === 0) {
      return res.status(404).json({ error: 'No images found in bucket' });
    }
    const key = keys[Math.floor(Math.random() * keys.length)];
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: URL_TTL }
    );
    res.json({ key, url });
  } catch (err) {
    console.error('S3 error:', err.message);
    res.status(500).json({ error: 'Failed to fetch image from S3' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Bucket: ${BUCKET || '(not set)'}  Region: ${REGION}  Prefix: '${PREFIX}'`);
});
