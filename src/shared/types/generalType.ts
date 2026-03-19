export type BusinessInfo = {
  name: string;
  industryId: number;
  description: string;
  logo?: File | string; // Can be File during upload or string URL after upload
  logoKey?: string; // R2/S3 key for the uploaded logo
  email: string;
  phone: string;
  timezone: string;
  country: string;
  countryCode?: string; // ISO 3166-1 alpha-2 country code (e.g., "ro", "de")
  stripeCurrency?: string; // Optional - backend defaults to 'eur'
  businessCurrency: string; // Required - for service pricing
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  websiteUrl: string;
  pinterestUrl: string;
}
