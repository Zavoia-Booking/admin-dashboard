export function composeFullAddress(
  street: string,
  streetNumber: string,
  city: string,
  postalCode: string,
  country: string,
): string {
  const base = streetNumber?.trim() ? `${street} ${streetNumber.trim()}` : street;
  const tail = [city?.trim(), postalCode?.trim(), country?.trim()].filter(Boolean).join(', ');
  return tail ? `${base}, ${tail}` : base;
}


