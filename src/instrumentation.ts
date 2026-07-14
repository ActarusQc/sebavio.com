export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { warnIfProductionEmailMisconfigured } =
    await import("@/services/email");
  warnIfProductionEmailMisconfigured();
}
