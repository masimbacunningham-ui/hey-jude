<<<<<<< HEAD
# Hey Jude

**Hey Jude — Your household financial assistant**

This is the first deployable MVP structure for the shared household finance app for Cunningham & Lynne.

## What is included

- Mobile-first Next.js 16 web app / PWA
- Email/password authentication
- Shared household creation + 8-character join code
- Shared household members
- Financial month logic: 25th → 24th
- Income and expense capture
- Account field for cash/bank/wallet tracking
- Household vs Zimbabwe project tagging
- Zimbabwe project categories:
  House, Fencing, Farm, Poultry, Greenhouses, Borehole/Water, Equipment, Other
- Transaction history and search
- AI receipt extraction endpoint with image upload
- AI household-finance assistant endpoint
- Supabase Postgres schema with Row Level Security
- Private receipt-storage bucket policies
- PWA manifest + service-worker registration
- Receipt images retained in private Supabase Storage
- Browser microphone voice-entry for quick no-receipt logging
- Deployment environment template

## Important

This is a real application codebase, but it is not magically connected to your Supabase/OpenAI accounts. Those services need to be configured before two phones can share live data.

Supabase is used for authentication, database, and receipt storage. Keep OpenAI secrets on the server; never put an OpenAI API key in browser code.

## 1. Create the backend

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql` in full.
4. Copy the Supabase project URL and publishable key.

## 2. Configure locally

Copy `.env.example` to `.env.local` and set:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna

The OpenAI key is optional for the core ledger. Without it, receipt AI and Ask Jude are disabled.

## 3. Run

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 4. Deploy

Recommended: push this repository to GitHub and import it into Vercel.

Add the same environment variables in Vercel Project Settings.

Then deploy.

Open the Vercel URL on the iPhone in Safari:
Share → Add to Home Screen → Open as Web App → Add.

Do the same on Lynne's phone.

## 5. First household setup

- Create your account.
- Create the household "Cunningham & Lynne".
- Hey Jude will display the household join code.
- Create Lynne's account on her phone.
- Use Join household and enter the code.

## Next production upgrades

The foundation is ready for:
- higher-quality voice transcription via a dedicated speech model
- account/balance reconciliation
- recurring bills
- budget envelopes
- contribution history
- monthly PDF/CSV reports
- household invitations instead of join codes
- audit log
- richer AI answers using server-side database queries
- offline sync/conflict handling
- native App Store / Google Play packaging

Do not treat an AI-extracted receipt as final until the user confirms it. The UI is designed around that principle.
=======
# hey-jude
Shared household financial assistant
>>>>>>> 5dcb09e4c71c4f1415817fcfba3f12cec24a9961
