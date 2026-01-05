import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Image, X, Star } from 'lucide-react';

export interface PortfolioImage {
  tempId: string;
  url: string;
  file?: File;
}

interface MarketplaceImagesSectionProps {
  featuredImageId?: string | null;
  portfolioImages?: PortfolioImage[];
  onFeaturedImageChange: (tempId: string | null) => void;
  onPortfolioImagesChange: (images: PortfolioImage[]) => void;
}

export function MarketplaceImagesSection({
  featuredImageId,
  portfolioImages,
  onFeaturedImageChange,
  onPortfolioImagesChange,
}: MarketplaceImagesSectionProps) {
  const images = portfolioImages || [];
  const featured = featuredImageId || null;

  const portfolioInputRef = useRef<HTMLInputElement | null>(null);

  // Ensure a single portfolio image becomes featured by default
  useEffect(() => {
    if (!featured && images.length === 1) {
      onFeaturedImageChange(images[0].tempId);
    }
  }, [featured, images, onFeaturedImageChange]);

  const handlePortfolioFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: PortfolioImage[] = Array.from(files).map((file) => ({
      tempId: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    }));
    const updatedImages = [...images, ...newImages];
    onPortfolioImagesChange(updatedImages);

    // If no featured image is set yet, default to the first uploaded image
    if (!featured && updatedImages.length > 0) {
      onFeaturedImageChange(updatedImages[0].tempId);
    }
  };

  const handlePortfolioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handlePortfolioFiles(event.target.files);
    event.target.value = '';
  };

  const handlePortfolioDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handlePortfolioFiles(event.dataTransfer.files);
  };

  const handlePortfolioDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemovePortfolioImage = (tempId: string) => {
    const updatedImages = images.filter((img) => img.tempId !== tempId);
    onPortfolioImagesChange(updatedImages);
    
    // If removed image was featured, clear or set to first remaining
    if (featured === tempId) {
      onFeaturedImageChange(updatedImages.length > 0 ? updatedImages[0].tempId : null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Marketplace Images
        </CardTitle>
        <CardDescription>
          Manage the images that will appear on your marketplace listing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-w-3xl mx-auto">
        {/* Featured Image Preview */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Featured image</h4>
            <p className="text-xs text-muted-foreground">
              Upload portfolio images below, then choose one to highlight your business.
            </p>
          </div>

          <div className="flex flex-col gap-4 items-stretch">
            <div className="flex-1 min-w-0">
              <div className="relative overflow-hidden rounded-xl border bg-muted/40 aspect-video flex items-center justify-center">
                {featured ? (
                  <img
                    src={images.find(img => img.tempId === featured)?.url || ''}
                    alt="Featured"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4 py-8 text-muted-foreground gap-2">
                    <Star className="h-8 w-8" />
                    <p className="text-xs max-w-xs">
                      No featured image yet. Upload portfolio images below, then choose one to
                      highlight your business.
                    </p>
                  </div>
                )}

                {featured && (
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground flex items-center gap-1 px-2 py-0.5 text-[11px]">
                      <Star className="h-3 w-3" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Images Section */}
        <div className="space-y-3 pt-4 border-t">
          <div>
            <h4 className="text-sm font-medium mb-1">Portfolio images</h4>
            <p className="text-xs text-muted-foreground">
              Showcase your work with multiple images. These are stored in memory until you
              publish your listing.
            </p>
          </div>

          {/* Add New Portfolio Images (upload / drag & drop) */}
          <div
            className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-6 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => portfolioInputRef.current?.click()}
            onDrop={handlePortfolioDrop}
            onDragOver={handlePortfolioDragOver}
          >
            <input
              ref={portfolioInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePortfolioFileChange}
            />
            <Image className="h-8 w-8 text-muted-foreground mb-1" />
            <p className="text-xs font-medium">
              Click to upload or drag &amp; drop images
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Add multiple images to build a rich portfolio. You can choose any of them as your
              featured image.
            </p>
          </div>

          {/* Display Portfolio Images */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((image) => (
                <div
                  key={image.tempId}
                  className="group relative overflow-hidden rounded-xl border bg-muted/30 shadow-sm flex flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={image.url}
                      alt={`Portfolio ${image.tempId}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {featured === image.tempId && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary text-primary-foreground flex items-center gap-1 px-2 py-0.5 text-[11px]">
                          <Star className="h-3 w-3" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-2 gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={featured === image.tempId}
                      className="h-7 px-2 text-[11px] flex items-center gap-1 transition-colors"
                      onClick={() => onFeaturedImageChange(image.tempId)}
                    >
                      <Star
                        className={
                          'h-3 w-3 ' +
                          (featured === image.tempId ? 'text-primary' : 'text-muted-foreground')
                        }
                      />
                      <span
                        className={
                          featured === image.tempId ? 'text-primary font-medium' : 'text-foreground'
                        }
                      >
                        {featured === image.tempId ? 'Featured' : 'Set as featured'}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePortfolioImage(image.tempId)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No portfolio images added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add images to showcase your work</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
