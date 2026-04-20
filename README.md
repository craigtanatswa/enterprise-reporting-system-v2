# 📊 Enterprise Reporting System v2

A streamlined, full-stack enterprise web application for **document submission, tracking, and reporting** — built to digitize and centralize organizational reporting workflows, replacing manual paper-based or spreadsheet-driven processes.

🔗 **Repository:** [github.com/craigtanatswa/enterprise-reporting-system-v2](https://github.com/craigtanatswa/enterprise-reporting-system-v2)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment](#deployment)

---

## Overview

Enterprise Reporting System v2 is the second iteration of an internal reporting platform, redesigned and streamlined for improved usability and performance. It enables staff to submit documents and reports digitally, track submission statuses in real time, and gives administrators a centralized dashboard for monitoring, reviewing, and exporting organizational data.

---

## Key Features

- **Document Submission** — Users can submit reports and documents through structured forms with validation
- **Submission Tracking** — Real-time status tracking of submitted documents across the organization
- **Admin Dashboard** — Visual overview of submission activity with charts and key metrics
- **Role-Based Access Control** — Separate views and permissions for standard users and administrators, powered by Supabase Auth
- **PDF Export** — Generate and download formatted PDF reports directly from the dashboard
- **Excel Export** — Export submission data to `.xlsx` spreadsheets for offline analysis
- **Data Visualizations** — Interactive charts and graphs built with Recharts for reporting insights
- **Form Validation** — Robust client-side validation using React Hook Form and Zod schemas
- **Responsive UI** — Fully responsive design using Tailwind CSS and Radix UI components

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Database & Auth | [Supabase](https://supabase.com/) (PostgreSQL + Auth) |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI / shadcn/ui |
| Charts | [Recharts](https://recharts.org/) |
| PDF Export | jsPDF + jspdf-autotable |
| Excel Export | SheetJS (xlsx) |
| Forms | React Hook Form + Zod |
| Deployment | [Vercel](https://vercel.com/) |

---

## Project Structure

```
enterprise-reporting-system-v2/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and Supabase client
├── scripts/              # Database migration and seed scripts
├── styles/               # Global CSS styles
├── public/               # Static assets
├── next.config.mjs       # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── docker-compose.yml    # Local dev services
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [pnpm](https://pnpm.io/) (recommended) or npm
- A [Supabase](https://supabase.com/) project (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/craigtanatswa/enterprise-reporting-system-v2.git

# Navigate into the project
cd enterprise-reporting-system-v2

# Install dependencies
pnpm install
```

### Running Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

---

## Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project under **Settings → API**.

---

## Database Setup

The project uses Supabase (PostgreSQL) as its database. SQL migration scripts are located in the `/scripts` directory.

To set up your database schema:

1. Go to your Supabase project's **SQL Editor**
2. Run the migration scripts found in `/scripts` in order
3. Ensure Row Level Security (RLS) policies are correctly configured for your use case

---

## Deployment

This project is optimized for deployment on **[Vercel](https://vercel.com)**:

1. Push the project to a GitHub repository
2. Import the repository on [vercel.com](https://vercel.com)
3. Add your environment variables in the Vercel project settings
4. Deploy — Vercel will auto-detect Next.js and handle the build

---

## Version History

| Version | Description |
|---------|-------------|
| v1 | Initial enterprise reporting system |
| **v2** | **Streamlined for document submission and tracking (current)** |

---

> Built with Next.js, Supabase, and TypeScript.
