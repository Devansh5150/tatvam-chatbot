# Tatvam: Meet Your Own Answer 🛡️🕉️

A cinematic, spiritual landing page experience designed to bridge ancient wisdom with modern interactive technology. Built with **Next.js**, **Supabase**, and **Framer Motion**.

## ✨ Mystical Features

- **🛡️ Cinematic Portal Experience**: A "Dr. Strange" inspired entry point featuring rotating spark rings and a meditative energy pulse.
- **🌀 Sacred Geometry Mandala**: A high-fidelity, multi-layered SVG mandala with mathematically precise Hindi characters (ॐ, त, त्व, म, अ, सि).
- **🌠 Interactive Invitation**: A 3D holographic "Invitation Card" that reacts to mouse movement, serving as a divine revelation post-sign-up.
- **🛡️ Supabase Persistence**: Secured waitlist storage with server-side validation and duplicate prevention.
- **📿 Souful Aesthetic**: Traditional Indian typography (Tiro Devanagari) paired with a minimalist, creamy desert palette.

## 🚀 Getting Started

### 1. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
Run the following SQL in your Supabase SQL Editor to create the necessary table and security policies:

```sql
create table waitlist (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  created_at timestamptz default now()
);

-- Enable RLS and allow anonymous inserts
alter table waitlist enable row level security;

create policy "Allow anonymous inserts"
on waitlist for insert
to anon
with check (true);
```

### 3. Installation
```bash
npm install
npm run dev
```

## 🛠️ Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion / CSS Keyframes
- **Backend**: Supabase (Database & Auth)
- **Validation**: Zod
- **Icons**: Lucide React
- **Typography**: Google Fonts (Tiro Devanagari Hindi, Crimson Text, Source Sans Pro)

---
"You are the journey. You are the answer." 🛡️