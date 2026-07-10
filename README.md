# Zimma — A Hyper-Local Service Marketplace 🚀
### **Aptech Vision 2026**

**Zimma** is a modern, fast, and secure service-based web platform designed to bridge the gap between local service providers (electricians, plumbers, carpenters, cleaners, AC technicians) and customers across Karachi. Built using a robust and scalable frontend architecture integrated with a live Supabase backend, Zimma aims to create a "Trusted Ecosystem" with localized search and a sustainable 5% commission model.

---

## 🌟 Key Features

- **Dual-Interface Dashboard Architecture:**
  - **Customer Dashboard:** Allows users to browse services, check verified provider ratings, manage bookings, and view transparent pricing.
  - **Provider Dashboard:** Enables local technicians to manage incoming orders, track active jobs, and monitor their earnings seamlessly.
- **Real Authentication & State:** Secure routing and user sessions protecting dashboard routes using live Supabase Authentication (Google OAuth & Email).
- **Highly Responsive UI:** Designed with a mobile-first approach using Tailwind CSS and accessible Shadcn UI components.

---

## 🛠️ Tech Stack & Architecture

- **Core Framework:** React.js (via Vite for lightning-fast build times)
- **Backend & Database:** Supabase (PostgreSQL, Realtime, Auth)
- **Routing:** TanStack Router (File-based, 100% type-safe routing to eliminate broken links)
- **Data Management:** TanStack Query (React Query for optimized server-state caching and seamless loading flows)
- **Styling & Components:** Tailwind CSS & Shadcn UI (Component-driven customization)
- **Toasts & Notifications:** Sonner (Elegant, non-blocking user feedback)

---

## 🚀 Getting Started (Local Development)

Follow these steps to run the project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hussain3381/Zimma.git
   cd Zimma
2. **Install dependencies:**

    ```
    npm install

3. **Start the development server:**
   ```bash
   npm run dev
   
## **Roadmap: Vision for Round 2 & Round 3**
As this project advances through the next rounds of Aptech Vision 2026, the following enterprise-grade features will be integrated:

> **Round 2: Dynamic Geolocation & Backend Integration**

Moving from simulated data to a live database (Node.js/Express + MongoDB).

Integration of Google Maps API / Leaflet.js for real-time, radius-based provider search.

> **Round 3: Real-Time Features & Payments**

WebSockets (Socket.io) integration for live tracking and in-app chat between client and provider.

Payment gateway integration (Stripe / Local Wallets) automate the 5% commission split.
