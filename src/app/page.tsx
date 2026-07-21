import {
  BenefitsBanner,
  CtaBanner,
  FeaturesGrid,
  HeroSection,
  SiteFooter,
  SiteHeader,
  WhySebavio,
} from "@/features/marketing";

export default function Home() {
  return (
    <div className="bg-sebavio-background flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <BenefitsBanner />
        <WhySebavio />
        <FeaturesGrid />
        <CtaBanner />
      </main>
      <SiteFooter />
    </div>
  );
}
