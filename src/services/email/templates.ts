import type { AuthEmailKind } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapHtml(title: string, paragraphs: string[]): string {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;">${p}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-size:1.25rem;margin:0 0 16px;">${escapeHtml(title)}</h1>
  ${body}
  <p style="margin:24px 0 0;font-size:0.875rem;color:#666;">Sebavio — ne répondez pas à ce message automatique.</p>
</body>
</html>`;
}

export function buildAuthEmailContent(
  kind: AuthEmailKind,
  link: string,
): { subject: string; html: string; text: string } {
  const safeLink = escapeHtml(link);

  if (kind === "verify-email") {
    const subject = "Vérifiez votre courriel — Sebavio";
    const text = [
      "Bienvenue sur Sebavio.",
      "",
      "Pour activer votre compte, ouvrez ce lien (valide 24 h) :",
      link,
      "",
      "Si vous n'avez pas créé de compte, ignorez ce message.",
    ].join("\n");
    const html = wrapHtml(subject, [
      "Bienvenue sur Sebavio.",
      `Pour activer votre compte, cliquez sur le lien ci-dessous (valide 24&nbsp;h)&nbsp;:`,
      `<a href="${safeLink}">Vérifier mon courriel</a>`,
      `Ou copiez cette adresse&nbsp;:<br><span style="word-break:break-all;">${safeLink}</span>`,
      "Si vous n&apos;avez pas créé de compte, ignorez ce message.",
    ]);
    return { subject, html, text };
  }

  const subject = "Réinitialisation du mot de passe — Sebavio";
  const text = [
    "Une demande de réinitialisation de mot de passe a été faite pour votre compte Sebavio.",
    "",
    "Ouvrez ce lien (valide 1 h) :",
    link,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
  ].join("\n");
  const html = wrapHtml(subject, [
    "Une demande de réinitialisation de mot de passe a été faite pour votre compte Sebavio.",
    `Cliquez sur le lien ci-dessous (valide 1&nbsp;h)&nbsp;:`,
    `<a href="${safeLink}">Réinitialiser mon mot de passe</a>`,
    `Ou copiez cette adresse&nbsp;:<br><span style="word-break:break-all;">${safeLink}</span>`,
    "Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez ce message.",
  ]);
  return { subject, html, text };
}

export function buildNotificationEmailContent(input: {
  title: string;
  body: string;
  href?: string | null;
  appBaseUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `${input.title} — Sebavio`;
  let absoluteHref: string | null = null;
  if (input.href) {
    if (input.href.startsWith("http://") || input.href.startsWith("https://")) {
      absoluteHref = input.href;
    } else {
      const base = input.appBaseUrl.replace(/\/$/, "");
      absoluteHref = input.href.startsWith("/")
        ? `${base}${input.href}`
        : `${base}/${input.href}`;
    }
  }

  const textParts = [input.title, "", input.body];
  if (absoluteHref) {
    textParts.push("", `Voir dans Sebavio : ${absoluteHref}`);
  }
  const text = textParts.join("\n");

  const paragraphs = [
    escapeHtml(input.body),
    absoluteHref
      ? `<a href="${escapeHtml(absoluteHref)}">Ouvrir dans Sebavio</a>`
      : "",
  ].filter(Boolean);

  const html = wrapHtml(input.title, paragraphs);
  return { subject, html, text };
}
