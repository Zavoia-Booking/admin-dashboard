export type BusinessInfo = {
  name: string;
  industryId: number;
  description: string;
  logo?: File;
  email: string;
  phone: string;
  timezone: string;
  country: string;
  stripeCurrency?: string; // Optional - backend defaults to 'eur'
  businessCurrency: string; // Required - for service pricing
  instagramUrl: string;
  facebookUrl: string;
}
