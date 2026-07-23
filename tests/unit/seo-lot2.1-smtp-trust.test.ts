import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getContactInboxEmail,
  getPublicSupportEmail,
  OFFICIAL_PUBLIC_EMAIL,
} from "@/features/marketing/lib/public-contact";
import { submitContactMessage } from "@/features/marketing/actions/submit-contact";
import {
  CONTACT_PAGE,
  LEGAL_VERSION,
} from "@/features/marketing/lib/trust-content";
import {
  readSmtpConfigFromEnv,
  SmtpEmailProvider,
} from "@/services/email/smtp-provider";
import { sendContactEmail, setEmailProviderForTests } from "@/services/email";
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from "@/services/email/types";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 2.1 — adresse publique", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fixe bonjour@sebavia.com comme adresse officielle", () => {
    expect(OFFICIAL_PUBLIC_EMAIL).toBe("bonjour@sebavia.com");
  });

  it("utilise CONTACT_EMAIL indépendamment de EMAIL_FROM", () => {
    vi.stubEnv("CONTACT_EMAIL", "bonjour@sebavia.com");
    vi.stubEnv("EMAIL_FROM", "Sebavia <autre@example.com>");
    expect(getPublicSupportEmail()).toBe("bonjour@sebavia.com");
    expect(getContactInboxEmail()).toBe("bonjour@sebavia.com");
    expect(getPublicSupportEmail()).not.toBe("autre@example.com");
  });

  it("retombe sur l’adresse officielle si CONTACT_EMAIL est vide", () => {
    vi.stubEnv("CONTACT_EMAIL", "");
    expect(getPublicSupportEmail()).toBe(OFFICIAL_PUBLIC_EMAIL);
  });
});

describe("lot SEO 2.1 — transport SMTP2GO", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lit host 2525 STARTTLS (secure=false, requireTLS)", () => {
    vi.stubEnv("SMTP_HOST", "mail.smtp2go.com");
    vi.stubEnv("SMTP_PORT", "2525");
    vi.stubEnv("SMTP_SECURE", "false");
    vi.stubEnv("SMTP_REQUIRE_TLS", "true");
    vi.stubEnv("SMTP_USER", "smtp-user");
    vi.stubEnv("SMTP_PASSWORD", "smtp-pass");
    vi.stubEnv("EMAIL_FROM", "Sebavia <ops@example.com>");

    const config = readSmtpConfigFromEnv();
    expect(config).not.toBeNull();
    expect(config!.host).toBe("mail.smtp2go.com");
    expect(config!.port).toBe(2525);
    expect(config!.secure).toBe(false);
    expect(config!.requireTls).toBe(true);
  });

  it("utilise secure=true seulement sur ports SSL implicite", () => {
    vi.stubEnv("SMTP_HOST", "mail.smtp2go.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_USER", "smtp-user");
    vi.stubEnv("SMTP_PASSWORD", "smtp-pass");
    vi.stubEnv("EMAIL_FROM", "Sebavia <ops@example.com>");
    // SMTP_SECURE absent → défaut implicite
    vi.stubEnv("SMTP_SECURE", "");
    vi.stubEnv("SMTP_REQUIRE_TLS", "");

    const config = readSmtpConfigFromEnv();
    expect(config!.secure).toBe(true);
    expect(config!.requireTls).toBe(false);
  });

  it(".env.example documente SMTP2GO sans secrets", () => {
    const example = readSource(".env.example");
    expect(example).toContain("SMTP_HOST=mail.smtp2go.com");
    expect(example).toContain("SMTP_PORT=2525");
    expect(example).toContain("SMTP_SECURE=false");
    expect(example).toContain("SMTP_REQUIRE_TLS=true");
    expect(example).toContain("CONTACT_EMAIL=bonjour@sebavia.com");
    expect(example).toContain("EMAIL_REPLY_TO=bonjour@sebavia.com");
    expect(example).not.toMatch(/SMTP_PASSWORD=.+/);
    expect(example).toMatch(/SMTP_PASSWORD=\s*$/m);
    expect(example).not.toContain("@sebavio.com");
  });
});

