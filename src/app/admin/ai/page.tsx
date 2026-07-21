import { requirePermission } from "@/features/auth";
import {
  getAiRuntimeConfig,
  getAiProviderDisplayName,
} from "@/services/ai/config";
import { getAiAdminMetrics } from "@/features/ai/services/usage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIP_ASSISTANT_PROMPT_VERSION } from "@/features/ai/constants";

export default async function AdminAiPage() {
  await requirePermission("ai.read");
  const config = getAiRuntimeConfig();
  const metrics = await getAiAdminMetrics(30);
  const providerLabel = getAiProviderDisplayName(config.provider);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sebavio-navy text-2xl font-semibold">
          Intelligence artificielle
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Suivi d’usage de l’Assistant Sebavio. Aucune clé API n’est affichée.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Fonctionnalité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={config.enabled ? "default" : "secondary"}>
              {config.enabled ? "Activée" : "Désactivée"}
            </Badge>
            <p className="text-muted-foreground mt-2 text-xs">
              AI_ENABLED + clé + modèle ({providerLabel})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fournisseur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{providerLabel}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Modèle : {config.model || "—"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Clé configurée : {config.apiKeyPresent ? "oui" : "non"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Requêtes (30 j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.totals.requests}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {metrics.totals.successes} ok · {metrics.totals.errors} erreurs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.avgDurationMs != null
                ? `${metrics.totals.avgDurationMs} ms`
                : "—"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Prompt : {TRIP_ASSISTANT_PROMPT_VERSION}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jetons entrée</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.inputTokens.toLocaleString("fr-CA")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jetons sortie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.outputTokens.toLocaleString("fr-CA")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total jetons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.totalTokens.toLocaleString("fr-CA")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Recherches Web
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.webSearches}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {metrics.totals.webSearchSuccesses} réussies
              {metrics.totals.webSearches > 0
                ? ` · ${Math.round(
                    (metrics.totals.webSearchSuccesses /
                      metrics.totals.webSearches) *
                      100,
                  )} %`
                : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Sources moyennes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.avgSourceCount != null
                ? metrics.totals.avgSourceCount
                : "—"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Par recherche Web
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Recherche Web config
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={config.webSearchEnabled ? "default" : "secondary"}>
              {config.webSearchEnabled ? "Activée" : "Désactivée"}
            </Badge>
            <p className="text-muted-foreground mt-2 text-xs">
              Rayon {config.routeSearchRadiusKm} km · max détour{" "}
              {config.routeMaxDetourKm} km
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Demandes restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.restaurantRequests}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Clarifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.restaurantClarifications}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avec / sans résultat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.restaurantWithResults} /{" "}
              {metrics.totals.restaurantWithoutResults}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Durée moy. restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics.totals.restaurantAvgDurationMs != null
                ? `${metrics.totals.restaurantAvgDurationMs} ms`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par jour</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byDay.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune donnée.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {metrics.byDay.map((d) => (
                  <li
                    key={d.day}
                    className="border-border/60 flex justify-between border-b py-1"
                  >
                    <span>{d.day}</span>
                    <span>
                      {d.count} ({d.successes} ok)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par type d’action</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byRequestType.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune donnée.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {metrics.byRequestType.map((d) => (
                  <li
                    key={d.requestType}
                    className="border-border/60 flex justify-between border-b py-1"
                  >
                    <span className="font-mono text-xs">{d.requestType}</span>
                    <span>{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par intention</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byIntent.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune donnée.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {metrics.byIntent.map((d) => (
                  <li
                    key={d.intent}
                    className="border-border/60 flex justify-between border-b py-1"
                  >
                    <span className="font-mono text-xs">{d.intent}</span>
                    <span>{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par forfait</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byPlanSlug.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune donnée.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {metrics.byPlanSlug.map((d) => (
                  <li
                    key={d.planSlug}
                    className="border-border/60 flex justify-between border-b py-1"
                  >
                    <span>{d.planSlug}</span>
                    <span>{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versions de prompt</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byPromptVersion.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune donnée.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {metrics.byPromptVersion.map((d) => (
                  <li
                    key={d.promptVersion}
                    className="border-border/60 flex justify-between border-b py-1"
                  >
                    <span className="font-mono text-xs">{d.promptVersion}</span>
                    <span>{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
