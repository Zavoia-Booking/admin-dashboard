import {
  Wifi,
  SquareParking,
  ParkingMeter,
  Snowflake,
  PawPrint,
  Baby,
  Bike,
  Umbrella,
  DoorClosed,
  ShowerHead,
  Lock,
  Accessibility,
  Ear,
  Hand,
  Dog,
  Banknote,
  CreditCard,
  Apple,
  Wallet,
  Landmark,
  ReceiptText,
  Leaf,
  Sprout,
  Recycle,
  Rabbit,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps a location marketplace tag `slug` to a lucide icon. Slugs are unique across all 6 tag groups
 * (amenities / accessibility / payment methods / values / audience / languages), so one flat map covers
 * every group. The tag data carries no icon, so this module is the single source of truth for tag glyphs,
 * reused wherever a location's tags are rendered.
 *
 * Only slugs with a genuinely meaningful, distinct glyph are mapped. Identity/ownership tags
 * (women-owned, audience targeting, etc.) and languages are intentionally left out — a forced or
 * reductive icon is worse than none, so callers render no icon when `tagIcon` returns `undefined`.
 * Add a row here when a new tag slug is seeded and a sensible glyph exists.
 */
const TAG_ICONS: Record<string, LucideIcon> = {
  // Amenities
  wifi: Wifi,
  "parking-onsite": SquareParking,
  "parking-street": ParkingMeter,
  "air-conditioning": Snowflake,
  "pet-friendly": PawPrint,
  "kid-friendly": Baby,
  "bike-parking": Bike,
  "outdoor-seating": Umbrella,
  "private-treatment-room": DoorClosed,
  showers: ShowerHead,
  lockers: Lock,
  // Accessibility
  "step-free-entrance": Accessibility,
  "hearing-loop": Ear,
  "sign-language-available": Hand,
  "service-animals-welcome": Dog,
  // Payment methods
  cash: Banknote,
  card: CreditCard,
  "apple-pay": Apple,
  "google-pay": Wallet,
  "bank-transfer": Landmark,
  "corporate-invoice": ReceiptText,
  // Values
  vegan: Sprout,
  "eco-conscious": Leaf,
  "zero-waste": Recycle,
  "cruelty-free": Rabbit,
};

export const tagIcon = (slug: string): LucideIcon | undefined => TAG_ICONS[slug];
