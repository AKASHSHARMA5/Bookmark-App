# Smart Bookmark App

A full-stack bookmark manager with real-time sync across tabs, built with Next.js 14, Supabase, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see "Environment Variables" below)
# Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with Google to start managing your bookmarks.

## Features

- ✅ **Google OAuth Authentication** — Secure login with Google only (no email/password)
- ✅ **Add Bookmarks** — Create bookmarks with URL and optional title
- ✅ **Delete Bookmarks** — Remove bookmarks with an in-app confirmation modal (no browser `confirm()`)
- ✅ **Private Bookmarks** — Row Level Security ensures users only see their own bookmarks
- ✅ **Real-time Updates** — Changes sync across all open tabs without refresh
  - INSERT events via `postgres_changes`
  - DELETE events via `postgres_changes` and broadcast fallback for cross-tab sync
  - UPDATE events supported
- ✅ **Responsive UI** — Mobile-first layout, touch-friendly controls, safe-area support
- ✅ **Modern UI** — Glass-style cards, full-width background image, transparent panels
- ✅ **Production Ready** — Deployable on Vercel with proper error handling

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Backend:** Supabase (Auth, Database, Realtime)
- **Authentication:** Supabase Auth with Google OAuth + PKCE
- **Real-time:** Supabase Realtime with `postgres_changes` subscriptions
- **Styling:** Tailwind CSS
- **Type Safety:** TypeScript

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- A Google OAuth application set up

## Dependencies

Key dependencies used in this project:

- `next` - Next.js framework with App Router
- `react` & `react-dom` - React library
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Supabase SSR utilities for Next.js
- `tailwindcss` - Utility-first CSS framework
- `typescript` - TypeScript for type safety

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

