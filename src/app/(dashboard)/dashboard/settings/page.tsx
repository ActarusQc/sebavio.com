import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  ProfileForm,
  PreferencesForm,
  ChangePasswordForm,
} from "@/features/users/components";
import {
  getCurrentUserWithProfile,
  getPreferences,
} from "@/features/users/services";

export default async function SettingsPage() {
  const authUser = await requireActiveUser();
  const [user, preferences] = await Promise.all([
    getCurrentUserWithProfile(authUser.id),
    getPreferences(authUser.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Paramètres"
        description="Profil et préférences de votre compte."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Informations personnelles et paramètres régionaux.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={user.profile} email={user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Modifiez le mot de passe de votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
          <CardDescription>
            Unités, notifications et suggestions IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
