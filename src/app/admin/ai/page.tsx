import { requirePermission } from "@/features/auth";
import { getAiRuntimeConfig } from "@/services/ai/config";
import { getAiAdminMetrics } from "@/features/ai/services/usage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRIP_ASSISTANT_PROMPT_VERSION } from "@/features/ai/constants";

export default async function AdminAiPage() {
  await requirePermission("ai.read");
  const config = getAiRuntimeConfig();
  const metrics = await getAiAdminMetrics(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sebavio-navy text-2xl font-semibold">
          Intelligence artificielle
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Suivi d’usage de l’Assistant Sebavio. La clé OpenAI n’est jamais
          affichée.
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
              AI_ENABLED + présence de clé
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modèle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{config.model}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Clé configurée : {config.apiKey ? "oui" : "non"}
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
