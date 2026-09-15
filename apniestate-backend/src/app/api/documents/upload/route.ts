import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs/promises";

// Configure Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let secureUrl: string | null = null;

    // 1. Try Cloudinary if configured (with resource_type: auto for ANY format)
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const cloudRes: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "apniestate/documents",
              resource_type: "auto",
              use_filename: true,
              unique_filename: true,
            },
            (err, res) => {
              if (err) reject(err);
              else resolve(res);
            }
          );
          uploadStream.end(buffer);
        });

        if (cloudRes?.secure_url) {
          secureUrl = cloudRes.secure_url;
        }
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr);
      }
    }

    // 2. Fallback to Local Storage in public/uploads/documents/
    if (!secureUrl) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
      await fs.mkdir(uploadDir, { recursive: true });

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const safeFilename = `${Date.now()}_${sanitizedName}`;
      const filePath = path.join(uploadDir, safeFilename);

      await fs.writeFile(filePath, buffer);
      secureUrl = `/uploads/documents/${safeFilename}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        file_url: secureUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
      },
    });
  } catch (err: any) {
    console.error("Document upload route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process document upload" },
      { status: 500 }
    );
  }
});
