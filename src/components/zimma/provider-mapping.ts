import type { ProviderRow } from "./auth-context";
import type { Provider } from "./data";

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=2563eb,10b981,f59e0b,8b5cf6&backgroundType=gradientLinear`;

// Map the live DB row into the legacy Provider shape used by cards / profile.
export function rowToProvider(r: ProviderRow): Provider {
  return {
    id: r.id,
    name: r.name,
    trade: r.profession,
    area: r.area,
    rating: Number(r.rating) || 0,
    reviews: r.reviews_count,
    jobs: r.total_jobs,
    experience: r.experience,
    price: `PKR ${r.hourly_rate}/hr`,
    available: r.is_online ? "Online now" : r.availability,
    verified: r.verified,
    skills: r.skills ?? [],
    avatar: r.avatar_url || avatar(r.name),
  };
}
