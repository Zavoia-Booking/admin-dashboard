# Image Upload Strategy & Implementation Plan

## Overview

This document outlines the image upload strategy for our B2B SaaS booking/business management application. It covers both logo uploads (current priority) and photo uploads (future implementation).

---

## 🎯 Current Focus: Logo Upload

### Status: Implementation Phase 1

### UX Approach: Soft Limits (Non-Blocking)

**UI Messages:**
```
Logo: "SVG recommended. Raster ideal 512–1024 px, ≤2 MB. 
If larger, we'll optimize it automatically."

Photo (future): "Ideal 1200–2400 px, ≤5 MB. 
We accept larger images — we'll resize them automatically."
```

**Behavior:**
- If exceeds recommendation but under hard-cap → Allow upload + show banner: "Optimizing..."
- Instant preview from client, replaced with optimized version when backend returns

---

## 📋 Implementation Plan

### Phase 1: Logo Upload (Current Priority)

#### Frontend Changes

**Current State:**
- ❌ Hard blocking on size > 2MB
- ❌ Hard blocking on dimensions > 2000x2000px
- ❌ Error toast blocks upload

**Target State:**
- ✅ Soft limits with warnings (non-blocking)
- ✅ Clear UI messages with recommendations
- ✅ Instant preview (blob URL)
- ✅ Replace preview with optimized version when backend returns

