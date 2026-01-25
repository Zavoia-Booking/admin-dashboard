import { useRef, useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
} from "../../../../shared/components/ui/card";
import { Button } from "../../../../shared/components/ui/button";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { X, AlertCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../shared/lib/utils";
import { FullScreenImageCarousel } from "../../../marketplace/components/FullScreenImageCarousel";
import {
  uploadPortfolioImage,
  deletePortfolioImage,
  getPortfolioImages,
  type PortfolioImageData,
} from "../api";
import { useTranslation } from "react-i18next";

export interface PortfolioImage {
  tempId: string;
  url: string; // Server URL after upload or local blob URL during upload
  key?: string; // R2 key (present after upload)
  isUploading?: boolean; // True during upload
  isDeleting?: boolean; // True during delete
  uploadError?: string; // Error message if failed
  originalName?: string; // Filename for duplicate check
  size?: number; // Size for duplicate check
}

function getBentoGridClass(index: number): string {
  // Mobile: keep bento feel BUT no "big" tiles (no row-span-2). Only 1x1 and 2x1.
  // Desktop (md+): keep existing 5-col bento pattern (md: prefixed classes)
  const mobileClasses = [
    // row 1: two small tiles
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    // row 2: one wide tile
    "col-span-2 row-span-1",
    // row 3: two small tiles
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    // row 4: one wide tile
    "col-span-2 row-span-1",
    // row 5: two small tiles
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    // row 6: one wide tile
    "col-span-2 row-span-1",
    // row 7: two small tiles (if present)
    "col-span-1 row-span-1",
  ];

  const desktopClasses = [
    "md:col-span-2 md:row-span-2",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-2 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-2 md:row-span-1",
  ];

  return cn(
    // Let the grid's auto-rows drive height on mobile; keep md behavior unchanged.
    "aspect-auto",
    mobileClasses[index] ?? "col-span-1 row-span-1",
    desktopClasses[index] ?? ""
  );
}

interface ImageSkeletonProps {
  className?: string;
}

function ImageSkeleton({ className }: ImageSkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden w-full h-full",
        className
      )}
    >
      <Skeleton className="absolute inset-0 w-full h-full rounded-none bg-muted/70 dark:bg-neutral-800/60" />
    </div>
  );
}

interface PortfolioImagesSectionProps {
  isActive?: boolean;
}

