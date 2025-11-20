import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Image, Upload, X } from 'lucide-react';

interface MarketplaceImagesSectionProps {
  featuredImage?: string | null;
  portfolioImages?: string[] | null;
  onFeaturedImageChange: (imageUrl: string | null) => void;
  onPortfolioImagesChange: (images: string[]) => void;
}

export function MarketplaceImagesSection({
  featuredImage,
  portfolioImages,
  onFeaturedImageChange,
  onPortfolioImagesChange,
}: MarketplaceImagesSectionProps) {
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>(featuredImage || '');
  const [newPortfolioImageUrl, setNewPortfolioImageUrl] = useState<string>('');
  const images = portfolioImages || [];

  const handleAddFeaturedImage = () => {
    if (featuredImageUrl.trim()) {
      onFeaturedImageChange(featuredImageUrl.trim());
    }
  };

  const handleRemoveFeaturedImage = () => {
    setFeaturedImageUrl('');
    onFeaturedImageChange(null);
  };

  const handleAddPortfolioImage = () => {
    if (newPortfolioImageUrl.trim()) {
      const updatedImages = [...images, newPortfolioImageUrl.trim()];
      onPortfolioImagesChange(updatedImages);
      setNewPortfolioImageUrl('');
    }
  };

  const handleRemovePortfolioImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onPortfolioImagesChange(updatedImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Marketplace Images
        </CardTitle>
        <CardDescription>
          Add a featured image and portfolio images to showcase your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Featured Image Section */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Featured Image</h4>
            <p className="text-xs text-muted-foreground">
              Main image displayed on your marketplace listing
            </p>
          </div>

          {featuredImage ? (
            <div className="relative border rounded-lg p-4 bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{featuredImage}</p>
                  <p className="text-xs text-muted-foreground mt-1">Featured image</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFeaturedImage}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                onClick={handleAddFeaturedImage}
                disabled={!featuredImageUrl.trim()}
                className="flex-shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          )}
        </div>

        {/* Portfolio Images Section */}
        <div className="space-y-3 pt-4 border-t">
          <div>
            <h4 className="text-sm font-medium mb-1">Portfolio Images</h4>
            <p className="text-xs text-muted-foreground">
              Showcase your work with multiple images
            </p>
          </div>

          {/* Add New Portfolio Image */}
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/portfolio-image.jpg"
              value={newPortfolioImageUrl}
              onChange={(e) => setNewPortfolioImageUrl(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              onClick={handleAddPortfolioImage}
              disabled={!newPortfolioImageUrl.trim()}
              variant="outline"
              className="flex-shrink-0"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Display Portfolio Images */}
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.map((imageUrl, index) => (
                <div key={index} className="relative border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{imageUrl}</p>
                      <p className="text-xs text-muted-foreground mt-1">Image {index + 1}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePortfolioImage(index)}
                      className="flex-shrink-0 h-8 w-8"
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

