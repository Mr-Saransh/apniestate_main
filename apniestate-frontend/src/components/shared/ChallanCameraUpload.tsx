import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, UploadCloud, RefreshCw, X, Check, Image as ImageIcon, Eye, AlertCircle, SwitchCamera } from 'lucide-react';

interface ChallanCameraUploadProps {
  label?: string;
  helperText?: string;
  value?: File | null;
  currentUrl?: string | null;
  onChange: (file: File | null, previewDataUrl?: string | null) => void;
  acceptPdf?: boolean;
}

export default function ChallanCameraUpload({
  label = "Upload Bill / Challan (Optional)",
  helperText = "Snap a photo of the physical challan/bill or upload from your device",
  value,
  currentUrl,
  onChange,
  acceptPdf = true,
}: ChallanCameraUploadProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Local preview URL for selected file or captured photo
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Detect mobile device to offer streamlined experience
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    setIsMobile(/android|iphone|ipad|ipod/i.test(userAgent.toLowerCase()));
  }, []);

  useEffect(() => {
    if (value && value.type.startsWith('image/')) {
      const url = URL.createObjectURL(value);
      setLocalPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (!value) {
      setLocalPreviewUrl(null);
    }
  }, [value]);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setCapturedPhotoUrl(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or connection. Please upload an image instead.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      let msg = "Could not access camera. Please check camera permissions in your browser.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Camera permission was denied. Please allow camera access in your browser settings.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No camera found on this device. Please upload a photo from your files.";
      }
      setCameraError(msg);
    }
  };

  const openCameraModal = () => {
    setIsCameraOpen(true);
    startCamera(facingMode);
  };

  const closeCameraModal = () => {
    stopStream();
    setIsCameraOpen(false);
    setCapturedPhotoUrl(null);
    setCameraError(null);
  };

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedPhotoUrl(dataUrl);
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const confirmCapturedPhoto = () => {
    if (!capturedPhotoUrl) return;

    // Convert dataUrl to File object
    const arr = capturedPhotoUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const filename = `challan_snap_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
    const file = new File([u8arr], filename, { type: mime });

    onChange(file, capturedPhotoUrl);
    closeCameraModal();
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          onChange(file, event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        onChange(file, null);
      }
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeDisplayUrl = localPreviewUrl || currentUrl;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <ImageIcon size={16} className="text-[#2648E7]" />
          {label}
        </label>
        {activeDisplayUrl && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ✓ Attached for PDF
          </span>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {/* Upload & Camera Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Camera Click Button */}
        <button
          type="button"
          onClick={openCameraModal}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-[0.98] cursor-pointer"
        >
          <Camera size={15} className="animate-pulse" />
          <span>Click Camera Photo</span>
        </button>

        {/* Choose File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-muted/60 hover:bg-muted border border-border rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer"
        >
          <UploadCloud size={15} className="text-muted-foreground" />
          <span>Choose from Device</span>
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptPdf ? "image/*,application/pdf" : "image/*"}
          onChange={handleNativeFileChange}
          className="hidden"
        />
      </div>

      {/* Selected File / Photo Thumbnail Card */}
      {activeDisplayUrl && (
        <div className="p-3 bg-muted/30 border border-border/80 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              onClick={() => setPreviewModalUrl(activeDisplayUrl)}
              className="relative size-14 rounded-xl border border-border overflow-hidden bg-black shrink-0 cursor-pointer group"
              title="Click to zoom preview"
            >
              <img
                src={activeDisplayUrl}
                alt="Challan/Bill"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye size={16} />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {value ? value.name : 'Attached Challan / Bill Document'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {value && (
                  <span className="text-[10px] text-muted-foreground">
                    {(value.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <span className="text-[10px] font-semibold text-[#2648E7] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  Ready to print in PDF
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewModalUrl(activeDisplayUrl)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-xs"
              title="View full preview"
            >
              <Eye size={15} />
            </button>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs"
              title="Remove attachment"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* If a PDF file was selected */}
      {value && !localPreviewUrl && value.type === 'application/pdf' && (
        <div className="p-3 bg-muted/30 border border-border/80 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
              PDF
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{value.name}</p>
              <p className="text-[10px] text-muted-foreground">{(value.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Full-Screen Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-blue-400" />
                <h3 className="font-bold text-sm">Challan / Bill Camera Capture</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchCameraFacing}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
                  title="Switch Front/Rear Camera"
                >
                  <SwitchCamera size={16} />
                </button>
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Viewfinder or Captured Review */}
            <div className="relative bg-black flex-1 min-h-[340px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-slate-300 space-y-3 max-w-xs">
                  <AlertCircle size={36} className="mx-auto text-amber-400" />
                  <p className="text-sm">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Select Photo from Files
                  </button>
                </div>
              ) : capturedPhotoUrl ? (
                /* Freeze Frame Review */
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={capturedPhotoUrl}
                    alt="Captured Challan"
                    className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-lg"
                  />
                  <div className="absolute top-4 left-4 bg-emerald-500/90 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow">
                    <Check size={13} /> Photo Captured
                  </div>
                </div>
              ) : (
                /* Live Camera Stream with Document Framing Guidelines */
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Framing Reticle */}
                  <div className="absolute inset-8 sm:inset-10 border-2 border-dashed border-blue-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                    <span className="text-[10px] font-bold text-blue-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs self-start">
                      Position Challan / Bill in Frame
                    </span>
                    <span className="text-[10px] text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs self-end">
                      Keep text clear & well-lit
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Controls */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
              {capturedPhotoUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhotoUrl(null);
                      startCamera(facingMode);
                    }}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Check size={16} /> Attach to Document
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="py-2.5 px-4 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  {/* Circular Shutter Button */}
                  <button
                    type="button"
                    disabled={isCapturing || !!cameraError}
                    onClick={takeSnapshot}
                    className="size-16 rounded-full bg-white hover:bg-slate-200 text-slate-900 flex items-center justify-center p-1 shadow-xl transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Click to snap photo"
                  >
                    <div className="size-13 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <Camera size={22} className="text-slate-900" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={switchCameraFacing}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <SwitchCamera size={13} /> Flip
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Preview Modal */}
      {previewModalUrl && (
        <div 
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 p-2 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 right-4 size-8 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center z-10"
            >
              <X size={16} />
            </button>
            <img
              src={previewModalUrl}
              alt="Enlarged Document Preview"
              className="max-h-[80vh] w-auto rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
