/** Chemins publics des assets d’identité Sebavia. */
export const BRAND_ASSETS = {
  /** Logo vertical (emblème + wordmark + baseline) pour fonds clairs — PNG transparent. */
  logo: "/assets/branding/sebavio/logo-sebavio-2026-clair.png",
  /** Variante claire (identique à `logo`). */
  logoClair: "/assets/branding/sebavio/logo-sebavio-2026-clair.png",
  /** Logo pour fonds foncés — PNG à fond noir opaque. */
  logoBlanc: "/assets/branding/sebavio/logo-sebavio-2026-fonce.png",
  /**
   * Master à fond noir opaque — ne pas utiliser sur des fonds clairs
   * (préférer `logo` / `logoClair`).
   */
  logoJpegFondNoir: "/assets/branding/sebavio/logo-sebavio-2026.png",
  /** Logo horizontal (emblème + wordmark) pour header — PNG transparent. */
  logoHorizontal: "/assets/branding/sebavio/logo-sebavio-horizontal-clair.png",
  /** Logo horizontal Sebavia — version sidebar sombre (PNG lisible sur fond sombre). */
  logoHorizontalSidebar:
    "/assets/branding/sebavio/logo-sebavia-horizontal-sidebar.png",
  /** Master PNG du logo horizontal (fichier source, wordmark sombre). */
  logoHorizontalSebavia: "/assets/branding/sebavio/logo-sebavia-horizontal.png",
  /** SVG autonome (PNG embarqué) — alternative à logoHorizontalSidebar. */
  logoHorizontalSidebarSvg:
    "/assets/branding/sebavio/logo-sebavia-horizontal.svg",
  fondHero: "/assets/branding/sebavio/fond-hero.png",
  /** Photo principale du Hero (sans dégradé intégré). */
  heroCampingcar: "/assets/branding/sebavio/hero-campingcar.webp",
  /** Fond hero nuit — route et ciel étoilé (landing publique). */
  heroNightRoad: "/assets/branding/sebavio/hero-night-road.png",
  /** Paysage seul (sans panneaux UI) pour le hero. */
  heroLandscape: "/assets/branding/sebavio/hero-landscape-night.png",
  /** Variante WebP du paysage hero (plus légère). */
  heroLandscapeWebp: "/assets/branding/sebavio/hero-landscape-night.webp",
  /** Fond bienvenue dashboard — panorama route (thème clair, fade blanc à gauche). */
  fondBienvenueClair: "/assets/branding/sebavio/fond-bienvenue-clair.png",
  /** Fond bienvenue dashboard — panorama route (thème sombre, fade navy à gauche). */
  fondBienvenueSombre: "/assets/branding/sebavio/fond-bienvenue-sombre.png",
  /** Composition desktop + mobile (image complète, ne pas découper). */
  appPreview: "/assets/branding/sebavio/sebavio-mobile-web.png",
  sparkle: "/assets/branding/sebavio/sparkle-dore.png",
  swoosh: "/assets/branding/sebavio/swoosh-souligne.png",
  vague: "/assets/branding/sebavio/vague-separation.png",
  etoiles: "/assets/branding/sebavio/etoiles-notation.png",
  icons: {
    itineraires: {
      teal: "/assets/branding/sebavio/icone-itineraires-teal.png",
      blanc: "/assets/branding/sebavio/icone-itineraires-blanc.png",
    },
    carburant: {
      teal: "/assets/branding/sebavio/icone-carburant-teal.png",
      blanc: "/assets/branding/sebavio/icone-carburant-blanc.png",
    },
    entretien: {
      teal: "/assets/branding/sebavio/icone-entretien-teal.png",
      blanc: "/assets/branding/sebavio/icone-entretien-blanc.png",
    },
    activites: {
      teal: "/assets/branding/sebavio/icone-activites-teal.png",
      blanc: "/assets/branding/sebavio/icone-activites-blanc.png",
    },
    famille: {
      teal: "/assets/branding/sebavio/icone-famille-teal.png",
      blanc: "/assets/branding/sebavio/icone-famille-blanc.png",
    },
    planification: {
      teal: "/assets/branding/sebavio/icone-planification-teal.png",
      blanc: "/assets/branding/sebavio/icone-planification-blanc.png",
    },
    campingcar: {
      teal: "/assets/branding/sebavio/icone-campingcar-teal.png",
      blanc: "/assets/branding/sebavio/icone-campingcar-blanc.png",
    },
    economisez: {
      teal: "/assets/branding/sebavio/icone-economisez-teal.png",
      blanc: "/assets/branding/sebavio/icone-economisez-blanc.png",
    },
    fiable: {
      teal: "/assets/branding/sebavio/icone-fiable-teal.png",
      blanc: "/assets/branding/sebavio/icone-fiable-blanc.png",
    },
    coeur: {
      teal: "/assets/branding/sebavio/icone-coeur-teal.png",
      blanc: "/assets/branding/sebavio/icone-coeur-blanc.png",
    },
    boussole: {
      teal: "/assets/branding/sebavio/icone-boussole-teal.png",
      blanc: "/assets/branding/sebavio/icone-boussole-blanc.png",
    },
  },
} as const;
