import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs/promises";

// Configure Cloudinary with fallback credentials
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "j5vt6jez";
const API_KEY = process.env.CLOUDINARY_API_KEY || "799181112798995";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "kHyt__6eFxo45V8_OTk6PwCGylg";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

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

    // 1. Try Cloudinary if credentials exist
    if (CLOUD_NAME && API_KEY && API_SECRET) {
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
        console.warn("Cloudinary upload with auto resource_type failed, attempting raw:", cloudErr);
        try {
          const rawRes: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "apniestate/documents",
                resource_type: "raw",
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

          if (rawRes?.secure_url) {
            secureUrl = rawRes.secure_url;
          }
        } catch (rawErr) {
          console.warn("Cloudinary upload failed completely:", rawErr);
        }
      }
    }

    // 2. Fallback to Local Storage if writable, or Data URL if in serverless read-only disk (e.g. Vercel)
    if (!secureUrl) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
        await fs.mkdir(uploadDir, { recursive: true });

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const safeFilename = `${Date.now()}_${sanitizedName}`;
        const filePath = path.join(uploadDir, safeFilename);

        await fs.writeFile(filePath, buffer);
        secureUrl = `/uploads/documents/${safeFilename}`;
      } catch (fsErr) {
        console.warn("Local storage write failed (e.g. read-only serverless environment), falling back to data URL:", fsErr);
        const mime = file.type || "application/octet-stream";
        secureUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      }
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
