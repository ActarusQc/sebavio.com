import Link from "next/link";
import { PageHeader } from "@/components/common";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { requireActiveUser } from "@/features/auth";
import { CheckoutButton } from "@/features/subscriptions/components/checkout-button";
import { PassStatusCard } from "@/features/subscriptions/components/pass-status-card";
import {
  formatPassPrice,
  formatPlusPrice,
} from "@/features/subscriptions/lib/format-price";
import type { AccessLevel } from "@/features/subscriptions/lib/access-levels";
import { resolveUserAccess } from "@/features/subscriptions/services/access-resolve";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
};

const LEVEL_LABELS: Record<AccessLevel, string> = {
  admin: "Administration",
  sebavio_plus: "Sebavio Plus",
  pass_30_jours: "Pass 30 jours",
  decouverte: "Découverte",
};

export default async function SubscriptionPage({ searchParams }: PageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const access = await resolveUserAccess(user.id);

  let plusSubscription: {
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null = null;

  if (access.subscriptionId) {
    const sub = await prisma.stripeSubscription.findUnique({
      where: { id: access.subscriptionId },
      select: {
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });
    if (sub) {
      plusSubscription = {
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      };
    }
  }

  const checkoutPending = params.checkout === "success";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Abonnement"
        description="Votre forfait Sebavio, Pass et options de paiement."
      />

      {checkoutPending ? (
        <p
          className="border-sebavio-teal/30 bg-sebavio-teal-soft/50 text-sebavio-navy rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          Paiement en cours de confirmation. Votre accès sera mis à jour
          automatiquement une fois le paiement validé — aucun déblocage immédiat
          au retour du navigateur.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Niveau d’accès</CardTitle>
            <Badge variant="secondary">{LEVEL_LABELS[access.level]}</Badge>
          </div>
          <CardDescription>
            Résolu à{" "}
            {new Intl.DateTimeFormat("fr-CA", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Toronto",
            }).format(access.resolvedAt)}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href="/pricing" />}>
            Voir les tarifs
          </Button>
          {access.level === "decouverte" || access.level === "pass_30_jours" ? (
            <CheckoutButton
              kind="plus"
              label={`Passer à Plus — ${formatPlusPrice()}`}
              returnPath="/dashboard/subscription"
              className="sm:w-auto"
              variant="outline"
            />
          ) : null}
          {access.level === "decouverte" ? (
            <CheckoutButton
              kind="pass"
              label={`Acheter le Pass — ${formatPassPrice()}`}
              returnPath="/dashboard/subscription"
              className="sm:w-auto"
            />
          ) : null}
        </CardContent>
      </Card>

      {access.passGrant ? (
        <PassStatusCard
          startsAt={access.passGrant.startsAt}
          endsAt={access.passGrant.endsAt}
          remainingDays={access.passGrant.remainingDays}
          returnPath="/dashboard/subscription"
        />
      ) : null}

      {access.level === "sebavio_plus" && plusSubscription ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Sebavio Plus</CardTitle>
              <Badge>{plusSubscription.status}</Badge>
            </div>
            <CardDescription>
              Abonnement annuel avec accès complet.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sebavio-navy space-y-2 text-sm">
            {plusSubscription.currentPeriodEnd ? (
              <p>
                Période en cours jusqu’au{" "}
                <strong>
                  {new Intl.DateTimeFormat("fr-CA", {
                    dateStyle: "long",
                    timeZone: "America/Toronto",
                  }).format(plusSubscription.currentPeriodEnd)}
                </strong>
                .
              </p>
            ) : null}
            {plusSubscription.cancelAtPeriodEnd ? (
              <p className="text-sebavio-coral">
                Résiliation prévue à la fin de la période.
              </p>
            ) : (
              <p className="text-sebavio-muted">
                Renouvellement automatique actif.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {access.level === "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
            <CardDescription>
              Accès complet accordé par votre rôle staff.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
