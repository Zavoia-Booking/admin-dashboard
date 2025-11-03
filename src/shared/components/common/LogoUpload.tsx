import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface LogoUploadProps {
  value?: string | File | null; // URL of saved logo OR File object for preview
  onChange: (file: File | null) => void;
  onLogoUrlChange?: (url: string | null, key: string | null) => void;
  uploading?: boolean;
  maxSizeMB?: number;
  maxDimensions?: { width: number; height: number };
  allowedTypes?: string[];
  className?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  value,
  onChange,
  onLogoUrlChange,
  uploading = false,
  maxSizeMB = 5,
  maxDimensions = { width: 2000, height: 2000 },
  allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg'],
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Sync previewUrl with value prop when it changes
  useEffect(() => {
    if (value instanceof File) {
      // It's a File object - create a blob URL for preview
      const objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);
      
      // Cleanup blob URL on unmount or when value changes
      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof value === 'string') {
      // It's a URL string - use it directly
      setPreviewUrl(value);
    } else {
      // No value - clear preview
      setPreviewUrl(null);
    }
  }, [value]);

  const validateFile = async (file: File): Promise<boolean> => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File too large. Maximum size: ${maxSizeMB}MB`);
      return false;
    }

    // Check image dimensions (skip for SVG as they're vector-based)
    if (file.type !== 'image/svg+xml' && maxDimensions) {
      try {
        const dimensions = await getImageDimensions(file);
        if (dimensions.width > maxDimensions.width || dimensions.height > maxDimensions.height) {
          toast.error(`Image dimensions too large. Maximum: ${maxDimensions.width}x${maxDimensions.height}px`);
          return false;
        }
      } catch (error) {
        console.error('Failed to validate image dimensions:', error);
        toast.error('Failed to validate image. Please try another file.');
        return false;
      }
    }

    return true;
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  const handleFile = async (file: File) => {
    const isValid = await validateFile(file);
    if (!isValid) {
      return;
    }

    // Just call onChange with the file - parent will handle it
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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      fileInputRef.current.value = '';
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
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          uploading ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          previewUrl ? "p-2" : "p-6"
        )}
      >
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Business logo preview"
              className="w-full h-32 object-contain rounded-md"
            />
            
            {/* Remove button - always visible on mobile, hover on desktop */}
            {!uploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Upload overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  {dragActive ? (
                    <ImageIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 text-primary" />
                  )}
                </div>
                <p className="text-sm text-foreground mb-1 font-medium">
                  {dragActive ? 'Drop your logo here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
                </p>
                {maxDimensions && (
                  <p className="text-xs text-muted-foreground">
                    Max {maxDimensions.width}x{maxDimensions.height}px
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoUpload;

