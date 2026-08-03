# YAZZOON moment submissions

1. Create or choose a Supabase project dedicated to this gallery.
2. Run `supabase/migrations/20260803_yazzoon_moments.sql` in the SQL editor.
3. Deploy `supabase/functions/notify-yazzoon-moment` as an Edge Function.
4. Add the Edge Function secret `RESEND_API_KEY` and verify `notifications.yazzoon.com` in Resend.
5. Copy `.env.example` to `.env.local` and add the project's public URL and anon key.
6. Restart Vite. Test with a real phone before publishing the QR code.

Submitted photographs are private and remain `pending` until the team reviews them. Do not publish photographs without checking consent, visible people, and rights.
