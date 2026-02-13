# Smart Bookmark App

A simple bookmark manager with real-time updates built with Next.js, Supabase, and Tailwind CSS.

## Features

- ✅ Google OAuth authentication (no email/password)
- ✅ Add bookmarks with URL and title
- ✅ Private bookmarks (users can only see their own)
- ✅ Real-time updates across tabs without page refresh
- ✅ Delete bookmarks
- ✅ Deployed on Vercel

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Backend:** Supabase (Auth, Database, Realtime)
- **Styling:** Tailwind CSS

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Google OAuth application set up

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the SQL script from `supabase/schema.sql` to create the bookmarks table and policies
4. Go to **Settings** > **API** and copy your:
   - Project URL
   - `anon` public key

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)
7. Copy your **Client ID** and **Client Secret**

### 4. Configure Supabase Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Enter your Google OAuth **Client ID** and **Client Secret**
4. Save the settings

### 5. Enable Realtime

1. In Supabase dashboard, go to **Database** > **Replication**
2. Enable replication for the `bookmarks` table

### 6. Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **New Project**
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

### 3. Update Google OAuth Redirect URI

After deployment, update your Google OAuth redirect URI to include:
- `https://your-vercel-app.vercel.app/auth/callback`

### 4. Update Supabase Redirect URL

In Supabase dashboard, go to **Authentication** > **URL Configuration** and add:
- `https://your-vercel-app.vercel.app/auth/callback`

## Project Structure

```
├── app/
│   ├── auth/
│   │   ├── callback/     # OAuth callback handler
│   │   └── page.tsx      # Login page
│   ├── api/
│   │   └── auth/
│   │       └── logout/   # Logout endpoint
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── BookmarkApp.tsx   # Main app component
│   ├── BookmarkForm.tsx  # Add bookmark form
│   └── BookmarkList.tsx  # Bookmark list with delete
├── lib/
│   └── supabase/
│       ├── client.ts     # Client-side Supabase client
│       └── server.ts     # Server-side Supabase client
└── supabase/
    └── schema.sql        # Database schema
```

## How It Works

- **Authentication:** Google OAuth handled by Supabase Auth
- **Database:** PostgreSQL via Supabase with Row Level Security (RLS) policies
- **Real-time:** Supabase Realtime subscriptions listen for changes to the bookmarks table
- **Privacy:** RLS policies ensure users can only access their own bookmarks

## License

MIT
