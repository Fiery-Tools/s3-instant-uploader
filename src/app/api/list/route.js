// src/app/api/list/route.js
import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function POST(req) {
  try {
    const body = await req.json();
    const { provider, config, prefix } = body;

    const {
      accessKeyId,
      secretAccessKey,
      bucketName,
      region,
      accountId
    } = config;

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    let clientConfig = {
      credentials: { accessKeyId, secretAccessKey },
      region: provider === 'aws' ? (region || 'us-east-1') : 'auto',
    };

    if (provider === 'r2') {
      if (!accountId) return NextResponse.json({ error: "Missing R2 Account ID" }, { status: 400 });
      clientConfig.endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    }

    const client = new S3Client(clientConfig);

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix || '',
      Delimiter: '/',
      MaxKeys: 1000
    });

    const response = await client.send(command);

    // FIX: Map AWS PascalCase (Key, Prefix) to camelCase (key, prefix) for the frontend
    const contents = (response.Contents || []).map(file => ({
      key: file.Key,           // Fixes undefined error
      size: file.Size,
      lastModified: file.LastModified
    }));

    const commonPrefixes = (response.CommonPrefixes || []).map(folder => ({
      prefix: folder.Prefix    // Fixes potential folder name errors
    }));

    return NextResponse.json({
      contents,
      commonPrefixes
    });

  } catch (error) {
    console.error("List Error:", error);
    return NextResponse.json({ error: error.message || "Failed to list files" }, { status: 500 });
  }
}