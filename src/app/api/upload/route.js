import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const provider = formData.get("provider"); // 'r2' or 'aws'
    const accessKeyId = formData.get("accessKeyId");
    const secretAccessKey = formData.get("secretAccessKey");
    const bucketName = formData.get("bucketName");

    // R2 Specific
    const accountId = formData.get("accountId");
    const publicDomain = formData.get("publicDomain");

    // AWS Specific
    const region = formData.get("region");

    if (!file || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json({ error: "Missing configuration or file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Configure Client based on Provider
    const clientConfig = {
      credentials: { accessKeyId, secretAccessKey },
    };

    if (provider === 'r2') {
      clientConfig.region = "auto";
      clientConfig.endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    } else {
      // AWS S3
      clientConfig.region = region || "us-east-1";
      // No custom endpoint needed for standard AWS, SDK handles it via region
    }

    const S3 = new S3Client(clientConfig);

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    await S3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        // AWS often needs this for public access if bucket isn't public by default
        // ACL: 'public-read',
      })
    );

    // Construct Public URL
    let publicUrl = "";
    if (provider === 'r2' && publicDomain) {
       const domain = publicDomain.startsWith("http") ? publicDomain : `https://${publicDomain}`;
       publicUrl = `${domain}/${fileName}`;
    } else if (provider === 'aws') {
       // Standard AWS S3 URL format
       publicUrl = `https://${bucketName}.s3.${clientConfig.region}.amazonaws.com/${fileName}`;
    } else {
       publicUrl = fileName;
    }

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}