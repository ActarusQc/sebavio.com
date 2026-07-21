"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { CheckoutButton } from "@/features/subscriptions/components/checkout-button";
import { formatPassPrice } from "@/features/subscriptions/lib/format-price";
import { PASS_PRICE_CENTS } from "@/features/subscriptions/lib/official-plan-slugs";

type PassStatusCardProps = {
  startsAt: Date | string;
  endsAt: Date | string;
  remainingDays: number;
  returnPath?: string;
  passPriceCents?: number;
};

function formatDateFr(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "long",
    timeZone: "America/Toronto",
  }).format(date);
}

export function PassStatusCard({
  startsAt,
  endsAt,
  remainingDays,
  returnPath = "/dashboard/subscription",
  passPriceCents = PASS_PRICE_CENTS,
}: PassStatusCardProps) {
  const showReminder = remainingDays <= 7;

  return (
    <Card className="border-sebavio-sand/50" data-pass-status-card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="font-heading text-sebavio-navy">
            Pass 30 jours
          </CardTitle>
          <Badge variant="secondary">Actif</Badge>
        </div>
        <CardDescription>
          Accès complet temporaire — sans renouvellement automatique.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showReminder ? (
          <p
            className="border-sebavio-gold/40 bg-sebavio-gold/10 text-sebavio-navy rounded-lg border px-3 py-2 text-sm"
            role="status"
          >
            {remainingDays <= 1
              ? "Votre Pass expire demain ou aujourd’hui. Ajoutez 30 jours pour conserver l’accès."
              : `Votre Pass expire dans ${remainingDays} jours. Pensez à le prolonger si besoin.`}
          </p>
        ) : null}

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-sebavio-muted text-xs font-medium tracking-wide uppercase">
              Activation
            </dt>
            <dd className="text-sebavio-navy mt-0.5 font-medium">
              {formatDateFr(startsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sebavio-muted text-xs font-medium tracking-wide uppercase">
              Expiration
            </dt>
            <dd className="text-sebavio-navy mt-0.5 font-medium">
              {formatDateFr(endsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sebavio-muted text-xs font-medium tracking-wide uppercase">
              Jours restants
            </dt>
            <dd className="text-sebavio-navy mt-0.5 font-medium">
              {remainingDays}
            </dd>
          </div>
          <div>
            <dt className="text-sebavio-muted text-xs font-medium tracking-wide uppercase">
              Renouvellement
            </dt>
            <dd className="text-sebavio-navy mt-0.5 font-medium">
              Aucun (paiement unique)
            </dd>
          </div>
        </dl>

        <CheckoutButton
          kind="pass"
          label={`Ajouter 30 jours — ${formatPassPrice(passPriceCents)}`}
          returnPath={returnPath}
          className="sm:max-w-xs"
        />
      </CardContent>
    </Card>
  );
}
