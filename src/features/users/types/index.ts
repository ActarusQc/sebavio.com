export type HomeAddressDto = {
  label: string;
  placeId: string;
  latitude: number;
  longitude: number;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
};

export type UserProfileDto = {
  userId: string;
  firstName: string;
  lastName: string;
  language: string;
  country: string;
  currency: string;
  timezone: string;
  travelStyle: string | null;
  budgetLevel: string | null;
  homeAddress: HomeAddressDto | null;
  updatedAt: string;
};

export type UserPreferencesDto = {
  userId: string;
  distanceUnit: string;
  temperatureUnit: string;
  fuelUnit: string;
  notificationsEnabled: boolean;
  aiProactive: boolean;
  costcoMember: boolean;
  updatedAt: string;
};

export type CurrentUserDto = {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: string | null;
  profile: UserProfileDto;
};
