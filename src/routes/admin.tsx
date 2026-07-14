import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  LogOut,
  Settings,
  KeyRound,
  Users,
  Wrench,
  Activity,
  ArrowRight,
  ShieldAlert,
  Check,
  X as XIcon,
  Loader2,
  Clock,
  Trash2,
  FileText,
  Briefcase,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdmin } from "@/components/zimma/admin-context";
import {
  adminListProviders,
  adminSetProviderStatus,
  adminGetStats,
  adminListCustomers,
  adminListBookings,
  adminDeleteUser,
  adminSetKycStatus,
  adminGetKycUrl,
  adminDeleteBooking,
  adminUpdateBookingStatus,
  type Status,
} from "@/lib/admin.client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Super Admin Terminal — Zimma" }] }),
  component: AdminRoute,
});

function AdminRoute() {
  const { ready, authed, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState<
    "overview" | "providers" | "kyc" | "customers" | "bookings" | "settings"
  >("overview");

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // KYC Modal State
  const [selectedKycProvider, setSelectedKycProvider] = useState<any | null>(null);

  // Password Modal State
  const [pwdModalOpen, setPwdModalOpen] = useState<boolean>(false);

  // Load All Data Function
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsData, providersData, customersData, bookingsData] =
        await Promise.all([
          adminGetStats().catch(() => ({
            totalProviders: 0,
            pendingProviders: 0,
            approvedProviders: 0,
            totalCustomers: 0,
            totalUsers: 0,
          })),
          adminListProviders().catch(() => []),
          adminListCustomers().catch(() => []),
          adminListBookings().catch(() => []),
        ]);
      setStats(statsData);
      setProviders(providersData || []);
      setCustomers(customersData || []);
      setBookings(bookingsData || []);
    } catch (err: any) {
      toast.error(
        "Failed to fetch admin data: " + (err.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready && authed) {
      loadAllData();
    }
  }, [ready, authed]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A2540] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D4B2]" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin />;
  }

  // --- Handlers with INSTANT OPTIMISTIC UI UPDATES ---

  const handleProviderStatusChange = async (id: string, newStatus: Status) => {
    try {
      setActionLoading(id);
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
      );
      await adminSetProviderStatus(id, newStatus);
      toast.success(`Provider status updated to ${newStatus}!`);
      loadAllData();
    } catch (err: any) {
      toast.error("Error updating status: " + err.message);
      loadAllData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleKycStatusChange = async (
    id: string,
    status: string,
    notes?: string,
  ) => {
    try {
      setActionLoading(id);
      setProviders((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                kyc_status: status,
                kyc_notes: notes,
                kyc_reviewed_at: new Date().toISOString(),
              }
            : p,
        ),
      );
      await adminSetKycStatus(id, status, notes);
      toast.success(`KYC status updated to ${status}!`);
      setSelectedKycProvider(null);
      loadAllData();
    } catch (err: any) {
      toast.error("Error updating KYC: " + err.message);
      loadAllData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspendUser = async (
    userId: string,
    currentStatus?: string,
  ) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      setActionLoading(userId);
      setCustomers((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, status: newStatus } : c)),
      );
      toast.success(
        `User ${newStatus === "suspended" ? "suspended" : "activated"} successfully!`,
      );
    } catch (err: any) {
      toast.error("Error updating status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUserAccount = async (userId: string) => {
    if (
      !confirm("Are you sure you want to permanently delete this user account?")
    )
      return;
    try {
      setActionLoading(userId);
      setCustomers((prev) => prev.filter((c) => c.id !== userId));
      await adminDeleteUser(userId);
      toast.success("User deleted successfully!");
      loadAllData();
    } catch (err: any) {
      toast.error("Error deleting user: " + err.message);
      loadAllData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBookingRecord = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      setActionLoading(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      await adminDeleteBooking(bookingId);
      toast.success("Booking deleted!");
      loadAllData();
    } catch (err: any) {
      toast.error("Error deleting booking: " + err.message);
      loadAllData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookingStatusUpdate = async (
    bookingId: string,
    newStatus: string,
  ) => {
    try {
      setActionLoading(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
      );
      await adminUpdateBookingStatus(bookingId, newStatus);
      toast.success("Booking status updated!");
      loadAllData();
    } catch (err: any) {
      toast.error("Error updating booking status: " + err.message);
      loadAllData();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#081E33] border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <Link to="/" className="flex flex-col gap-0 mb-4 px-4">
            {/* Top Row: Logo aur Text */}
            <div className="flex items-center gap-0">
              <img
                src="zimma-dark-theme.png"
                className="h-25 object-contain"
                alt="Zimma Logo"
              />
              <span className="text-white text-2xl font-bold tracking-wide">
                Zimma
              </span>
            </div>

            {/* Bottom Row: Admin Badge */}
            <div className="pl-3">
              <Badge className="bg-[#00D4B2] text-[#0A2540] font-extrabold text-[10px] px-2 py-0.5 rounded tracking-wider uppercase shadow-sm w-fit inline-block">
                ADMIN
              </Badge>
            </div>
          </Link>

          <nav className="space-y-2">
            <NavButton
              active={activeTab === "overview"}
              icon={Activity}
              label="Overview"
              onClick={() => setActiveTab("overview")}
            />
            <NavButton
              active={activeTab === "providers"}
              icon={Wrench}
              label="Providers"
              onClick={() => setActiveTab("providers")}
              count={providers.filter((p) => p.status === "pending").length}
            />
            <NavButton
              active={activeTab === "kyc"}
              icon={FileText}
              label="KYC Verifications"
              onClick={() => setActiveTab("kyc")}
              count={
                providers.filter((p) => p.kyc_status === "submitted").length
              }
            />
            <NavButton
              active={activeTab === "customers"}
              icon={Users}
              label="Customers"
              onClick={() => setActiveTab("customers")}
            />
            <NavButton
              active={activeTab === "bookings"}
              icon={Briefcase}
              label="Bookings"
              onClick={() => setActiveTab("bookings")}
            />
            <NavButton
              active={activeTab === "settings"}
              icon={Settings}
              label="Settings"
              onClick={() => setActiveTab("settings")}
            />
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-white/10 bg-transparent text-white hover:bg-white/5"
            onClick={() => setPwdModalOpen(true)}
          >
            <KeyRound className="h-4 w-4 text-[#00D4B2]" /> Change Password
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start gap-2 bg-red-600/80 hover:bg-red-600 text-white"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {activeTab} Terminal
            </h1>
            <p className="text-sm text-white/60">
              Manage your Zimma platform infrastructure seamlessly.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2 text-[#00D4B2]" />
            )}
            Refresh Data
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#00D4B2]" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="text-blue-400"
                  />
                  <StatCard
                    title="Total Providers"
                    value={stats?.totalProviders || 0}
                    icon={Wrench}
                    color="text-[#00D4B2]"
                  />
                  <StatCard
                    title="Pending Providers"
                    value={stats?.pendingProviders || 0}
                    icon={Clock}
                    color="text-yellow-400"
                  />
                  <StatCard
                    title="Total Customers"
                    value={stats?.totalCustomers || 0}
                    icon={Users}
                    color="text-purple-400"
                  />
                </div>

                <Card className="bg-[#081E33] border-white/10 p-6 text-white color-white">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-yellow-400" /> Recent
                    Pending Providers
                  </h2>
                  <ProviderTable
                    providers={providers
                      .filter((p) => p.status === "pending")
                      .slice(0, 5)}
                    onStatusChange={handleProviderStatusChange}
                    onOpenKyc={(p) => setSelectedKycProvider(p)}
                    loadingId={actionLoading}
                  />
                </Card>
              </div>
            )}

            {/* PROVIDERS TAB */}
            {activeTab === "providers" && (
              <Card className="bg-[#081E33] border-white/10 p-6 text-white">
                <h2 className="text-lg font-bold mb-4">
                  All Service Providers ({providers.length})
                </h2>
                <ProviderTable
                  providers={providers}
                  onStatusChange={handleProviderStatusChange}
                  onOpenKyc={(p) => setSelectedKycProvider(p)}
                  loadingId={actionLoading}
                />
              </Card>
            )}

            {/* KYC TAB */}
            {activeTab === "kyc" && (
              <Card className="bg-[#081E33] border-white/10 text-white p-6">
                <h2 className="text-lg font-bold mb-4">
                  KYC Verifications (
                  {
                    providers.filter(
                      (p) => p.kyc_status && p.kyc_status !== "not_submitted",
                    ).length
                  }
                  )
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/40 text-white">
                      <tr>
                        <th className="pb-3">Provider Name</th>
                        <th className="pb-3">Profession</th>
                        <th className="pb-3">KYC Status</th>
                        <th className="pb-3">Submitted At</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {providers.filter(
                        (p) => p.kyc_status && p.kyc_status !== "not_submitted",
                      ).length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-6 text-center text-white"
                          >
                            No KYC documents submitted yet.
                          </td>
                        </tr>
                      ) : (
                        providers
                          .filter(
                            (p) =>
                              p.kyc_status && p.kyc_status !== "not_submitted",
                          )
                          .map((p) => (
                            <tr key={p.id} className="hover:bg-white/5">
                              <td className="py-3 font-medium">{p.name}</td>
                              <td className="py-3 text-white/70">
                                {p.profession || "—"}
                              </td>
                              <td className="py-3">
                                <Badge
                                  className={
                                    p.kyc_status === "approved"
                                      ? "bg-green-500/20 text-green-300"
                                      : p.kyc_status === "rejected"
                                        ? "bg-red-500/20 text-red-300"
                                        : "bg-yellow-500/20 text-yellow-300"
                                  }
                                >
                                  {p.kyc_status}
                                </Badge>
                              </td>
                              <td className="py-3 text-white/60 text-xs">
                                {p.kyc_reviewed_at
                                  ? new Date(
                                      p.kyc_reviewed_at,
                                    ).toLocaleDateString()
                                  : "Pending Review"}
                              </td>
                              <td className="py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/20 bg-transparent hover:bg-white/10 text-white"
                                  onClick={() => setSelectedKycProvider(p)}
                                >
                                  <Eye className="h-4 w-4 mr-1 text-[#00D4B2]" />{" "}
                                  Review Document
                                </Button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* CUSTOMERS TAB */}
            {activeTab === "customers" && (
              <Card className="bg-[#081E33] border-white/10 text-white p-6">
                <h2 className="text-lg font-bold mb-4">
                  Registered Customers ({customers.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/40 text-white/60 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="py-4 px-2">Name</th>
                        <th className="py-4 px-2">Email</th>
                        <th className="py-4 px-2">Phone</th>
                        <th className="py-4 px-2">Status</th>
                        <th className="py-4 px-2">Roles</th>
                        <th className="py-4 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {customers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-6 text-center text-white/50"
                          >
                            No customers found.
                          </td>
                        </tr>
                      ) : (
                        customers.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-2 font-semibold text-white">
                              {c.name || "Unnamed"}
                            </td>
                            <td className="py-4 px-2 text-white/80">
                              {c.email || "—"}
                            </td>
                            <td className="py-4 px-2 text-white/80">
                              {c.phone || "—"}
                            </td>
                            <td className="py-4 px-2">
                              <Badge
                                className={
                                  c.status === "suspended"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-green-500/20 text-green-400"
                                }
                              >
                                {c.status === "suspended"
                                  ? "Suspended"
                                  : "Active"}
                              </Badge>
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex gap-1 flex-wrap">
                                {(c.roles || ["customer"]).map(
                                  (r: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="border-white/20 text-xs text-[#00D4B2]"
                                    >
                                      {r}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className={`h-8 px-3 border-white/20 bg-transparent hover:bg-white/10 ${c.status === "suspended" ? "text-green-400" : "text-yellow-400"}`}
                                onClick={() =>
                                  handleToggleSuspendUser(c.id, c.status)
                                }
                                disabled={actionLoading === c.id}
                              >
                                {c.status === "suspended"
                                  ? "Activate"
                                  : "Suspend"}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleDeleteUserAccount(c.id)}
                                disabled={actionLoading === c.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <Card className="bg-[#081E33] border-white/10 text-white p-6">
                <h2 className="text-lg font-bold mb-4">
                  Platform Bookings ({bookings.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/40 text-white/60 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="py-4 px-2">Service</th>
                        <th className="py-4 px-2">Customer</th>
                        <th className="py-4 px-2">Provider</th>
                        <th className="py-4 px-2">Amount</th>
                        <th className="py-4 px-2">Status</th>
                        <th className="py-4 px-2">Date</th>
                        <th className="py-4 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {bookings.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-6 text-center text-white/50"
                          >
                            No bookings recorded.
                          </td>
                        </tr>
                      ) : (
                        bookings.map((b) => (
                          <tr
                            key={b.id}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-2 font-medium text-white">
                              {b.service_title || "General Service"}
                            </td>
                            <td className="py-4 px-2 text-white/80">
                              {b.customer_name || "—"}
                            </td>
                            <td className="py-4 px-2 text-[#00D4B2] font-semibold">
                              {b.provider_name || "—"}
                            </td>
                            <td className="py-4 px-2 font-mono text-base font-bold text-white">
                              PKR {b.amount || "0"}
                            </td>
                            <td className="py-4 px-2">
                              <select
                                value={b.status || "pending"}
                                onChange={(e) =>
                                  handleBookingStatusUpdate(
                                    b.id,
                                    e.target.value,
                                  )
                                }
                                disabled={actionLoading === b.id}
                                className="bg-[#0A2540] border border-white/20 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D4B2]"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-4 px-2 text-white/60 text-xs">
                              {new Date(b.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleDeleteBookingRecord(b.id)}
                                disabled={actionLoading === b.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <Card className="bg-[#081E33] border-white/10 text-white p-6 max-w-md">
                <h2 className="text-lg font-bold mb-2">Admin Preferences</h2>
                <p className="text-sm text-white/60 mb-6">
                  Manage your security credentials and system configurations.
                </p>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-between border-white/20 bg-transparent hover:bg-white/5 text-white"
                    onClick={() => setPwdModalOpen(true)}
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#00D4B2]" /> Update
                      Admin Password
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </main>

      {/* KYC Review Modal */}
      {selectedKycProvider && (
        <KycReviewModal
          provider={selectedKycProvider}
          onClose={() => setSelectedKycProvider(null)}
          onStatusChange={handleKycStatusChange}
          loading={actionLoading === selectedKycProvider.id}
        />
      )}

      {/* Change Password Modal */}
      {pwdModalOpen && (
        <ChangePasswordModal onClose={() => setPwdModalOpen(false)} />
      )}
    </div>
  );
}

/* ---------------- Sub-Components ---------------- */

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
  count,
}: {
  active: boolean;
  icon: any;
  label: string;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[#00D4B2] text-[#0A2540] font-bold"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <Badge
          className={
            active
              ? "bg-[#0A2540] text-white"
              : "bg-yellow-500/20 text-yellow-300"
          }
        >
          {count}
        </Badge>
      )}
    </button>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <Card className="bg-[#081E33] border-white/10 p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold mt-1 text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-white/5 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </Card>
  );
}

function ProviderTable({
  providers,
  onStatusChange,
  onOpenKyc,
  loadingId,
}: {
  providers: any[];
  onStatusChange: (id: string, s: Status) => void;
  onOpenKyc: (p: any) => void;
  loadingId: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/50 text-white">
          <tr>
            <th className="pb-3">Name</th>
            <th className="pb-3">Profession</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">KYC</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {providers.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-white">
                No providers found.
              </td>
            </tr>
          ) : (
            providers.map((p) => (
              <tr key={p.id} className="hover:bg-white/5">
                <td className="py-3 font-medium">{p.name}</td>
                <td className="py-3 text-white/70">{p.profession || "—"}</td>
                <td className="py-3">
                  <Badge
                    className={
                      p.status === "approved"
                        ? "bg-green-500/20 text-green-300"
                        : p.status === "rejected"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-yellow-500/20 text-yellow-300"
                    }
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="py-3">
                  {p.kyc_document_path ? (
                    <Button
                      size="sm"
                      variant="link"
                      className="text-[#00D4B2] p-0 h-auto font-normal"
                      onClick={() => onOpenKyc(p)}
                    >
                      <FileText className="h-3 w-3 mr-1 inline" />{" "}
                      {p.kyc_status || "Review"}
                    </Button>
                  ) : (
                    <span className="text-white/40 text-xs">Not Submitted</span>
                  )}
                </td>
                <td className="py-3 text-right space-x-2">
                  {p.status !== "approved" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                      onClick={() => onStatusChange(p.id, "approved")}
                      disabled={loadingId === p.id}
                    >
                      <Check className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  )}
                  {p.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-600/80 hover:bg-red-600 text-white h-7 px-2 text-xs"
                      onClick={() => onStatusChange(p.id, "rejected")}
                      disabled={loadingId === p.id}
                    >
                      <XIcon className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- KYC Review Modal ---------------- */
function KycReviewModal({
  provider,
  onClose,
  onStatusChange,
  loading,
}: {
  provider: any;
  onClose: () => void;
  onStatusChange: (id: string, s: string, notes?: string) => void;
  loading: boolean;
}) {
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [fetchingUrl, setFetchingUrl] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>(provider.kyc_notes || "");

  useEffect(() => {
    let isMounted = true;
    const getUrl = async () => {
      if (!provider.kyc_document_path) {
        setFetchingUrl(false);
        return;
      }
      try {
        setFetchingUrl(true);
        const res = await adminGetKycUrl(provider.kyc_document_path);
        if (isMounted) setDocUrl(res.url);
      } catch (err) {
        if (isMounted) toast.error("Failed to load document image.");
      } finally {
        if (isMounted) setFetchingUrl(false);
      }
    };
    getUrl();
    return () => {
      isMounted = false;
    };
  }, [provider]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#081E33] text-white border-white/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#00D4B2]" /> KYC Verification:{" "}
            {provider.name}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Review the submitted identity document and approve or reject
            verification.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div className="border border-white/10 rounded-lg p-2 bg-[#0A2540] min-h-50 flex items-center justify-center overflow-hidden">
            {fetchingUrl ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#00D4B2]" />
            ) : docUrl ? (
              <img
                src={docUrl}
                alt="KYC Document"
                className="max-h-75 w-auto rounded object-contain"
              />
            ) : (
              <p className="text-sm text-red-400">
                Document image not found in storage bucket.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Review Notes / Rejection Reason
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional feedback for provider..."
              className="bg-[#0A2540] border-white/20 text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onStatusChange(provider.id, "rejected", notes)}
            disabled={loading}
            className="bg-red-600/80 hover:bg-red-600 text-white"
          >
            Reject KYC
          </Button>
          <Button
            onClick={() => onStatusChange(provider.id, "approved", notes)}
            disabled={loading}
            className="bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90 font-bold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Approve KYC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Change Password Modal ---------------- */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { updatePassword } = useAdmin();
  const [curr, setCurr] = useState("");
  const [next, setNext] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirmPwd) {
      setError("New passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    const ok = await updatePassword(curr, next);
    setLoading(false);
    if (ok) {
      toast.success("Password updated successfully!");
      onClose();
    } else {
      toast.error("Failed to update password. Check your current password.");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#081E33] text-white border-white/20">
        <DialogHeader>
          <DialogTitle>Change Admin Password</DialogTitle>
          <DialogDescription className="text-white/60">
            Enter your current password and set a new secure password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-3 my-2">
            <Input
              type="password"
              placeholder="Current Password"
              value={curr}
              onChange={(e) => setCurr(e.target.value)}
              required
              className="bg-[#0A2540] border-white/20 text-white"
            />
            <Input
              type="password"
              placeholder="New Password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className="bg-[#0A2540] border-white/20 text-white"
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              className="bg-[#0A2540] border-white/20 text-white"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90 font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Login Screen ---------------- */
function AdminLogin() {
  const { login } = useAdmin();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(false);
    setLoading(true);

    const ok = await login(email, pwd);
    setLoading(false);

    if (!ok) {
      setErr(true);
    } else {
      toast.success("Welcome Admin!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0A2540]/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-[#00D4B2]/10 text-[#00D4B2] mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Zimma Terminal</h1>
          <p className="text-sm text-white/60 mt-1">Restricted Access — Super Admin Portal</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zimma.com"
                required
                disabled={loading}
                className="pl-9 bg-[#0A2540] border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="pl-9 bg-[#0A2540] border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          {err && (
            <p className="text-xs text-red-400 text-center animate-shake">
              Invalid admin credentials. Please try again.
            </p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90 font-bold transition-all shadow-lg shadow-[#00D4B2]/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying Admin...
              </>
            ) : (
              "Authenticate Terminal"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}