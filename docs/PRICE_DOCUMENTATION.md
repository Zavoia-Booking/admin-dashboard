# Price Migration Documentation: DECIMAL → INTEGER Cents

## Overview

Migrated all price fields from `DECIMAL(10,2)` to `INTEGER` (cents) to standardize price representation as integer minor units end-to-end (avoiding JS floating-point precision issues) and align with industry best practices (Stripe, Shopify, etc.).

**Key Insight:** SQL `DECIMAL` was already precise—the precision problem occurs in JavaScript/TypeScript when prices are passed around as `number` floats. By storing prices as integer cents everywhere outside the UI, we no longer rely on JS `number` to represent `12.34` accurately.

**Storage Limits:** Using `INTEGER` cents gives a maximum per-service price of ~21 million units of currency (2,147,483,647 cents = $21,474,836.47), which is more than sufficient for this marketplace. This was a conscious choice over `BIGINT` for simplicity and performance.

---

## What We Changed

### Database Schema

Standardized all price storage on `INTEGER` (cents) instead of `DECIMAL(10,2)`.

#### Tables Modified

1. **`service` table**
   - ✅ **Added:** `price_amount_minor INTEGER NOT NULL`
   - ❌ **Removed:** `price DECIMAL(10,2)` (legacy column)

2. **`user_x_service` table**
   - ✅ **Changed:** `customPrice DECIMAL(10,2) NULL` → `customPrice INTEGER NULL`

3. **`appointment` table**
   - ✅ **Changed:** `price DECIMAL(10,2) NULL` → `price INTEGER NULL`

4. **`service_location_override` table**
   - ✅ **Changed:** `price DECIMAL(10,2) NOT NULL` → `price INTEGER NOT NULL`

#### Migration Approach

- Converted existing data: `ROUND(price * 100)` to transform decimals to cents
- Used PostgreSQL `ALTER COLUMN ... TYPE INTEGER USING ...` for direct conversion
- Verified conversion accuracy with sanity checks

---

## Backend Changes

### 1. TypeORM Entities (`src/entities/`)

**`service.entity.ts`:**
```typescript
// OLD: price DECIMAL(10,2)
// NEW:
@Column({
  nullable: false,
  type: 'integer',
  comment: 'Price in minor units (cents). For EUR/USD: 299 = 2.99',
})
price_amount_minor: number;
```

**`userService.entity.ts`:**
```typescript
// Changed from DECIMAL to INTEGER
@Column({
  nullable: true,
  type: 'integer',
  comment: 'User-specific price in minor units (cents)...',
})
customPrice: number | null;
```

**`appointment.entity.ts` & `serviceLocation.entity.ts`:**
- Changed `price` from `DECIMAL` to `INTEGER`

### 2. DTOs (`src/modules/service/dto/`)

**`create-service.dto.ts`:**
```typescript
// OLD: @IsNumber() price: number;
// NEW:
@IsInt()
@Min(0)
price_amount_minor: number; // Price in integer minor units (cents)
```

**`update-service.dto.ts`:**
- Changed to accept `price_amount_minor?: number` (INTEGER)

### 3. Controllers (`src/modules/service/`)

**`service.controller.ts`:**
- Accepts `price_amount_minor` directly (no conversion needed)
- Passes `businessCurrency` to mapper for display conversion
- Removed `priceToStorage` import (not needed here)

**`team.controller.ts`:**
- Converts `customPrice` and `service.price_amount_minor` from cents to decimal for display
- Uses `priceFromStorage()` for conversion

**`appointment.controller.ts`:**
- Uses `price_amount_minor` directly

### 4. Mappers (`src/utils/mappers/service.mapper.ts`)

**`mapServiceToResponse()`:**
```typescript
// Converts cents → decimal for API responses
const displayPrice = priceFromStorage(service.price_amount_minor, currency);
return {
  ...
  price: displayPrice, // Decimal format for frontend
};
```

### 5. Currency Utilities (`src/utils/currency.ts`)

Created conversion functions:

**`priceToStorage(displayPrice, currency)`:**
- Converts: `2.99` → `299` (decimal → cents)
- Uses currency-specific minor units (currently all currencies = 2 decimals)

**`priceFromStorage(amountMinor, currency)`:**
- Converts: `299` → `2.99` (cents → decimal)
- Handles null/undefined values

**Currency Metadata:**
- `CURRENCY_METADATA` map with icons, symbols, minor units
- `getCurrencyDisplay()` for UI display
- Supports: EUR, USD, RON, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, BGN, HRK, TRY

**Future-Proofing:** The metadata and helpers are ready for currencies with 0 or 3 decimals (e.g., JPY, BHD); we currently only use 2-decimal currencies. Adding JPY later is a config change, not a redesign.

### 6. API Convention

**Request Payloads:**
- Use `price_amount_minor` (integer cents)
- Example: `{ price_amount_minor: 299 }`

**Response Payloads:**
- Expose `price` (decimal) for convenience on the frontend
- Example: `{ price: 2.99 }`
- Conversion happens in `mapServiceToResponse()` using `priceFromStorage()`

This asymmetry is intentional: requests use cents (storage format), responses use decimals (display format) for better developer experience.

---

## Frontend Changes

### 1. PriceField Component (`src/shared/components/forms/fields/PriceField.tsx`)

