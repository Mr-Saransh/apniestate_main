import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "j5vt6jez",
  api_key: process.env.CLOUDINARY_API_KEY || "799181112798995",
  api_secret: process.env.CLOUDINARY_API_SECRET || "kHyt__6eFxo45V8_OTk6PwCGylg",
  secure: true,
});

export const getCloudinarySignature = (folder: string) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return { timestamp, signature, folder };
};

export default cloudinary;
