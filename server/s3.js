const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");

const region = process.env.AWS_REGION || "ap-south-1";
const bucket = process.env.S3_UPLOAD_BUCKET;
const client = new S3Client({ region });

function requireBucket() {
  if (!bucket) {
    const error = new Error("S3_UPLOAD_BUCKET is not configured");
    error.status = 503;
    throw error;
  }
  return bucket;
}

function cleanFileName(name = "upload") {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}

async function createUploadUrl({ tenantId, folder = "media", fileName, contentType }) {
  const safeTenant = cleanFileName(tenantId || "default");
  const safeFolder = cleanFileName(folder);
  const safeName = cleanFileName(fileName);
  const key = `${safeTenant}/${safeFolder}/${randomUUID()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: requireBucket(),
    Key: key,
    ContentType: contentType || "application/octet-stream"
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  return {
    key,
    uploadUrl,
    publicUrl: `https://${requireBucket()}.s3.${region}.amazonaws.com/${key}`
  };
}

async function deleteObject(key) {
  await client.send(new DeleteObjectCommand({ Bucket: requireBucket(), Key: key }));
}

module.exports = {
  createUploadUrl,
  deleteObject
};