describe("lot SEO 2.1 — formulaire contact", () => {
  afterEach(() => {
    setEmailProviderForTests(null);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("envoie vers CONTACT_EMAIL avec Reply-To = visiteur", async () => {
    vi.stubEnv("CONTACT_EMAIL", "bonjour@sebavia.com");
    const captured: SendEmailInput[] = [];
    const fake: EmailProvider = {
      name: "console",
      async send(input): Promise<SendEmailResult> {
        captured.push(input);
        return { ok: true };
      },
    };
    setEmailProviderForTests(fake);

    const result = await sendContactEmail({
      to: "bonjour@sebavia.com",
      visitorName: "Alex",
      visitorEmail: "visiteur@example.com",
      category: "Support",
      message: "Bonjour, j’ai une question sur mon forfait.",
    });

    expect(result.ok).toBe(true);
    expect(captured).toHaveLength(1);
    expect(captured[0]!.to).toBe("bonjour@sebavia.com");
    expect(captured[0]!.replyTo).toBe("visiteur@example.com");
  });

  it("valide email invalide, message trop court et trop long", async () => {
    vi.stubEnv("CONTACT_EMAIL", "bonjour@sebavia.com");
    const base = () => {
      const fd = new FormData();
      fd.set("name", "Alex Test");
      fd.set("category", CONTACT_PAGE.subjects[0]!);
      fd.set("consent", "on");
      return fd;
    };

    const invalidEmail = base();
    invalidEmail.set("email", "pas-valide");
    invalidEmail.set(
      "message",
      "Message suffisamment long pour la validation.",
    );
    const r1 = await submitContactMessage(invalidEmail, new Headers());
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.fieldErrors?.email).toBeTruthy();

    const short = base();
    short.set("email", "ok@example.com");
    short.set("message", "trop court");
    const r2 = await submitContactMessage(short, new Headers());
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.fieldErrors?.message).toBeTruthy();

    const long = base();
    long.set("email", "ok@example.com");
    long.set("message", "x".repeat(4001));
    const r3 = await submitContactMessage(long, new Headers());
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.fieldErrors?.message).toBeTruthy();
  });

  it("honeypot : accepte silencieusement sans envoyer", async () => {
    vi.stubEnv("CONTACT_EMAIL", "bonjour@sebavia.com");
    let sent = 0;
    setEmailProviderForTests({
      name: "console",
      async send(): Promise<SendEmailResult> {
        sent += 1;
        return { ok: true };
      },
    });

    const fd = new FormData();
    fd.set("name", "Bot");
    fd.set("email", "bot@example.com");
    fd.set("category", CONTACT_PAGE.subjects[0]!);
    fd.set("message", "Message suffisamment long pour la validation.");
    fd.set("consent", "on");
    fd.set("company", "spam-co");

    const result = await submitContactMessage(fd, new Headers());
    expect(result.ok).toBe(true);
    expect(sent).toBe(0);
  });

  it("n’expose pas de détail SMTP en cas d’échec d’envoi", async () => {
    vi.stubEnv("CONTACT_EMAIL", "bonjour@sebavia.com");
    setEmailProviderForTests({
      name: "smtp",
      async send(): Promise<SendEmailResult> {
        return { ok: false, reason: "Invalid login: 535 secret=abc" };
      },
    });

    vi.spyOn(await import("@/lib/redis"), "getRedis").mockReturnValue({
      status: "ready",
      connect: async () => undefined,
      incr: async () => 1,
      expire: async () => 1,
    } as never);

    const fd = new FormData();
    fd.set("name", "Alex Test");
    fd.set("email", "ok@example.com");
    fd.set("category", CONTACT_PAGE.subjects[0]!);
    fd.set("message", "Message suffisamment long pour la validation.");
    fd.set("consent", "on");

    const result = await submitContactMessage(fd, new Headers());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("bonjour@sebavia.com");
      expect(result.error).not.toContain("535");
      expect(result.error).not.toContain("secret");
      expect(result.error).not.toContain("SMTP");
    }
  });
});

describe("lot SEO 2.1 — contenus institutionnels", () => {
  it("retire notes juridiques internes et prix approximatifs", () => {
    const terms = readSource("src/app/conditions-utilisation/page.tsx");
    const privacy = readSource("src/app/confidentialite/page.tsx");
    const contact = readSource("src/app/contact/page.tsx");
    const publicContact = readSource(
      "src/features/marketing/lib/public-contact.ts",
    );

    for (const src of [terms, privacy, contact, publicContact]) {
      expect(src).not.toMatch(/@sebavio\.com/);
      expect(src).not.toMatch(/daniel@/);
      expect(src).not.toMatch(/conseiller juridique/i);
      expect(src).not.toMatch(/validée? juridiquement/i);
      expect(src).not.toMatch(/version définitive/i);
      expect(src).not.toMatch(/environ 12[,.]99/);
      expect(src).not.toMatch(/environ 69[,.]99/);
      expect(src).not.toMatch(/éventuellement d['’]autres fournisseurs/i);
    }

    expect(terms).toContain('href="/pricing"');
    expect(terms).toContain("Découverte");
    expect(terms).toContain("Pass 30 jours");
    expect(terms).toContain("Sebavia Plus");
    expect(terms).toContain("mesure permise");
    expect(terms).toContain("loi applicable");
    expect(LEGAL_VERSION).toBe("1.1");

    expect(privacy).toContain("SMTP2GO");
    expect(privacy).toContain("moteur");
    expect(privacy).toContain("interne");
    expect(privacy).toContain("xAI");
    expect(contact).toContain("ContactPoint");
    expect(contact).toContain('availableLanguage: ["fr"]');
    expect(publicContact).toContain("bonjour@sebavia.com");
  });

  it("SmtpEmailProvider accepte requireTLS", () => {
    const provider = new SmtpEmailProvider({
      host: "mail.smtp2go.com",
      port: 2525,
      secure: false,
      requireTls: true,
      user: "u",
      password: "p",
      from: "Sebavia <ops@example.com>",
      replyTo: "bonjour@sebavia.com",
    });
    expect(provider.name).toBe("smtp");
  });
});