**Key Changes:**
- Default `storageFormat` changed from `'decimal'` → `'cents'`
- Handles raw input while focused, formats on blur
- Normalizes decimal separators (comma/dot)
- Converts between display (decimal) and storage (cents) formats

**Features:**
- Right-aligned numeric input
- Thousand separators
- Currency icon/symbol display
- Mobile-friendly decimal keyboard
- Auto-select on focus

### 2. Service Forms

**`AddServiceSlider.tsx`:**
- Uses `PriceField` with `storageFormat="cents"`
- Sends `price_amount_minor` (cents) to backend
- Converts cents → decimal for confirm dialog display
- Gets currency from `currentUser.business.businessCurrency`

**`EditServiceSlider.tsx`:**
- Receives `price` (decimal) from backend response DTO (via `mapServiceToResponse`)
- Converts decimal price from backend → cents when loading form using `priceToStorage()`
- Sends `price_amount_minor` (cents) on update
- Uses `PriceField` with `storageFormat="cents"`

### 3. Type Definitions (`src/features/services/types.ts`)

**`CreateServicePayload`:**
```typescript
// OLD: price: number;
// NEW:
price_amount_minor: number; // Price in integer cents
```

**`EditServicePayload`:**
- Changed to `price_amount_minor: number`

### 4. Auth Types (`src/features/auth/types.ts`)

**Added to `AuthUser.business`:**
```typescript
business?: {
  ...
  businessCurrency?: string; // Comes from /auth/me endpoint
};
```

### 5. Currency Utilities (`src/shared/utils/currency.ts`)

- Frontend versions of `priceToStorage()` and `priceFromStorage()`
- `getCurrencyDisplay()` for UI (icons/symbols)
- Currency metadata matching backend

---

## Data Flow

### Creating a Service

```
User types: "2.99"
    ↓
PriceField converts: 2.99 → 299 (cents)
    ↓
Frontend sends: { price_amount_minor: 299 }
    ↓
Backend stores: price_amount_minor = 299 (INTEGER)
```

### Displaying a Service

```
Database: price_amount_minor = 299 (INTEGER)
    ↓
Mapper converts: 299 → 2.99 (using priceFromStorage)
    ↓
API response DTO: { price: 2.99 } (decimal)
    ↓
Frontend displays: "€2.99" or "$2.99"
```

### Editing a Service

```
Backend sends response DTO: { price: 2.99 } (decimal, from mapServiceToResponse)
    ↓
EditServiceSlider converts: 2.99 → 299 (cents, using priceToStorage)
    ↓
Form stores: price_amount_minor = 299
    ↓
User edits: changes to "3.50"
    ↓
PriceField converts: 3.50 → 350 (cents)
    ↓
Frontend sends: { price_amount_minor: 350 }
    ↓
Backend stores: price_amount_minor = 350
```

## Benefits

1. **Precision:** No floating-point errors in JavaScript/TypeScript
2. **Consistency:** All prices stored as integers end-to-end
3. **Industry Standard:** Matches Stripe/Shopify approach
4. **Type Safety:** Clear INTEGER type in database
5. **Currency Support:** Ready for currencies with different decimal places (0, 2, 3)
6. **Storage Efficiency:** INTEGER is sufficient for marketplace prices (~21M max)
7. **Maintainability:** Centralized conversion logic in currency utilities

---

## Architecture Decisions

### Why INTEGER instead of BIGINT?

- **Range:** INTEGER supports up to ~21 million currency units (2,147,483,647 cents)
- **Sufficiency:** More than enough for service prices in a marketplace
- **Performance:** Smaller storage footprint and faster operations
- **Simplicity:** Standard integer type, no need for bigint handling

### Why Request/Response Asymmetry?

- **Requests (cents):** Aligns with storage format, prevents conversion errors
- **Responses (decimals):** Better developer experience, matches UI expectations
- **Clear Boundary:** Conversion happens at API boundary (mapper), not scattered

### Why Centralized Currency Utilities?

- **DRY:** Single source of truth for conversion logic
- **Consistency:** Same logic on backend and frontend
- **Maintainability:** Easy to update for new currencies or decimal places
- **Testability:** Isolated functions are easy to unit test

---

## Future Considerations

### Not Implemented (Deferred)

- **Assignment Sliders:** `AddAssignmentSlider` and `EditAssignmentSlider` still use decimal format
  - Will be migrated separately when ready
  - Backend already supports INTEGER `customPrice`

### Currency Expansion

- **Ready for:** JPY (0 decimals), BHD (3 decimals)
- **How:** Just add to `CURRENCY_METADATA` with correct `minorUnits`
- **No Code Changes:** Existing conversion functions handle it automatically

## Quick Reference

### Conversion Functions

**Backend & Frontend:**
```typescript
// Decimal → Cents
priceToStorage(2.99, 'eur') // Returns: 299

// Cents → Decimal
priceFromStorage(299, 'eur') // Returns: 2.99
```

### API Usage

**Create Service:**
```typescript
POST /services/create
{
  "price_amount_minor": 299  // INTEGER cents
}
```

**Get Service:**
```typescript
GET /services/:id
Response: {
  "price": 2.99  // Decimal for display
}
```

### Database Schema

```sql
-- Services
price_amount_minor INTEGER NOT NULL

-- User Services
customPrice INTEGER NULL

-- Appointments
price INTEGER NULL

-- Service Location Overrides
price INTEGER NOT NULL
```

---

