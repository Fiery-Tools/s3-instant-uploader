// src/app/api/presign/route.js
import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req) {
  try {
    const body = await req.json();
    const { provider, config, key } = body;

    const {
      accessKeyId,
      secretAccessKey,
      bucketName,
      region,
      accountId
    } = config;

    // Validate
    if (!accessKeyId || !secretAccessKey || !bucketName || !key) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Configure Client
    let clientConfig = {
      credentials: { accessKeyId, secretAccessKey },
      region: provider === 'aws' ? (region || 'us-east-1') : 'auto',
    };

    if (provider === 'r2') {
      if (!accountId) return NextResponse.json({ error: "Missing R2 Account ID" }, { status: 400 });
      clientConfig.endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    }

    const client = new S3Client(clientConfig);

    // Generate Signed URL
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // URL expires in 1 hour (3600 seconds)
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return NextResponse.json({ url });

  } catch (error) {
    console.error("Presign Error:", error);
    return NextResponse.json({ error: error.message || "Failed to sign URL" }, { status: 500 });
  }
}