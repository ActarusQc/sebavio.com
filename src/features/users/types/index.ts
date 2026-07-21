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
