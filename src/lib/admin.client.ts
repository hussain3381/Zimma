import { supabase } from "@/integrations/supabase/client";

// Types
export type Status = "pending" | "approved" | "rejected";
export type Role = "customer" | "provider" | "admin";

// 1. List Providers
export const adminListProviders = async (status?: Status) => {
  let q = supabase.from("providers").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
};

// 2. Set Provider Status
export const adminSetProviderStatus = async (providerId: string, status: Status) => {
  const { error } = await supabase
    .from("providers")
    .update({ status: status as any, verified: status === "approved" })
    .eq("id", providerId);
  if (error) throw new Error(error.message);

  if (status === "approved") {
    const { error: rpcErr } = await supabase.rpc("grant_provider_role" as any, { _user_id: providerId });
    if (rpcErr) throw new Error(rpcErr.message);
  }
  return { ok: true };
};

// 3. Get Stats
export const adminGetStats = async () => {
  const [prov, pending, approved, cust] = await Promise.all([
    supabase.from("providers").select("*", { count: "exact", head: true }),
    supabase.from("providers").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("providers").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("customer_profiles").select("*", { count: "exact", head: true }),
  ]);
  return {
    totalProviders: prov.count ?? 0,
    pendingProviders: pending.count ?? 0,
    approvedProviders: approved.count ?? 0,
    totalCustomers: cust.count ?? 0,
    totalUsers: (cust.count ?? 0) + (prov.count ?? 0),
  };
};

