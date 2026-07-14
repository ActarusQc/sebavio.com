/**
 * Feature `users` — profils, préférences, paramètres (Partie 7).
 */

export {
  updateProfileSchema,
  updatePreferencesSchema,
  type UpdateProfileInput,
  type UpdatePreferencesInput,
} from "./schemas";

export type {
  UserProfileDto,
  UserPreferencesDto,
  CurrentUserDto,
} from "./types";

export {
  currencyForCountry,
  defaultProfileData,
  defaultPreferencesData,
  ensureProfile,
  ensurePreferences,
  getCurrentUserWithProfile,
  getPreferences,
  updateProfile,
  updatePreferences,
} from "./services";

export {
  updateProfileAction,
  updatePreferencesAction,
  type UsersActionResult,
} from "./actions";

export { ProfileForm, PreferencesForm } from "./components";
