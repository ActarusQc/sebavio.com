import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";
import {
  EmptyState,
  FadeIn,
  FormField,
  LoadingState,
  PageHeader,
  StatusBadge,
  ThemeToggle,
} from "@/components/common";
import {
  AppShell,
  Breadcrumbs,
  Footer,
  Header,
  Sidebar,
} from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Vitrine Design System — outil interne uniquement (hors production).
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <AppShell
      header={
        <Header
          brand={<span className="font-semibold">Sebavio · Design System</span>}
          actions={<ThemeToggle />}
        />
      }
      sidebar={
        <Sidebar
          items={[
            { href: "#tokens", label: "Tokens", active: true },
            { href: "#ui", label: "Composants UI" },
            { href: "#common", label: "Communs" },
            { href: "#layout", label: "Layout" },
          ]}
        />
      }
      footer={<Footer />}
    >
      <FadeIn>
        <Breadcrumbs
          items={[{ label: "Accueil", href: "/" }, { label: "Design System" }]}
        />
        <PageHeader
          title="Design System Sebavio"
          description="Tokens, thèmes clair/sombre et composants réutilisables (Document 7)."
          actions={
            <Button type="button" size="sm">
              Action primaire
            </Button>
          }
        />
      </FadeIn>

      <div className="flex flex-col gap-10">
        <section id="tokens" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Tokens</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Primary",
                className: "bg-primary text-primary-foreground",
              },
              {
                name: "Success",
                className: "bg-success text-success-foreground",
              },
              { name: "Info", className: "bg-info text-info-foreground" },
              {
                name: "Warning",
                className: "bg-warning text-warning-foreground",
              },
              {
                name: "Destructive",
                className: "bg-destructive text-destructive-foreground",
              },
              { name: "Muted", className: "bg-muted text-muted-foreground" },
              {
                name: "Card",
                className: "bg-card text-card-foreground ring-1 ring-border",
              },
              { name: "Accent", className: "bg-accent text-accent-foreground" },
            ].map((swatch) => (
              <div
                key={swatch.name}
                className={`flex h-20 items-end rounded-xl p-3 text-sm font-medium ${swatch.className}`}
              >
                {swatch.name}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Typographie : Inter via next/font · Base 16 px · Grille 8 px · Rayon
            cartes 16 px
          </p>
        </section>

        <Separator />

        <section id="ui" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Composants UI</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button">Default</Button>
            <Button type="button" variant="secondary">
              Secondary
            </Button>
            <Button type="button" variant="outline">
              Outline
            </Button>
            <Button type="button" variant="ghost">
              Ghost
            </Button>
            <Button type="button" variant="destructive">
              Destructive
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <StatusBadge status="success">Succès</StatusBadge>
            <StatusBadge status="info">Info</StatusBadge>
            <StatusBadge status="warning">Avertissement</StatusBadge>
            <StatusBadge status="error">Erreur</StatusBadge>
          </div>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Card</CardTitle>
              <CardDescription>
                Conteneur standard du Design System.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="demo-input">Libellé</Label>
                <Input id="demo-input" name="demo" placeholder="Saisie…" />
              </div>
              <Textarea placeholder="Zone de texte…" rows={3} />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Onglet A</TabsTrigger>
              <TabsTrigger value="b">Onglet B</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="pt-3">
              Contenu A
            </TabsContent>
            <TabsContent value="b" className="pt-3">
              Contenu B
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        <section id="common" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Composants communs</h2>
          <Card className="max-w-md">
            <CardContent className="pt-(--card-spacing)">
              <FormField
                htmlFor="ds-email"
                label="Courriel"
                required
                hint="Exemple de champ accessible."
              >
                <Input
                  id="ds-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                />
              </FormField>
            </CardContent>
          </Card>
          <LoadingState lines={3} className="max-w-md" />
          <EmptyState
            title="Aucun élément"
            description="État vide réutilisable pour toutes les listes."
            icon={<Inbox />}
            action={
              <Button type="button" variant="outline" size="sm">
                Créer
              </Button>
            }
          />
        </section>

        <section id="layout" className="text-muted-foreground text-sm">
          Layout : AppShell, Header, Sidebar, Breadcrumbs, Footer — coquilles
          prêtes pour la Partie 6.
        </section>
      </div>
    </AppShell>
  );
}
