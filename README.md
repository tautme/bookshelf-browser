# Bookshelf Browser

A tiny Express app that shows a random image from an **S3 bucket** on every page load. Click the image for smooth pinch / wheel / double-tap zoom (powered by [PhotoSwipe](https://photoswipe.com)).

## Setup

### 1. Create a private S3 bucket

In the AWS console (or `aws s3 mb`), create a bucket — e.g. `my-bookshelf-images`. Leave it **private**; the app generates short-lived pre-signed URLs so you don't need public access.

Upload some `.jpg`, `.jpeg`, `.png`, `.gif`, or `.webp` files to it.

### 2. Create an IAM user with read access

Attach a policy like this (replace the bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:ListBucket", "s3:GetObject"],
    "Resource": [
      "arn:aws:s3:::my-bookshelf-images",
      "arn:aws:s3:::my-bookshelf-images/*"
    ]
  }]
}
```

Generate an access key for the user.

### 3. Configure environment variables

```bash
export S3_BUCKET=my-bookshelf-images
export S3_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
# optional:
# export S3_PREFIX=photos/        # only list keys under this prefix
# export S3_URL_TTL=3600          # pre-signed URL lifetime in seconds
# export PORT=3000
```

In production, prefer IAM instance roles or a `.env` loader over exporting secrets in your shell.

### 4. Run it

```bash
npm install
npm start
```

Open <http://localhost:3000>. Each refresh picks a different image. Click the image (or tap on mobile) to open the zoom view; pinch / scroll wheel / double-tap to zoom, drag to pan, ESC or swipe down to close.

## Adding more images

Just upload them to the bucket — no code changes, no redeploy. The server caches the listing for 30 seconds (`LIST_CACHE_MS` env var to tune).

## How it works

- `GET /random-image` lists the bucket via `ListObjectsV2`, filters by extension, picks one at random, and returns a pre-signed `GetObject` URL plus the key as JSON.
- The frontend fetches that URL, displays the image full-bleed, and instantiates PhotoSwipe with the image's natural dimensions for smooth zoom/pan.

## Deploy

Any Node host works (Render, Railway, Fly, EC2, etc.). Set the env vars above, expose the platform's `PORT`, and point your domain at it.
