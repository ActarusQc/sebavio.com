import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Car,
  CreditCard,
  LayoutDashboard,
  Map,
  Settings,
  Shield,
  Sparkles,
  Wallet,
  Wrench,
} from "lucide-react";
import type { NavIconName } from "./navigation";

export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  map: Map,
  car: Car,
  "book-open": BookOpen,
  wrench: Wrench,
  wallet: Wallet,
  sparkles: Sparkles,
  bell: Bell,
  "credit-card": CreditCard,
  settings: Settings,
  shield: Shield,
};

export function NavIcon({
  name,
  className = "size-4 shrink-0",
}: {
  name: NavIconName;
  className?: string;
}) {
  const Icon = NAV_ICONS[name];
  return <Icon className={className} aria-hidden />;
}
