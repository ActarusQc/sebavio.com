/**
 * Sélection d'adresse structurée (Google Places Autocomplete).
 */
export type AddressSelection = {
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  streetNumber: string | null;
  route: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
};
