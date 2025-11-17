import React, { useRef, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface LogoUploadProps {
  value?: string | File | null; // URL of saved logo OR File object for preview
  onChange: (file: File | null) => void;
  onLogoUrlChange?: (url: string | null, key: string | null) => void;
  uploading?: boolean;
  maxSizeMB?: number;
  maxDimensions?: { width: number; height: number };
  allowedTypes?: string[];
  className?: string;
  // Soft recommendation limits (will show warnings but allow upload)
  recommendedSizeMB?: number; // Default: same as maxSizeMB for logos
  recommendedDimensions?: { width: number; height: number }; // Default: 1024x1024 for logos
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  value,
  onChange,
  onLogoUrlChange,
  uploading = false,
  maxSizeMB = 10, // Hard limit (matches backend MAX_LOGO_SIZE)
  maxDimensions = { width: 2000, height: 2000 },
  recommendedSizeMB = 2, // Soft recommendation for logos
  recommendedDimensions = { width: 1024, height: 1024 }, // Soft recommendation for logos
  allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/avif",
  ],
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragCounterRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Sync previewUrl with value prop when it changes
  useEffect(() => {
    let objectUrl: string | null = null;

    if (value instanceof File) {
      // It's a File object - create a blob URL for preview
      objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);
      setIsImageLoading(true);
    } else if (typeof value === "string") {
      // It's a URL string - use it directly
      setPreviewUrl(value);
      setIsImageLoading(true);
    } else {
      // No value - clear preview
      setPreviewUrl(null);
      setIsImageLoading(false);
    }

    // Cleanup blob URL on unmount or when value changes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value]);

  // Check if image is already loaded (from cache) when previewUrl changes
  useEffect(() => {
    if (!previewUrl) return;

    // Use setTimeout to ensure img element is rendered
    const timeoutId = setTimeout(() => {
      if (imgRef.current) {
        const img = imgRef.current;
        // If image is already complete (cached), set loading to false immediately
        if (img.complete && img.naturalHeight !== 0) {
          setIsImageLoading(false);
        }
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [previewUrl]);

  const validateFile = async (file: File): Promise<boolean> => {
    // Helper: Map file extension to MIME type
    const extensionToMimeType: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      svg: "image/svg+xml",
      avif: "image/avif",
    };

    // Get file extension
    const extension = file.name.split(".").pop()?.toLowerCase();

    // Determine actual MIME type: use browser's MIME type if valid, otherwise infer from extension
    // This is important for AVIF files which browsers may not recognize
    let actualMimeType = file.type;
    if (!actualMimeType || actualMimeType === "application/octet-stream") {
      if (extension && extensionToMimeType[extension]) {
        actualMimeType = extensionToMimeType[extension];
      }
    }

    // Helper function to format allowed formats for display
    const formatAllowedTypes = (): string => {
      const formats = allowedTypes.map((t) => {
        const format = t.split("/")[1].toUpperCase();
        return format === "SVG+XML" ? "SVG" : format;
      });
      // Format as "JPEG, PNG, WebP, SVG, or AVIF" (with "or" before last item)
      if (formats.length === 1) return formats[0];
      if (formats.length === 2) return `${formats[0]} or ${formats[1]}`;
      return `${formats.slice(0, -1).join(", ")}, or ${
        formats[formats.length - 1]
      }`;
    };

    // Hard validation: File type (security - must block)
    // Check if extension is in our allowed list
    if (extension && !extensionToMimeType[extension]) {
      const detectedType = extension.toUpperCase();
      toast.error(
        `Unsupported file format (${detectedType}). Please use ${formatAllowedTypes()} instead.`,
        { duration: 5000 }
      );
      return false;
    }

    // Check if MIME type is in allowed list
    const isValidType = actualMimeType && allowedTypes.includes(actualMimeType);

    if (!isValidType) {
      const detectedType = extension
        ? extension.toUpperCase()
        : "unknown format";
      toast.error(
        `Unsupported file format (${detectedType}). Please use ${formatAllowedTypes()} instead.`,
        { duration: 5000 }
      );
      return false;
    }

    // Hard validation: File size (must block if exceeds maxSizeMB)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
      return false;
    }

    const recommendedSizeBytes = recommendedSizeMB * 1024 * 1024;
    let needsOptimization = false;

    // Check file size (soft recommendation)
    if (file.size > recommendedSizeBytes) {
      needsOptimization = true;
    }

    // Check image dimensions (skip for SVG as they're vector-based, and AVIF as browsers may not read them)
    const isVectorOrUnsupported =
      actualMimeType === "image/svg+xml" || actualMimeType === "image/avif";

    if (!isVectorOrUnsupported && maxDimensions && recommendedDimensions) {
      try {
        const dimensions = await getImageDimensions(file);
        const exceedsRecommended =
          dimensions.width > recommendedDimensions.width ||
          dimensions.height > recommendedDimensions.height;

        if (exceedsRecommended) {
          needsOptimization = true;
        }
      } catch (error) {
        console.error("Failed to validate image dimensions:", error);
        // Don't show error to user - backend will validate
      }
    }
    // Show simple warning if file needs optimization
    if (needsOptimization) {
      toast.warning(
        "Your file exceeds our recommended limits. We'll optimize it automatically.",
        { duration: 5000 }
      );
    }
    // Always return true (allow upload) - backend will do final validation
    return true;
  };

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };

      img.src = objectUrl;
    });
  };

  const handleFile = async (file: File) => {
    // Validate FIRST before showing preview
    const isValid = await validateFile(file);
    if (!isValid) {
      // If validation fails, clear the file input and don't show preview
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Only show preview if validation passes
    onChange(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter") {
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setDragActive(true);
      }
    } else if (e.type === "dragleave") {
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (onLogoUrlChange) {
      onLogoUrlChange(null, null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div
        onClick={!uploading ? handleClick : undefined}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 h-64 border-dashed rounded-lg bg-background",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          uploading ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          "p-4"
        )}
      >
        {previewUrl || isImageLoading ? (
          <div className="w-full flex flex-col items-center justify-center space-y-3">
            <div className="relative w-full h-[208px] flex items-center justify-center">
              {isImageLoading && <Spinner size="lg" color="info" />}
              {previewUrl && (
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Business logo preview"
                  className={cn(
                    "w-full h-full object-contain",
                    isImageLoading && "hidden"
                  )}
                  onLoad={() => {
                    setIsImageLoading(false);
                  }}
                  onError={() => {
                    setIsImageLoading(false);
                  }}
                />
              )}

              {/* Remove button - top right corner */}
              {!isImageLoading && previewUrl && !uploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  rounded="full"
                  className="absolute top-3 right-3 h-7 w-7 shadow-md cursor-pointer z-10 border-border hover:bg-destructive/10 hover:border-destructive/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(e);
                  }}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}

              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <Spinner size="lg" color="info" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            {uploading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="lg" color="info" />
              </div>
            ) : (
              <>
                <div className="mx-auto w-14 h-14 rounded-full bg-info-100 flex items-center justify-center mb-4">
                  {dragActive ? (
                    <ImageIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    {dragActive ? "Drop your logo here" : "Upload your logo"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dragActive
                      ? "Release to upload"
                      : "Click to browse or drag and drop"}
                  </p>
                </div>
                <div className="pt-4 border-t border-border space-y-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">
                      Max size recommended:
                    </span>{" "}
                    {recommendedDimensions.width}×{recommendedDimensions.height}
                    px, up to {recommendedSizeMB}MB
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Larger images will be automatically optimized for you.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoUpload;
