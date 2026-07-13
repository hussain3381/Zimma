import type { ProviderRow } from "./auth-context";
import type { Provider } from "./data";

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=2563eb,10b981,f59e0b,8b5cf6&backgroundType=gradientLinear`;

// A provider is bookable only when their application is approved AND they've
// completed KYC AND admin has flagged them verified. Partial-verified pros
// stay visible in the marketplace but can't accept new bookings.
export function isProviderBookable(r: Pick<ProviderRow, "status" | "verified" | "kyc_status">): boolean {
  return r.status === "approved" && r.verified === true && r.kyc_status === "approved";
}

export const UNVERIFIED_BOOK_MESSAGE =
  "This pro hasn't completed KYC verification yet. You'll be able to book once they're fully verified.";

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
    bookable: isProviderBookable(r),
  };
}
