import { supabase } from "@/integrations/supabase/client";

// 1. List Providers
export const adminListProviders = async (status?: "pending" | "approved" | "rejected") => {
  let q = supabase.from("providers").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
};

// // 2. Set Status
// export const adminSetProviderStatus = async (providerId: string, status: "pending" | "approved" | "rejected") => {
//   const patch = {
//     status: status,
//     verified: status === "approved",
//   };

//   const { error } = await supabase
//     .from("providers")
//     .update(patch)
//     .eq("id", providerId);

//   if (error) throw new Error(error.message);

//   // Agar approved hai, toh DB function call karein
//   if (status === "approved") {
//     const { error: rpcErr } = await supabase.rpc("grant_provider_role", { _user_id: providerId });
//     if (rpcErr) throw new Error(rpcErr.message);
//   }
  
//   return { ok: true };
// };

// 2. Set Status (Updated to use RPC)
export const adminSetProviderStatus = async (providerId: string, status: "pending" | "approved" | "rejected") => {
  
  // Direct UPDATE ke bajaye naya SQL function call karein
  const { error } = await supabase.rpc("admin_update_provider" as any, {
    p_provider_id: providerId,
    p_status: status
  });

  if (error) throw new Error(error.message);

  // Agar approved hai, toh user ko provider role dein
  if (status === "approved") {
    const { error: rpcErr } = await supabase.rpc("grant_provider_role", { _user_id: providerId });
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