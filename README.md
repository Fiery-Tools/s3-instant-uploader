# S3 / R2 Instant Uploader

A privacy-focused, server-side proxy image uploader for Cloudflare R2 and AWS S3 built with Next.js and Tailwind CSS.

## Features

- 🔒 **Server-Side Uploads**: No CORS configuration required on your buckets.
- 🛡️ **Privacy Focused**: Credentials are stored in your browser's `localStorage` and never saved to a database.
- ⚡ **Multi-Provider**: Instant switching between Cloudflare R2 and AWS S3.
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS.
- 📋 **Instant Copy**: Auto-generates public URLs for immediate use.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

This tool uses a \"Bring Your Own Keys\" model. You paste your credentials directly into the UI. The app handles parsing environment variable strings automatically.

### Cloudflare R2 Format
Select **Cloudflare R2** in the UI and paste:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=pub-xxx.r2.dev
```

### AWS S3 Format
Select **AWS S3** in the UI and paste:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name
```

## How it Works

1. **Frontend**: You paste credentials into the browser. They are saved to your browser's `LocalStorage` for convenience.
2. **Upload Request**: When you pick a file, the file and your credentials are sent securely to the Next.js API Route (`/api/upload`).
3. **Server Proxy**: The Next.js server (running Node.js) initializes an S3 Client temporarily, uploads the file, and returns the public URL.
4. **Security**: The server does not log or save your keys. The upload happens server-to-server, which bypasses browser CORS restrictions.

## Deployment

This project is designed to be deployed on **Vercel**.

**Note:** Because this tool relies on the user pasting keys into the browser, you do not need to set Environment Variables in your Vercel project settings for the S3 connection itself.

## License

MIT