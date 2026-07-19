/**
 * Environnement d'exécution affiché dans le bandeau admin.
 * Les trois environnements Sebavio : development | staging | production.
 * `test` / `NODE_ENV=test` mappé vers libellé « Test » (Vitest / CI).
 */
export type AdminEnvironmentKind = "development" | "test" | "production";

export function resolveAdminEnvironment(): AdminEnvironmentKind {
  const explicit = process.env.SEBAVIO_ENV?.trim().toLowerCase();
  if (explicit === "production" || explicit === "prod") return "production";
  if (
    explicit === "staging" ||
    explicit === "preprod" ||
    explicit === "préproduction"
  ) {
    // Préproduction affichée comme Test dans le bandeau (cahier des charges).
    return "test";
  }
  if (explicit === "test") return "test";
  if (explicit === "development" || explicit === "dev") return "development";

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === "production") return "production";
  if (nodeEnv === "test") return "test";
  return "development";
}

export function adminEnvironmentLabel(kind: AdminEnvironmentKind): string {
  switch (kind) {
    case "production":
      return "Production";
    case "test":
      return "Test";
    default:
      return "Développement";
  }
}
