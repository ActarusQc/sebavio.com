/**
 * Feature `users` — profils, préférences, paramètres (Partie 7).
 */

export {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type UpdatePreferencesInput,
  type ChangePasswordInput,
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
  changePassword,
} from "./services";

export {
  updateProfileAction,
  updatePreferencesAction,
  changePasswordAction,
  type UsersActionResult,
} from "./actions";

export { ProfileForm, PreferencesForm, ChangePasswordForm } from "./components";