**Implementation:**
1. **LogoUpload.tsx** - Change validation from blocking to warning:
   ```typescript
   // Instead of:
   if (file.size > maxSizeBytes) {
     toast.error(`File too large. Maximum size: ${maxSizeMB}MB`);
     return false; // ❌ Blocks
   }

   // Use:
   if (file.size > maxSizeBytes) {
     toast.warning(
       `File is ${(file.size / 1024 / 1024).toFixed(1)}MB. ` +
       `We'll optimize it automatically.`
     );
     // ✅ Allows upload
   }
   ```

2. **UI Messages:**
   - Update placeholder text: "SVG recommended. Raster ideal 512–1024 px, ≤2 MB. If larger, we'll optimize it automatically."
   - Show optimization banner when file exceeds recommendations

3. **Preview:**
   - Keep instant blob URL preview
   - Replace with optimized version when backend returns URL

#### Backend Changes

**Current State:**
- ✅ SVG sanitization (DOMPurify)
- ✅ WebP conversion (Q=90)
- ✅ Metadata stripping
- ✅ Auto-rotate based on EXIF

**Target State:**
- ✅ Add automatic resize for raster logos (max 1024px on longest side)
- ✅ Keep SVG as-is (vector format)
- ✅ WebP Q=90 (not lossless - good balance)

**Implementation:**
1. **upload.service.ts** - Add resize logic for logos:
   ```typescript
   // For raster logos (not SVG/WebP):
   if (isLogo && mimeType !== 'image/svg+xml' && mimeType !== 'image/webp') {
     const metadata = await sharp(buffer).metadata();
     const maxDimension = 1024;
     
     if (metadata.width > maxDimension || metadata.height > maxDimension) {
       sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
         fit: 'inside',
         withoutEnlargement: true
       });
     }
   }
   ```

2. **Upload Config:**
   - Keep MAX_LOGO_SIZE: 2MB (hard limit backend)
   - Keep MAX_LOGO_DIMENSIONS: 2000x2000px (hard limit backend)
   - Add SOFT_RECOMMENDATION_SIZE: 2MB
   - Add SOFT_RECOMMENDATION_DIMENSIONS: 512-1024px

#### Validation Strategy

**Frontend (Soft Limits):**
- Size: Warning if > 2MB, but allow upload up to 2MB
- Dimensions: Warning if > 1024px, but allow upload up to 2000x2000px
- Type: Block invalid types (security)

**Backend (Hard Limits):**
- Size: Hard reject if > 2MB
- Dimensions: Hard reject if > 2000x2000px
- Type: Magic bytes validation (not just MIME)
- Signature validation for all image types

---

## 🔮 Phase 2: Photo Upload (Future)

### Use Cases
- Location photos
- Service photos
- Portfolio images
- Hero backgrounds

### UX Approach

**UI Messages:**
```
Photo: "Ideal 1200–2400 px, ≤5 MB. 
We accept larger images — we'll resize them automatically."
```

**Behavior:**
- Allow uploads up to hard-cap (10MB, 25–36 MP)
- Show optimization banner for large files
- Instant preview, replaced with optimized variants

### Validation & Classification

#### Content Type Detection

**Frontend + Backend:**
- User selection: Logo vs Photo
- Heuristics:
  - SVG → Logo
  - PNG/JPG with alpha channel or few colors → Probably Logo
  - HEIC/JPEG with EXIF data → Probably Photo
  
**Backend:**
- Magic-bytes sniffing (don't rely only on MIME)
- File signature validation

#### Limits

**Soft Limits (Frontend):**
- Logo: 2 MB, 512–1024 px recommended
- Photo: 5 MB, 1200–2400 px recommended

**Hard Caps (Backend):**
- Logo: ≤ 2 MB, ≤ 2000x2000px
- Photo: ≤ 10 MB, ≤ 25–36 MP (e.g., 6000x4000px)
- Clear error messages if exceeded

### Processing Pipeline (Backend)

#### Common Processing (All Images)

1. **Auto-rotate** based on EXIF orientation
2. **sRGB normalization** (color space standardization)
3. **Strip EXIF/GPS** metadata (privacy)
4. **Magic-bytes validation** (security)

#### Logo Processing

**SVG:**
- Strict sanitization:
  - Remove `<script>` tags
  - Remove event handlers (onclick, onerror, etc.)
  - Remove `<foreignObject>`, `<iframe>`, `<embed>`, `<object>`
  - Remove external `xlink:href` references
  - Remove exotic filters
- Keep SVG format (vector)

**Raster (PNG, JPEG, etc.):**
- Normalize to max 1024px on longest side
- WebP lossless (preserve transparency)
- Quality: 90

#### Photo Processing

**Resize Logic:**
- If max(w, h) > 3000–4096px → Resize to that threshold
- Maintain aspect ratio

**Encoding:**
- WebP Q=78–82 (adjust based on file size)
- Lower Q for very large images to reduce file size

**Generate Variants:**
- **400px** (longest side) - Thumbnails, lists
- **1024px** (longest side) - Cards, medium views
- **1920px** (longest side) - Full-width, hero images
- **256px square** (optional) - Dense lists, avatars

**Optimization:**
- Avoid re-conversion if input is already WebP with conforming dimensions/quality
- Use srcset/sizes for responsive delivery

### Quality & Format Policies

**Logo:**
- Format: SVG (preferred) or WebP lossless
- Size: Max 1024px longest side
- Quality: 90 (lossless for transparency)

**Photo:**
- Format: WebP Q=78–82
- Variants: 400px / 1024px / 1920px (+ 256px square optional)
- Lower Q for very large images
- Preserve transparency (alpha channel)

---

## 🏗️ Technical Architecture

### Storage Strategy

**Current:**
- Cloudflare R2 (S3-compatible)
- Folder structure: `wizard-drafts/{uuid}/logo/`, `logos/`, `images/`

**Future (Photos):**
- Folder structure: `photos/{type}/{uuid}/`
- Variants: `photos/{type}/{uuid}/400.webp`, `1024.webp`, `1920.webp`, `256.webp`

### Processing Flow

```
1. Frontend: Soft validation (warning, not blocking)
2. Upload to backend
3. Backend: Hard validation (magic bytes, size, dimensions)
4. Classification: Logo vs Photo
5. Processing:
   - Logo: Resize to 1024px, WebP Q=90
   - Photo: Generate variants (400/1024/1920px), WebP Q=78-82
