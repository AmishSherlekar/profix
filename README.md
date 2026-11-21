# ProFix — Local Plumber & Electrician Service Finder

A complete, responsive web application connecting customers with nearby verified plumbers and electricians. Customers can discover professionals via search or interactive map, view ratings and reviews, and send a direct service request. Professionals manage incoming requests and profile availability. Platform administrators verify licenses, moderate reviews, and maintain service categories.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives, Lucide React icons, React Router DOM, TanStack Query v5, React Hook Form, Zod
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security, RPC functions, Supabase Storage)
- **Map**: React Leaflet & OpenStreetMap
- **Architecture**: Zero-cost free-tier architecture, direct Supabase SDK with Postgres RPC state-machine enforcement (no separate Node/Express backend)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- [pnpm](https://pnpm.io/) or npm

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Execute the schema migration file:
   - [supabase/migrations/001_initial_schema.sql](file:///c:/Users/USER/Desktop/Amish/cti%20shubhav/profix/supabase/migrations/001_initial_schema.sql)
4. Execute the storage configuration file:
   - [supabase/migrations/002_storage_setup.sql](file:///c:/Users/USER/Desktop/Amish/cti%20shubhav/profix/supabase/migrations/002_storage_setup.sql)
5. (Optional) Run the seed file to populate categories:
   - [supabase/seed.sql](file:///c:/Users/USER/Desktop/Amish/cti%20shubhav/profix/supabase/seed.sql)

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local` (or `.env`):
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Never include the service_role key here — it is not needed and must remain secret).*

### 5. Run Development Server
```bash
pnpm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Production Build
```bash
pnpm run build
```

---

## 👥 Roles & Workflows

### 🧑‍💼 Customer
- Register/Login with email and password.
- Browse plumbers and electricians with filters (service category, rating, availability).
- Interactive **Map View** with distance calculation (Haversine formula; precise user coordinates are never exposed).
- Send a service request to **one** chosen professional.
- Track status live (with automatic TanStack Query polling every 10–15s).
- Confirm job completion once the professional marks it done.
- Leave a 1–5 star review and feedback.

### 👷 Professional
- Register and configure profile (bio, experience years, service area, availability toggle).
- Upload trade certificates and license documents to private storage for admin verification.
- Receive requests addressed specifically to them.
- Accept or reject incoming requests.
- Transition request to `in_progress` and mark `pending_confirmation` when work finishes.
- View customer ratings and reviews.

### 🛡️ Admin
- Access protected `/admin` console (requires user role `admin` in database).
- Verify or reject submitted certificates with reason notes.
- Manage service categories (create, edit, icon, toggle active status).
- Moderate and delete inappropriate customer reviews.
- View platform user list and activity metrics.

---

## 🔒 Security & State Machine

1. **Row Level Security (RLS)**:
   - Enabled on every table (`profiles`, `professional_profiles`, `service_categories`, `professional_services`, `service_requests`, `request_status_history`, `reviews`, `professional_documents`, `admin_actions`).
   - Ownership verified via `auth.uid()`.
   - Users cannot elevate their own role to `admin`.
2. **Postgres RPC Functions**:
   - `submit_service_request`: Server-enforced customer role check, open status initialization.
   - `update_request_status`: State-machine enforcement (`open` → `accepted` → `in_progress` → `pending_confirmation` → `completed` → `reviewed`). Arbitrary status tampering is blocked.
   - `submit_review`: Ensures only the original customer can review an officially completed job (exactly one review per request).
   - `verify_professional`: Admin-only verification procedure.
   - `get_professionals_nearby`: Distance and filter query with privacy protection.

---

## ☁️ Deployment (Vercel)

1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy! Vercel will run `vite build` and serve the production assets.