// 4. List Customers
export const adminListCustomers = async () => {
  const { data: customers, error } = await supabase
    .from("customer_profiles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  
  const ids = (customers ?? []).map((c) => c.id);
  let roles: { user_id: string; role: string }[] = [];
  
  if (ids.length) {
    const { data: r } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
    roles = r ?? [];
  }
  
  return (customers ?? []).map((c) => ({
    ...c,
    roles: roles.filter((r) => r.user_id === c.id).map((r) => r.role),
  }));
};

// 5. List Bookings
export const adminListBookings = async () => {
  const { data: rows, error } = await supabase
    .from("bookings").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  
  const custIds = Array.from(new Set((rows ?? []).map((r) => r.customer_id)));
  const provIds = Array.from(new Set((rows ?? []).map((r) => r.provider_id)));
  
  const [{ data: custs }, { data: provs }] = await Promise.all([
    custIds.length
      ? supabase.from("customer_profiles").select("id,name,email").in("id", custIds)
      : Promise.resolve({ data: [] as any[] }),
    provIds.length
      ? supabase.from("providers").select("id,name,profession").in("id", provIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return (rows ?? []).map((r) => ({
    ...r,
    customer_name: custs?.find((c) => c.id === r.customer_id)?.name ?? "—",
    provider_name: provs?.find((p) => p.id === r.provider_id)?.name ?? "—"
  }));
};

// 6. Delete Booking (FIXED: Added .select() to catch Silent RLS Failures!)
export const adminDeleteBooking = async (bookingId: string) => {
  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .select(); // IMPORTANT: Keeps Supabase honest about deletion

  if (error) throw new Error(error.message);
  
  // Agar error nahi tha, lekin 0 rows delete huin (matlab RLS ne block kiya)
  if (!data || data.length === 0) {
    throw new Error("Permission Denied: RLS Policy prevented booking deletion or record already deleted.");
  }

  return { ok: true, deleted: data };
};

// 7. Update Booking Status
export const adminUpdateBookingStatus = async (bookingId: string, status: string) => {
  const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", bookingId);
  if (error) throw new Error(error.message);
  return { ok: true };
};

// 8. Delete User (FIXED: Better error mapping for Foreign Key failures)
export const adminDeleteUser = async (userId: string) => {
  const { error } = await supabase.rpc("admin_delete_user_account" as any, { _user_id: userId });
  if (error) {
    if (error.message.includes("foreign key")) {
      throw new Error("Cannot delete user: This account has active bookings or records. Delete them first.");
    }
    throw new Error(error.message);
  }
  return { ok: true };
};

// 9. Set User Role
export const adminSetUserRole = async (userId: string, role: Role) => {
  const { error } = await supabase.rpc("admin_set_user_role" as any, { _user_id: userId, _role: role });
  if (error) throw new Error(error.message);
  return { ok: true };
};

// 10. Update Provider
export const adminUpdateProvider = async (providerId: string, patch: any) => {
  const { error } = await supabase.from("providers").update(patch).eq("id", providerId);
  if (error) throw new Error(error.message);
  return { ok: true };
};

// 11. Set KYC Status
export const adminSetKycStatus = async (providerId: string, status: string, notes?: string) => {
  const patch: any = { kyc_status: status, kyc_reviewed_at: new Date().toISOString() };
  if (notes !== undefined) patch.kyc_notes = notes;
  if (status === "approved") patch.verified = true;
  const { error } = await supabase.from("providers").update(patch).eq("id", providerId);
  if (error) throw new Error(error.message);
  return { ok: true };
};

// 12. Get KYC URL
export const adminGetKycUrl = async (path: string) => {
  if (!path) return { url: null };
  const { data, error } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 600);
  if (error) throw new Error(error?.message || "Failed to create URL");
  return { url: data?.signedUrl || null };
};

// import { supabase } from "@/integrations/supabase/client";

// // Types
// export type Status = "pending" | "approved" | "rejected";
// export type Role = "customer" | "provider" | "admin";

// // 1. List Providers
// export const adminListProviders = async (status?: Status) => {
//   let q = supabase.from("providers").select("*").order("created_at", { ascending: false });
//   if (status) q = q.eq("status", status);
//   const { data, error } = await q;
//   if (error) throw new Error(error.message);
//   return data ?? [];
// };

// // 2. Set Provider Status
// export const adminSetProviderStatus = async (providerId: string, status: Status) => {
//   const { error } = await supabase
//     .from("providers")
//     .update({ status: status as any, verified: status === "approved" })
//     .eq("id", providerId);
//   if (error) throw new Error(error.message);

//   if (status === "approved") {
//     const { error: rpcErr } = await supabase.rpc("grant_provider_role" as any, { _user_id: providerId });
//     if (rpcErr) throw new Error(rpcErr.message);
//   }
//   return { ok: true };
// };

// // 3. Get Stats
// export const adminGetStats = async () => {
//   const [prov, pending, approved, cust] = await Promise.all([
//     supabase.from("providers").select("*", { count: "exact", head: true }),
//     supabase.from("providers").select("*", { count: "exact", head: true }).eq("status", "pending"),
//     supabase.from("providers").select("*", { count: "exact", head: true }).eq("status", "approved"),
//     supabase.from("customer_profiles").select("*", { count: "exact", head: true }),
//   ]);
//   return {
//     totalProviders: prov.count ?? 0,
//     pendingProviders: pending.count ?? 0,
//     approvedProviders: approved.count ?? 0,
//     totalCustomers: cust.count ?? 0,
//     totalUsers: (cust.count ?? 0) + (prov.count ?? 0),
//   };
// };

// // 4. List Customers (FIXED: Ab roles bhi fetch hongy, website crash nahi hogi!)
// export const adminListCustomers = async () => {
//   const { data: customers, error } = await supabase
//     .from("customer_profiles").select("*").order("created_at", { ascending: false });
//   if (error) throw new Error(error.message);
  
//   const ids = (customers ?? []).map((c) => c.id);
//   let roles: { user_id: string; role: string }[] = [];
  
//   if (ids.length) {
//     const { data: r } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
//     roles = r ?? [];
//   }
  
//   return (customers ?? []).map((c) => ({
//     ...c,
//     roles: roles.filter((r) => r.user_id === c.id).map((r) => r.role),
//   }));
// };

// // 5. List Bookings (FIXED: Join error khatam, alag se load hokar match hongy)
// export const adminListBookings = async () => {
//   const { data: rows, error } = await supabase
//     .from("bookings").select("*").order("created_at", { ascending: false }).limit(200);
//   if (error) throw new Error(error.message);
  
//   const custIds = Array.from(new Set((rows ?? []).map((r) => r.customer_id)));
//   const provIds = Array.from(new Set((rows ?? []).map((r) => r.provider_id)));
  
//   const [{ data: custs }, { data: provs }] = await Promise.all([
//     custIds.length
//       ? supabase.from("customer_profiles").select("id,name,email").in("id", custIds)
//       : Promise.resolve({ data: [] as any[] }),
//     provIds.length
//       ? supabase.from("providers").select("id,name,profession").in("id", provIds)
//       : Promise.resolve({ data: [] as any[] }),
//   ]);

//   return (rows ?? []).map((r) => ({
//     ...r,
//     customer_name: custs?.find((c) => c.id === r.customer_id)?.name ?? "—",
//     provider_name: provs?.find((p) => p.id === r.provider_id)?.name ?? "—"
//   }));
// };

// // 6. Delete Booking
// export const adminDeleteBooking = async (bookingId: string) => {
//   const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
//   if (error) throw new Error(error.message);
//   return { ok: true };
// };

// // 7. Update Booking Status (FIXED: TypeScript error 'string not assignable' solved)
// export const adminUpdateBookingStatus = async (bookingId: string, status: string) => {
//   const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", bookingId);
//   if (error) throw new Error(error.message);
//   return { ok: true };
// };

// // 8. Delete User (FIXED: TypeScript RPC argument error solved)
// export const adminDeleteUser = async (userId: string) => {
//   const { error } = await supabase.rpc("admin_delete_user_account" as any, { _user_id: userId });
//   if (error) throw new Error(error.message);
//   return { ok: true };
// };

// // 9. Set User Role
// export const adminSetUserRole = async (userId: string, role: Role) => {
//   const { error } = await supabase.rpc("admin_set_user_role" as any, { _user_id: userId, _role: role });
//   if (error) throw new Error(error.message);
//   return { ok: true };
// };

// // 10. Update Provider
// export const adminUpdateProvider = async (providerId: string, patch: any) => {
//   const { error } = await supabase.from("providers").update(patch).eq("id", providerId);
//   if (error) throw new Error(error.message);
//   return { ok: true };
// };

// // 11. Set KYC Status
// export const adminSetKycStatus = async (providerId: string, status: string, notes?: string) => {
//   const patch: any = { kyc_status: status, kyc_reviewed_at: new Date().toISOString() };
//   if (notes !== undefined) patch.kyc_notes = notes;
//   if (status === "approved") patch.verified = true;
//   const { error } = await supabase.from("providers").update(patch).eq("id", providerId);
//   if (error) throw new Error(error.message);
//   return { ok: true };
// };

// // 12. Get KYC URL
// export const adminGetKycUrl = async (path: string) => {
//   if (!path) return { url: null };
//   const { data, error } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 600);
//   if (error) throw new Error(error?.message || "Failed to create URL");
//   return { url: data?.signedUrl || null };
// };