6. Upload variants to R2
7. Return URLs to frontend
8. Frontend: Replace preview with optimized version
```

### Asynchronous Processing

**For Large Files (> 5MB):**
- Queue-based processing (background jobs)
- Immediate response with "processing" status
- Webhook/notification when complete
- Simple telemetry (processing time, size reduction)

### CDN & Delivery

**Current:**
- Cloudflare R2 with public URL

**Future:**
- CDN integration for global delivery
- srcset/sizes for responsive images
- Aggressive caching headers
- Lazy loading for gallery views

---

## 📊 Comparison: Current vs. Proposed

### Logo Upload

| Aspect | Current | Proposed (Phase 1) |
|--------|---------|-------------------|
| Frontend Validation | Hard blocking | Soft limits + warnings |
| UI Messages | Error toasts | Recommendation messages |
| Backend Resize | ❌ No | ✅ Max 1024px |
| WebP Quality | 90 | 90 (same) |
| Metadata Stripping | ✅ Yes | ✅ Yes |
| SVG Sanitization | ✅ Yes | ✅ Yes |
| Preview | Blob URL | Blob URL → Optimized |

### Photo Upload (Future)

| Aspect | Current | Proposed (Phase 2) |
|--------|---------|-------------------|
| Multiple Variants | ❌ No | ✅ 400/1024/1920px |
| Classification | ❌ No | ✅ Logo vs Photo |
| Hard Caps | 10MB images | 10MB / 36MP |
| Quality Adjustment | Fixed 90 | Dynamic 78-82 |
| Square Thumbnails | ❌ No | ✅ 256px optional |

---

## ✅ Implementation Checklist

### Phase 1: Logo Upload (Current)

#### Frontend
- [ ] Change `LogoUpload.tsx` validation from blocking to warning
- [ ] Update UI messages with recommendations
- [ ] Add optimization banner for files exceeding recommendations
- [ ] Keep instant preview (blob URL)
- [ ] Replace preview with optimized version when backend returns

#### Backend
- [ ] Add resize logic for raster logos (max 1024px)
- [ ] Keep SVG as-is (no resize)
- [ ] Maintain WebP Q=90
- [ ] Keep existing sanitization and metadata stripping

#### Testing
- [ ] Test soft limits (warning, not blocking)
- [ ] Test backend resize for large logos
- [ ] Test SVG sanitization
- [ ] Test metadata stripping
- [ ] Test preview replacement flow

### Phase 2: Photo Upload (Future)

#### Frontend
- [ ] Create `PhotoUpload` component (similar to `LogoUpload`)
- [ ] Add photo classification UI
- [ ] Implement soft limits for photos
- [ ] Add variant selection/preview

#### Backend
- [ ] Implement logo vs photo classification
- [ ] Add photo processing pipeline
- [ ] Generate multiple variants (400/1024/1920px)
- [ ] Add square thumbnail generation (256px)
- [ ] Implement dynamic quality adjustment
- [ ] Add queue system for large files

#### Infrastructure
- [ ] Set up background job queue (Bull/BullMQ)
- [ ] Implement webhook notifications
- [ ] Add CDN integration
- [ ] Implement srcset/sizes delivery

---

## 🔒 Security Considerations

### Current (Logo)
- ✅ SVG sanitization (DOMPurify)
- ✅ File signature validation (magic bytes)
- ✅ MIME type validation
- ✅ Size limits (2MB)
- ✅ Metadata stripping

### Future (Photos)
- ✅ All logo security measures
- ✅ Additional validation for photo-specific formats
- ✅ Virus scanning (optional, for user-uploaded content)
- ✅ Content moderation (optional, for public-facing photos)

---

## 📈 Performance Considerations

### Current
- Logo upload: Synchronous processing (fast enough for < 2MB)
- Single variant: No variant generation overhead

### Future (Photos)
- Large files: Asynchronous queue processing
- Multiple variants: Parallel generation
- CDN delivery: Reduce server load
- Lazy loading: Improve initial page load

---

## 📝 Notes

### Why Not Lossless for Logo?
- Lossless WebP is larger in file size
- Q=90 provides excellent quality with smaller size
- Transparency is preserved at Q=90
- Better balance for web delivery

### Why Multiple Variants for Photos?
- Responsive design: Serve appropriate size per device
- Performance: Smaller files for thumbnails, larger for full view
- Bandwidth savings: Mobile users get smaller variants
- Better UX: Faster loading times

### Why Soft Limits?
- Better UX: Users aren't frustrated by strict blocks
- Flexibility: Accepts professional assets (high-res logos/photos)
- Backend processing: Handles optimization automatically
- Industry standard: Matches practices of successful SaaS platforms

---

## 🚀 Next Steps

1. **Immediate (Phase 1):**
   - Implement soft limits in `LogoUpload.tsx`
   - Add backend resize for logos
   - Update UI messages
   - Test and deploy

2. **Short-term:**
   - Monitor logo upload patterns
   - Gather user feedback
   - Refine recommendations

3. **Long-term (Phase 2):**
   - Plan photo upload feature
   - Design variant generation system
   - Set up queue infrastructure
   - Implement classification logic

---

## 📚 References

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WebP Best Practices](https://developers.google.com/speed/webp)
- [Image Optimization Guide](https://web.dev/fast/)
- [DOMPurify SVG Sanitization](https://github.com/cure53/DOMPurify)

---

**Last Updated:** 2025
**Status:** Phase 1 (Logo) - Implementation
**Phase 2 (Photos) - Planning**

