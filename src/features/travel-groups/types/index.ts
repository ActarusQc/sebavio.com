export type TravelMemberDto = {
  id: string;
  groupId: string;
  firstName: string;
  birthDate: string | null;
  relationship: string | null;
  mobilityLevel: string | null;
  specialNeeds: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PetDto = {
  id: string;
  groupId: string;
  name: string;
  species: string | null;
  breed: string | null;
  weightKg: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TravelPreferencesDto = {
  groupId: string;
  maxDriveHours: string | null;
  dailyBudget: string | null;
  preferredCampgroundType: string | null;
  avoidTolls: boolean;
  avoidFerries: boolean;
  preferredActivityTypes: string[] | null;
  foodPreferences: string[] | null;
  accessibilityRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TravelGroupDto = {
  id: string;
  ownerUserId: string;
  name: string;
  defaultGroup: boolean;
  memberCount: number;
  petCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TravelGroupDetailDto = TravelGroupDto & {
  members: TravelMemberDto[];
  pets: PetDto[];
  preferences: TravelPreferencesDto | null;
};

export type PaginatedTravelGroups = {
  items: TravelGroupDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