export function PortfolioImagesSection({ isActive = true }: PortfolioImagesSectionProps) {
  const { t } = useTranslation("marketplace");
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const portfolioInputRef = useRef<HTMLInputElement | null>(null);
  const imagesRef = useRef<PortfolioImage[]>(images);
  const dragCounterRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Keep ref in sync with images
  imagesRef.current = images;

  const carouselImages = images.filter((img) => !!img.url && !img.uploadError);
  const carouselUrls = carouselImages.map((img) => img.url);
  const openCarouselByTempId = (tempId: string) => {
    const idx = carouselImages.findIndex((img) => img.tempId === tempId);
    if (idx < 0) return;
    setCarouselIndex(idx);
    setCarouselOpen(true);
  };

  // Fetch portfolio images only when tab becomes active (lazy loading)
  useEffect(() => {
    if (!isActive || hasFetched) return;
    
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        const portfolioImages = await getPortfolioImages();
        const mappedImages: PortfolioImage[] = portfolioImages.map((img: PortfolioImageData) => ({
          tempId: crypto.randomUUID(),
          url: img.url,
          key: img.key,
          originalName: img.originalName,
          size: img.size,
        }));
        setImages(mappedImages);
        setHasFetched(true);
      } catch (error) {
        console.error("Failed to fetch portfolio images:", error);
        toast.error(t("portfolio.errors.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, [isActive, hasFetched, t]);

  const MAX_PORTFOLIO_IMAGES = 10;
  const MAX_SIZE_MB = 10;
  const RECOMMENDED_SIZE_MB = 5;
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
  ];

  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    // Helper: Map file extension to MIME type
    const extensionToMimeType: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
    };

    const extension = file.name.split(".").pop()?.toLowerCase();
    let actualMimeType = file.type;
    if (!actualMimeType || actualMimeType === "application/octet-stream") {
      if (extension && extensionToMimeType[extension]) {
        actualMimeType = extensionToMimeType[extension];
      }
    }

    const formatAllowedTypes = (): string => {
      const formats = ALLOWED_TYPES.map((type) => type.split("/")[1].toUpperCase());
      if (formats.length === 1) return formats[0];
      if (formats.length === 2) return `${formats[0]} or ${formats[1]}`;
      return `${formats.slice(0, -1).join(", ")}, or ${
        formats[formats.length - 1]
      }`;
    };

    if (extension && !extensionToMimeType[extension]) {
      toast.error(
        t("portfolio.errors.unsupportedFormat", {
          extension: extension.toUpperCase(),
          formats: formatAllowedTypes(),
        })
      );
      return false;
    }

    if (!actualMimeType || !ALLOWED_TYPES.includes(actualMimeType)) {
      toast.error(
        t("portfolio.errors.unsupportedFormatGeneric", {
          formats: formatAllowedTypes(),
        })
      );
      return false;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(
        t("portfolio.errors.fileSizeExceeds", { size: MAX_SIZE_MB })
      );
      return false;
    }

    if (file.size > RECOMMENDED_SIZE_MB * 1024 * 1024) {
      toast.warning(t("portfolio.errors.fileSizeWarning"));
    }

    return true;
  }, [t]);

  const uploadFile = useCallback(async (file: File, tempId: string) => {
    try {
      const result = await uploadPortfolioImage(file);

      // Use a functional update to avoid race conditions with concurrent uploads
      setImages((currentImages) =>
        currentImages.map((img) =>
          img.tempId === tempId
            ? {
                ...img,
                url: result.url,
                key: result.key,
                isUploading: false,
                uploadError: undefined,
              }
            : img
        )
      );
      
    } catch (error) {
      console.error(`[Portfolio] Upload failed for ${file.name}:`, error);
      setImages((currentImages) =>
        currentImages.map((img) =>
          img.tempId === tempId
            ? { ...img, isUploading: false, uploadError: "Upload failed" }
            : img
        )
      );
      toast.error(t("portfolio.errors.uploadFailed", { name: file.name }));
    }
  }, [t]);

  const handlePortfolioFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentImages = imagesRef.current;
    const remainingSlots = MAX_PORTFOLIO_IMAGES - currentImages.length;
    if (remainingSlots <= 0) {
      toast.error(
        t("portfolio.errors.maxImages", { count: MAX_PORTFOLIO_IMAGES })
      );
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    // Check for duplicates within already uploaded images or currently uploading ones
    const newFilesToProcess = filesToProcess.filter((file) => {
      const isDuplicate = currentImages.some(
        (img) => img.originalName === file.name && img.size === file.size
      );
      if (isDuplicate) {
        toast.info(t("portfolio.errors.duplicateImage", { name: file.name }));
        return false;
      }
      return true;
    });

    if (newFilesToProcess.length === 0) return;

    const validationResults = await Promise.all(
      newFilesToProcess.map(async (file) => ({
        file,
        isValid: await validateFile(file),
      }))
    );

    const validFiles = validationResults
      .filter((result) => result.isValid)
      .map((result) => result.file);

    if (validFiles.length === 0) return;

    const newImages: PortfolioImage[] = validFiles.map((file) => ({
      tempId: crypto.randomUUID(),
      url: URL.createObjectURL(file), // Preview URL
      isUploading: true,
      originalName: file.name,
      size: file.size,
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Process uploads sequentially to avoid backend race conditions
    for (let i = 0; i < validFiles.length; i++) {
      await uploadFile(validFiles[i], newImages[i].tempId);
    }
  }, [t, validateFile, uploadFile]);

  const handlePortfolioFileChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handlePortfolioFiles(event.target.files);
    event.target.value = "";
  }, [handlePortfolioFiles]);

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter") {
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setDragActive(true);
      }
    } else if (event.type === "dragleave") {
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setDragActive(false);
      }
    }
  }, []);

  const handlePortfolioDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setDragActive(false);
    handlePortfolioFiles(event.dataTransfer.files);
  }, [handlePortfolioFiles]);

  const handlePortfolioDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleRemovePortfolioImage = useCallback(async (tempId: string) => {
    const currentImages = imagesRef.current;
    const imageToRemove = currentImages.find((img) => img.tempId === tempId);

    // If image has a key, it's saved on server - need to delete via API
    if (imageToRemove?.key) {
      // Set deleting state
      setImages((imgs) =>
        imgs.map((img) =>
          img.tempId === tempId ? { ...img, isDeleting: true } : img
        )
      );

      try {
        await deletePortfolioImage(imageToRemove.key);
        // Success - remove from local state
        setImages((imgs) =>
          imgs.filter((img) => img.tempId !== tempId)
        );
      } catch (error) {
        console.error("Delete failed:", error);
        // Reset deleting state
        setImages((imgs) =>
          imgs.map((img) =>
            img.tempId === tempId ? { ...img, isDeleting: false } : img
          )
        );
        toast.error(t("portfolio.errors.deleteFailed"));
      }
    } else {
      // Image not yet uploaded (still uploading or failed) - just remove from local state
      setImages((imgs) =>
        imgs.filter((img) => img.tempId !== tempId)
      );
    }
  }, [t]);

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-5xl mb-0 md:mb-8">
        <Card className="border-none pt-0 pb-2 sm:border shadow-none sm:shadow-sm bg-transparent md:bg-surface overflow-hidden">
          <CardContent className="p-0 sm:p-4 space-y-6">
            <div className="relative p-0 sm:p-2">
              <div className="relative space-y-6">
                <div className="space-y-4 mb-0 mt-3 md:mt-0">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-5 auto-rows-[184px] md:auto-rows-[180px]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn("rounded-2xl overflow-hidden", getBentoGridClass(i))}>
                      <Skeleton className="w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mb-0 md:mb-8">
      <Card className="border-none pt-0 pb-2 sm:border shadow-none sm:shadow-sm bg-transparent md:bg-surface overflow-hidden">
        <CardContent className="p-0 sm:p-4 space-y-6">
          <div className="relative p-0 sm:p-2">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full -translate-y-10 translate-x-10 blur-3xl pointer-events-none"></div>

            <div className="relative space-y-6">
              {/* Description & Status */}
              <div className="space-y-4 mb-0 mt-3 md:mt-0">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-foreground-1 flex items-center gap-2">
                    {t("portfolio.visualIdentity.title")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("portfolio.visualIdentity.teamMemberDescription")}
                  </p>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="space-y-4">
                <div className={cn(
                  "grid gap-4 grid-cols-2 md:grid-cols-5 auto-rows-[184px] md:auto-rows-[180px]",
                  images.length === 0 && "min-h-58 md:min-h-78 grid-rows-1 grid-cols-1 md:max-w-1/2 mt-8 md:mb-14"
                )}>
                  {images.map((image, index) => {
                    return (
                      <div
                        key={image.tempId}
                        className={cn(
                          "group relative overflow-hidden rounded-2xl border bg-surface dark:bg-neutral-900 shadow-sm transition-all duration-300",
                          getBentoGridClass(index)
                        )}
                      >
                        <div
                          className={cn(
                            "relative w-full h-full overflow-hidden rounded-2xl bg-muted",
                            !image.isUploading && !image.isDeleting && !image.uploadError && "cursor-pointer"
                          )}
                          onClick={() => {
                            if (image.isUploading || image.isDeleting || image.uploadError) return;
                            openCarouselByTempId(image.tempId);
                          }}
                          role="button"
                        >
                          {/* Status Overlays */}
                          {(image.isUploading || image.isDeleting) && (
                            <div className="absolute inset-0 z-10">
                              <ImageSkeleton className="rounded-2xl" />
                            </div>
                          )}

                          {image.uploadError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 backdrop-blur-sm z-10 gap-1 px-2 text-center">
                              <AlertCircle className="text-destructive mb-1 h-4 w-4" />
                              <span className="font-bold text-destructive leading-tight uppercase text-[8px]">
                                {image.uploadError}
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="font-bold rounded-full mt-1 h-6 px-2 text-[8px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePortfolioImage(image.tempId);
                                }}
                              >
                                {t("portfolio.remove")}
                              </Button>
                            </div>
                          )}

                          <img
                            src={image.url || undefined}
                            alt={t("portfolio.altText.portfolioItem")}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          
                          {/* Hover Actions Overlay */}
                          {!image.isUploading && !image.isDeleting && !image.uploadError && (
                            <div className="absolute inset-0 bg-transparent md:bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 z-20">
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                rounded="full"
                                className={cn(
                                  "absolute top-2 right-2 !min-h-8 !min-w-8 ",
                                  "shadow-xl active:scale-95 transition-all duration-200 backdrop-blur-md",
                                  // Darker background for better contrast over images
                                  "bg-black/60 hover:bg-black/70 border border-white/15 text-white"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePortfolioImage(image.tempId);
                                }}
                                title={t("portfolio.removeImage")}
                              >
                                <X className="!h-3.5 !w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Upload Card */}
                  {images.length < MAX_PORTFOLIO_IMAGES && (
                    <div
                      className={cn(
                        "group relative cursor-pointer mt-1.5 transition-all duration-300",
                        images.length === 0 ? "col-span-2 md:col-span-5 aspect-video md:aspect-auto" : getBentoGridClass(images.length)
                      )}
                      onClick={() => portfolioInputRef.current?.click()}
                      onDrop={handlePortfolioDrop}
                      onDragOver={handlePortfolioDragOver}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                    >
                      <input
                        ref={portfolioInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePortfolioFileChange}
                      />

                      {/* Stacked Cards Illustration */}
                      <div className="absolute inset-0">
                        <div className={cn(
                          "absolute inset-0 rounded-2xl border-2 border-dashed border-border bg-surface dark:bg-neutral-900/40 md:bg-neutral-100/40 md:dark:bg-neutral-800/20 transition-all duration-500",
                          images.length === 0 
                            ? "rotate-[4deg] translate-y-3 translate-x-2 md:rotate-[2deg] md:translate-y-2 md:translate-x-2 md:group-hover:rotate-[4deg] md:group-hover:translate-y-3" 
                            : "rotate-[8deg] translate-y-2 translate-x-3 md:rotate-[4deg] md:translate-y-2 md:translate-x-1.5 md:group-hover:rotate-[8deg] md:group-hover:translate-y-2 md:group-hover:translate-x-3"
                        )}></div>
                        <div className={cn(
                          "absolute inset-0 rounded-2xl border-2 border-dashed border-border bg-surface dark:bg-neutral-900/55 md:bg-neutral-100/60 md:dark:bg-neutral-800/40 transition-all duration-500",
                          images.length === 0 
                            ? "rotate-[-3deg] -translate-y-2 -translate-x-1 md:rotate-[-1deg] md:-translate-y-1 md:-translate-x-1 md:group-hover:rotate-[-3deg] md:group-hover:-translate-y-2" 
                            : "rotate-[-6deg] -translate-y-1 -translate-x-2 md:rotate-[-2deg] md:-translate-y-1 md:-translate-x-1 md:group-hover:rotate-[-6deg] md:group-hover:-translate-y-1 md:group-hover:-translate-x-2"
                        )}></div>
                        
                        <div className={`absolute inset-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
                          dragActive 
                            ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(var(--primary),0.3)] ring-2 ring-primary/20 scale-[0.98]" 
                            : "border-primary/50 bg-surface-hover dark:bg-neutral-900 shadow-xl md:border-muted-foreground/20 md:bg-surface md:shadow-lg md:group-hover:border-primary/50 md:group-hover:shadow-xl md:group-hover:bg-surface-hover"
                        }`}>
                          <div className="relative flex flex-col items-center gap-4 z-10 text-center px-6">
                            <div className={cn(
                              "flex items-center justify-center rounded-full bg-background border shadow-sm transition-all duration-300",
                              images.length === 0 ? "h-18 w-18" : "h-12 w-12",
                              dragActive ? 'border-primary text-primary scale-110 shadow-primary/20' : 'text-primary border-primary/50 md:text-muted-foreground md:group-hover:text-primary md:group-hover:border-primary/50'
                            )}>
                              <UploadCloud className={images.length === 0 ? "h-8 w-8" : "h-6 w-6"} />
                            </div>
                            <div className="space-y-2">
                              <p className={cn(
                                "font-bold text-foreground-1 tracking-tight transition-all duration-300",
                                images.length === 0 ? "text-lg" : "text-sm"
                              )}>
                                {dragActive ? t("portfolio.dropToUpload") : t("portfolio.uploadPhotos")}
                              </p>
                              <p className={cn(
                                "font-medium text-foreground-3 dark:text-foreground-2 transition-all duration-300",
                                images.length === 0 ? "text-sm" : "text-[10px]"
                              )}>
                                {dragActive ? t("portfolio.releaseNow") : t("portfolio.dragAndDrop")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex mt-8 border border-border md:border-border bg-surface md:bg-transparent rounded-2xl items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 dark:bg-primary/20 border border-primary/10 dark:border-primary/30 flex items-center justify-center shrink-0">
                      <UploadCloud className="h-5 w-5 text-foreground-3 dark:text-foreground-1" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground-1">
                        {t("portfolio.professionalGallery")}
                      </p>
                      <p className="text-[11px] text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {t("portfolio.uploadDescription", { count: MAX_PORTFOLIO_IMAGES })}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface md:bg-muted/50 border border-border-strong md:border-border text-[11px] font-medium text-foreground-2 dark:text-foreground-1 shrink-0">
                      {images.length}/{MAX_PORTFOLIO_IMAGES}
                    <span>{t("portfolio.images")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FullScreenImageCarousel
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
        images={carouselUrls}
        initialIndex={carouselIndex}
      />
    </div>
  );
}
