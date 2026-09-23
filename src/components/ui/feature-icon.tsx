import {
  BadgePercent,
  Bike,
  ChefHat,
  Clock,
  Flame,
  Heart,
  Leaf,
  MapPin,
  Pizza,
  Smile,
  Sparkles,
  Star,
  ThumbsUp,
  Utensils,
  Wheat,
  Zap,
  type LucideProps,
} from "lucide-react";
import type { FeatureIconKey } from "@/lib/content/schemas";

const ICONS: Record<FeatureIconKey, React.ComponentType<LucideProps>> = {
  flame: Flame,
  pizza: Pizza,
  leaf: Leaf,
  "chef-hat": ChefHat,
  wheat: Wheat,
  clock: Clock,
  bike: Bike,
  heart: Heart,
  sparkles: Sparkles,
  star: Star,
  smile: Smile,
  zap: Zap,
  "thumbs-up": ThumbsUp,
  "badge-percent": BadgePercent,
  utensils: Utensils,
  "map-pin": MapPin,
};

export function FeatureIcon({ icon, ...props }: { icon: FeatureIconKey } & LucideProps) {
  const Icon = ICONS[icon] ?? Flame;
  return <Icon aria-hidden {...props} />;
}
