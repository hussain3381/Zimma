import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/zimma/auth-context";

const PROFESSIONS = [
  "Electrician",
  "Plumber",
  "AC Technician",
  "Carpenter",
  "Painter",
  "Cleaner",
  "Pest Control",
  "Movers",
  "Security",
  "Gardening",
  "Appliance",
];

const generateDefaultBio = (
  profession: string,
  experience: string,
  skills: string,
  area: string,
) => {
  const prof = profession || "Service Professional";
  const expText = experience ? `${experience} years of` : "extensive";
  const skillsText = skills ? ` specializing in ${skills}` : "";
  const areaText = area ? ` serving in ${area}` : "";

  return `Professional ${prof} with ${expText} experience${skillsText}. Committed to delivering top-quality, reliable, and professional services${areaText}. Contact me for efficient and high-standard work.`;
};

export function BecomeProDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [profession, setProfession] = useState("Electrician");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [area, setArea] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user || user.role !== "customer") {
      setError("Please sign in first.");
      return;
    }
    if (!phone.trim()) return setError("Phone number is required.");
    if (cnic.replace(/\D/g, "").length < 13)
      return setError("Enter a valid 13-digit CNIC.");
    if (!area.trim()) return setError("Service area is required.");

    setBusy(true);
    const row = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: phone.trim(),
      cnic: cnic.trim(),
      profession,
      area: area.trim(),
      experience: Number(experience) || 0,
      hourly_rate: Number(hourlyRate) || 800,
      bio: bio.trim() || `${profession} serving Karachi.`,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status: "pending" as const,
      verified: false,
    };

    const { error: err } = await supabase.from("providers").upsert(row);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Application submitted! Verification pending.");
    onOpenChange(false);
    await refresh();
    // fix that ok
    navigate({ to: "/auth-pending" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" /> Become a Service Pro
          </DialogTitle>
          <DialogDescription>
            Submit your credentials. Our Super Admin will verify your CNIC and
            background before your Pro profile goes live.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-2 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Profession
            </label>
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full appearance-none rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>
                  Select Profession
                </option>
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PField
            icon={Phone}
            label="Phone number"
            value={phone}
            onChange={(v) => {
              // Sirf numbers aur '+' sign allow karega
              let input = v.replace(/[^\d+]/g, "");

              // '+' ko sirf shuru mein rakhne ke liye validation
              if (input.startsWith("+")) {
                input = "+" + input.slice(1).replace(/\+/g, "");
              } else {
                input = input.replace(/\+/g, "");
              }

              // 1. Agar International format ho (+92 ya 92 se shuru ho)
              if (input.startsWith("+92") || input.startsWith("92")) {
                const digits = input.replace(/\D/g, "").slice(0, 12); // Max 12 digits (92 + 10 digits)

                if (digits.length <= 2) {
                  setPhone(`+${digits}`);
                } else if (digits.length <= 5) {
                  setPhone(`+92 ${digits.slice(2)}`);
                } else {
                  setPhone(`+92 ${digits.slice(2, 5)}-${digits.slice(5)}`);
                }
              }
              // 2. Agar Local format ho (0 se shuru ho)
              else if (input.startsWith("0")) {
                const digits = input.replace(/\D/g, "").slice(0, 11); // Max 11 digits (03XXXXXXXXX)

                if (digits.length <= 4) {
                  setPhone(digits);
                } else {
                  setPhone(`${digits.slice(0, 4)}-${digits.slice(4)}`);
                }
              }
              // 3. Agar baghair 0 ya +92 ke direct start karein (e.g., 340...)
              else {
                const digits = input.replace(/\D/g, "").slice(0, 10); // Max 10 digits
                if (digits.length <= 3) {
                  setPhone(digits);
                } else {
                  setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
                }
              }
            }}
            placeholder="+92 340-1234567"
          />

          <PField
            icon={IdCard}
            label="CNIC number"
            value={cnic}
            onChange={(v) => {
              // Sirf 13 digits nikalega
              const digits = v.replace(/\D/g, "").slice(0, 13);
              // Auto dash formatting (XXXXX-XXXXXXX-X)
              let formatted = digits;
              if (digits.length > 5) {
                formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
              }
              if (digits.length > 12) {
                formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
              }
              setCnic(formatted);
            }}
            placeholder="42101-1234567-1"
          />

          <PField
            icon={MapPin}
            label="Service area"
            value={area}
            onChange={setArea}
            placeholder="DHA, Clifton, Gulshan"
          />

          <div className="grid grid-cols-2 gap-3">
            <PField
              icon={Briefcase}
              label="Experience (years)"
              value={experience}
              onChange={setExperience}
              placeholder="5"
            />
            <PField
              icon={Briefcase}
              label="Hourly rate (PKR)"
              value={hourlyRate}
              onChange={setHourlyRate}
              placeholder="800"
            />
          </div>

          <PField
            icon={Briefcase}
            label="Skills (comma separated)"
            value={skills}
            onChange={setSkills}
            placeholder="Wiring, MCB, Inverter"
          />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-muted-foreground">
                About you
              </label>
              <button
                type="button"
                onClick={() => {
                  const autoBio = generateDefaultBio(
                    profession,
                    experience,
                    skills,
                    area,
                  );
                  setBio(autoBio);
                }}
                className="text-xs font-semibold text-primary hover:underline focus:outline-none"
              >
                ✨ Auto Generate Bio
              </button>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Describe yourself or click 'Auto Generate Bio' to write it instantly!"
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2 btn-glow"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit application"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl pl-9"
        />
      </div>
    </div>
  );
}