1. In Supabase dashboard, go to **Database** > **Tables**
2. Click on the `bookmarks` table
3. Look for the **Realtime** tab or a green button that says "Realtime enabled"
4. If Realtime is not enabled, click to enable it (you should see a green indicator)
5. Alternatively, you can verify Realtime is enabled by running this SQL in **SQL Editor**:
   ```sql
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' AND tablename = 'bookmarks';
   ```
   If no rows are returned, run:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
   ```

### 6. Environment Variables

1. Create a file `.env.local` in the project root (do not commit this file).
2. Add your Supabase credentials (from Supabase Dashboard → Settings → API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use your own project URL and anon key; never commit real keys to the repo.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing Real-time Updates

To verify real-time updates are working:

1. Open your app in **two browser tabs** (both logged in as the same user)
2. Open Developer Console (F12) in both tabs
3. **Test INSERT:**
   - In Tab 1: Add a new bookmark
   - In Tab 2: The bookmark should appear automatically
   - Check Tab 2 console for: `🔔 INSERT event received`
4. **Test DELETE:**
   - In Tab 1: Delete a bookmark
   - In Tab 2: The bookmark should disappear automatically
   - Check Tab 2 console for: `🔔 DELETE event received` or `📢 Broadcast DELETE event received`

If real-time updates don't work, check:
- Console for subscription status: Should see `✅ Successfully subscribed to real-time updates`
- Supabase Dashboard: Verify Realtime is enabled for the `bookmarks` table
- Network tab: Check for WebSocket connections to Supabase

## Troubleshooting

### Real-time Updates Not Working

1. **Verify Realtime is enabled:**
   - Go to Supabase Dashboard → Database → Tables → bookmarks
   - Check that Realtime is enabled (green indicator)

2. **Check console for errors:**
   - Look for `❌ Channel error` messages
   - Verify subscription status shows `SUBSCRIBED`

3. **Verify RLS policies:**
   - Ensure RLS policies allow SELECT, INSERT, DELETE for authenticated users
   - Run the SQL from `supabase/schema.sql` if policies are missing

### Authentication Issues

1. **PKCE Error:**
   - Clear browser cookies and cache
   - Ensure you're using `@supabase/ssr` package (already included)
   - Verify cookies are not blocked in browser settings

2. **OAuth Redirect Error:**
   - Verify redirect URIs match exactly in Google Cloud Console
   - Check Supabase redirect URL configuration
   - Ensure URLs use `https` in production

3. **Google consent screen shows "Signing in to xxx.supabase.co":**
   - This is expected when using Supabase Auth with Google. The OAuth flow uses Supabase’s callback URL (`https://your-project.supabase.co/auth/v1/callback`), so Google shows that domain.
   - To improve branding: complete [Google’s app verification](https://support.google.com/cloud/answer/9110914) so your OAuth consent screen can show your app name and logo. For internal or testing apps, the Supabase URL is normal and does not affect security.

### DELETE Events Not Propagating

If DELETE events don't appear in other tabs:
- The app includes a broadcast fallback mechanism
- Check console for `📢 Broadcast DELETE event received` messages
- Verify both tabs are subscribed to the same broadcast channel

## Deploy on Vercel (Step-by-Step)

### Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com) — you can use “Continue with GitHub”)
- Project running locally with Supabase and Google OAuth already set up

---

### Step 1: Push your code to GitHub

1. **Create a new repository** on [github.com](https://github.com/new).  
   - Name it (e.g. `smart-bookmark-app`).  
   - Do **not** add a README, .gitignore, or license (you already have them).  
   - Click **Create repository**.

2. **In your project folder**, open a terminal and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

3. **Confirm** your code is on GitHub (refresh the repo page).

---

### Step 2: Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (with GitHub if possible).
2. Click **Add New…** → **Project**.
3. Under **Import Git Repository**, find your repo and click **Import**.
4. **Do not** click Deploy yet — add environment variables first (Step 3).

---

### Step 3: Add environment variables on Vercel

1. On the import screen, open **Environment Variables**.
2. Add these two variables (use the same values as in your local `.env.local`):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

3. Leave the environment as **Production** (or add the same variables for Preview if you use branches).
4. Click **Deploy**.

---

### Step 4: Get your Vercel URL

1. Wait for the deployment to finish (usually 1–2 minutes).
2. You’ll see a success screen with a URL like:  
   `https://your-project-name.vercel.app`  
   or  
   `https://your-project-name-xxxx.vercel.app`
3. Copy this URL — you need it for the next two steps.

---

### Step 5: Add the Vercel URL in Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Click your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs**, click **Add URI** and add:
   - `https://YOUR_VERCEL_URL/auth/callback`  
   Example: `https://smart-bookmark-app.vercel.app/auth/callback`
4. Click **Save**.

---

### Step 6: Add the Vercel URL in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **URL Configuration**.
3. Under **Redirect URLs**, add:
   - `https://YOUR_VERCEL_URL/auth/callback`  
   (same URL as in Step 5)
4. Click **Save**.

---

### Step 7: Test the live app

1. Open your Vercel URL in a browser (e.g. `https://your-project-name.vercel.app`).
2. Click **Sign in with Google** and complete sign-in.
3. Add and delete a bookmark to confirm everything works.

If sign-in fails with a redirect error, double-check that the **exact** Vercel URL (including `https://`) is added in both Google OAuth and Supabase redirect settings.

---

### Optional: Custom domain

- In the Vercel project: **Settings** → **Domains** → add your domain.
- Then add the same redirect URL with your custom domain in Google OAuth and Supabase (e.g. `https://bookmarks.yourdomain.com/auth/callback`).

## Project Structure

```
├── app/
│   ├── auth/
│   │   ├── callback/     # OAuth callback handler
│   │   └── page.tsx      # Login page
│   ├── api/
│   │   └── auth/
│   │       └── logout/   # Logout endpoint
│   ├── globals.css       # Global styles, glass utilities, background
│   ├── layout.tsx        # Root layout, viewport meta
│   └── page.tsx          # Home page (server component)
├── components/
│   ├── BookmarkApp.tsx   # Main app, real-time subscription, header
│   ├── BookmarkForm.tsx  # Add bookmark form
│   ├── BookmarkList.tsx  # Bookmark list, delete + broadcast
│   └── DeleteConfirmModal.tsx  # In-app delete confirmation modal
├── lib/
│   └── supabase/
│       ├── client.ts     # Client-side Supabase client
│       └── server.ts     # Server-side Supabase client
├── middleware.ts          # Next.js middleware for auth
└── supabase/
    └── schema.sql        # Database schema with RLS policies
```

## How It Works

- **Authentication:** Google OAuth handled by Supabase Auth with PKCE flow for security
- **Database:** PostgreSQL via Supabase with Row Level Security (RLS) policies ensuring data privacy
- **Real-time Updates:**
  - Uses Supabase Realtime `postgres_changes` subscriptions for INSERT, UPDATE, and DELETE events
  - Separate event handlers for each operation type for better reliability
  - Broadcast channel fallback mechanism for DELETE events to ensure cross-tab synchronization
  - Real-time subscriptions filter by `user_id` to only receive events for the logged-in user
- **Privacy:** RLS policies ensure users can only access their own bookmarks
- **Cross-tab Sync:** Changes made in one browser tab automatically appear in other open tabs without refresh

## Real-time Implementation Details

The app uses a dual-approach for real-time updates:

1. **Primary Method (postgres_changes):**
   - Subscribes to PostgreSQL change events via Supabase Realtime
   - Separate handlers for INSERT, UPDATE, and DELETE events
   - Filters events by `user_id` to ensure privacy

2. **Fallback Method (Broadcast):**
   - Uses Supabase broadcast channels for DELETE events
   - Ensures DELETE operations propagate even if `postgres_changes` has issues
   - All tabs subscribe to the same broadcast channel

This ensures reliable cross-tab synchronization even in edge cases.

## Common Issues & Solutions

### Issue: Real-time DELETE events not working

**Solution:** The app includes a broadcast fallback. Check console for broadcast messages. If neither method works, verify:
- Realtime is enabled in Supabase Dashboard
- RLS policies allow DELETE operations
- User is properly authenticated

### Issue: "PKCE code verifier not found" error

**Solution:**
- Clear browser cookies and cache
- Restart the dev server
- Ensure `@supabase/ssr` is installed (should be in package.json)
- Check that cookies are not blocked in browser settings

### Issue: Changes not reflecting in other tabs

**Solution:**
- Verify both tabs show `✅ Successfully subscribed to real-time updates` in console
- Check Network tab for WebSocket connections
- Ensure both tabs are logged in as the same user
- Try refreshing both tabs

## Security & Submitting the Project

- **Never commit secrets.** Keep `.env` and `.env.local` out of version control (they are in `.gitignore`). Use placeholder values in the README only.
- **No API keys in code.** All Supabase configuration comes from environment variables.
- Before pushing or sharing the repo, run `git status` and ensure no `.env` or `.env.local` file is staged.

## License

MIT
