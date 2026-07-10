import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { getCloudinarySignature } from "@/lib/cloudinary";

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const { folder } = body;

  if (!folder) {
    return badRequest("Folder is required");
  }

  // Generate signature
  const signatureData = getCloudinarySignature(folder);

  return ok({
    signature: signatureData.signature,
    timestamp: signatureData.timestamp,
    folder: signatureData.folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  });
});
