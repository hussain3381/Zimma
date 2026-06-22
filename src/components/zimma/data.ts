import {
  Zap, Wrench, Sparkles, Paintbrush, Hammer, Wind,
  Bug, Truck, ShieldCheck, Trees, Tv2, Droplets,
} from "lucide-react";

export const categories = [
  { slug: "electrician", name: "Electrician", icon: Zap, color: "bg-amber-100 text-amber-700", count: 142 },
  { slug: "plumber", name: "Plumber", icon: Wrench, color: "bg-blue-100 text-blue-700", count: 98 },
  { slug: "cleaning", name: "Home Cleaning", icon: Sparkles, color: "bg-emerald-100 text-emerald-700", count: 210 },
  { slug: "painter", name: "Painter", icon: Paintbrush, color: "bg-rose-100 text-rose-700", count: 76 },
  { slug: "carpenter", name: "Carpenter", icon: Hammer, color: "bg-orange-100 text-orange-700", count: 64 },
  { slug: "ac-tech", name: "AC Technician", icon: Wind, color: "bg-cyan-100 text-cyan-700", count: 88 },
  { slug: "pest", name: "Pest Control", icon: Bug, color: "bg-lime-100 text-lime-700", count: 41 },
  { slug: "movers", name: "Movers & Packers", icon: Truck, color: "bg-violet-100 text-violet-700", count: 53 },
  { slug: "security", name: "Security Systems", icon: ShieldCheck, color: "bg-slate-100 text-slate-700", count: 27 },
  { slug: "gardening", name: "Gardening", icon: Trees, color: "bg-green-100 text-green-700", count: 34 },
  { slug: "appliance", name: "Appliance Repair", icon: Tv2, color: "bg-indigo-100 text-indigo-700", count: 61 },
  { slug: "water-tank", name: "Water Tank Cleaning", icon: Droplets, color: "bg-sky-100 text-sky-700", count: 48 },
];

export type Provider = {
  id: string;
  name: string;
  trade: string;
  area: string;
  rating: number;
  reviews: number;
  jobs: number;
  experience: number;
  price: string;
  available: string;
  verified: boolean;
  skills: string[];
  avatar: string;
};

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=2563eb,10b981,f59e0b,8b5cf6&backgroundType=gradientLinear`;

export const providers: Provider[] = [
  { id: "p1", name: "Asif Mehmood", trade: "Master Electrician", area: "DHA Phase 5", rating: 4.9, reviews: 312, jobs: 540, experience: 11, price: "PKR 800/hr", available: "Available today", verified: true, skills: ["Wiring", "MCB", "Inverter", "UPS"], avatar: avatar("Asif Mehmood") },
  { id: "p2", name: "Bilal Hussain", trade: "Senior Plumber", area: "Gulshan-e-Iqbal", rating: 4.8, reviews: 245, jobs: 410, experience: 9, price: "PKR 700/hr", available: "Available tomorrow", verified: true, skills: ["Leak Repair", "Geyser", "Fittings"], avatar: avatar("Bilal Hussain") },
  { id: "p3", name: "Rehana Khan", trade: "Deep Cleaning Lead", area: "Clifton Block 2", rating: 5.0, reviews: 198, jobs: 320, experience: 6, price: "PKR 4,500/visit", available: "Available today", verified: true, skills: ["Deep Clean", "Sofa", "Kitchen"], avatar: avatar("Rehana Khan") },
  { id: "p4", name: "Imran Qureshi", trade: "AC Technician", area: "North Nazimabad", rating: 4.7, reviews: 176, jobs: 290, experience: 8, price: "PKR 1,200/visit", available: "Available today", verified: true, skills: ["Split AC", "Gas Refill", "Service"], avatar: avatar("Imran Qureshi") },
  { id: "p5", name: "Salman Raza", trade: "Painter & Polisher", area: "PECHS", rating: 4.6, reviews: 142, jobs: 220, experience: 7, price: "PKR 35/sq.ft", available: "Booked till Fri", verified: true, skills: ["Emulsion", "Texture", "Polish"], avatar: avatar("Salman Raza") },
  { id: "p6", name: "Kashif Ali", trade: "Carpenter", area: "Bahadurabad", rating: 4.8, reviews: 165, jobs: 260, experience: 10, price: "PKR 900/hr", available: "Available today", verified: true, skills: ["Wardrobes", "Doors", "Repair"], avatar: avatar("Kashif Ali") },
  { id: "p7", name: "Nadia Siddiqui", trade: "Home Cleaner", area: "Bahria Town", rating: 4.9, reviews: 220, jobs: 380, experience: 5, price: "PKR 3,800/visit", available: "Available today", verified: true, skills: ["Bathroom", "Kitchen", "General"], avatar: avatar("Nadia Siddiqui") },
  { id: "p8", name: "Faisal Ahmed", trade: "Appliance Engineer", area: "Korangi", rating: 4.7, reviews: 134, jobs: 210, experience: 12, price: "PKR 1,500/visit", available: "Available tomorrow", verified: true, skills: ["Fridge", "Washing M.", "Microwave"], avatar: avatar("Faisal Ahmed") },
];

export const testimonials = [
  { name: "Ayesha Tariq", area: "Clifton", text: "Booked a deep cleaning before Eid — the team was punctual, polite and thorough. Zimma is now my go-to.", rating: 5 },
  { name: "Hamza Sheikh", area: "DHA Phase 6", text: "My AC stopped cooling at midnight. By 9 AM a verified technician was at my door. Lifesaver service!", rating: 5 },
  { name: "Sana Iqbal", area: "Gulshan", text: "Transparent pricing, no haggling, and the electrician explained everything. Felt premium.", rating: 5 },
];

export const stats = [
  { label: "Happy Customers", value: "52K+" },
  { label: "Verified Pros", value: "3,800+" },
  { label: "Jobs Completed", value: "180K+" },
  { label: "Avg. Rating", value: "4.9 ★" },
];