# Community Phone OTP Setup

This project uses Supabase Auth for Google, Facebook, and phone OTP login.
Do not generate OTP codes in the Next.js app. Supabase should own OTP creation,
expiry, verification, rate limits, and session creation.

## 1. Run the Community SQL

Open Supabase SQL Editor and run the Community block in `supabase/schema.sql`
or run the whole file. The required tables are:

- `fan_profiles`
- `player_likes`
- `player_comments`

They are protected by RLS so only logged-in users can vote/comment as
themselves.

## 2. Enable Phone Auth

In Supabase Dashboard:

1. Go to `Authentication` -> `Providers`.
2. Enable `Phone`.
3. Configure an SMS provider/gateway in Supabase Auth settings.
4. Set SMS OTP expiry to `180` seconds if you want it to match the website's
   3-minute countdown. If Supabase is left at a shorter expiry, users may see
   time left in the UI even though the OTP has already expired.
5. Keep OTP length/rate limits conservative. Supabase phone OTP is normally a
   6-digit code.

Recommended phone format in the UI is E.164:

```text
+85620XXXXXXXX
+66XXXXXXXXX
```

Use one leading `+` in production, for example:

```text
+8562055555555
```

## 3. SMS Gateway Choice

Start with a provider supported by Supabase in your region. For Laos/Thailand,
test delivery before launch because OTP SMS quality depends heavily on carrier
routing.

Good launch checklist:

- Test Lao numbers with `+856`.
- Test Thai numbers with `+66`.
- Check sender ID rules in each country.
- Set spending limits in the SMS provider.
- Monitor failed OTP delivery and abuse attempts.

## 4. Frontend Flow

The player community page calls:

- `supabase.auth.signInWithOtp({ phone })`
- `supabase.auth.verifyOtp({ phone, token, type: "sms" })`

After verification, Supabase returns a normal session. The same session is used
for:

- `player_likes`
- `player_comments`
- GA4 events: `player_voted`, `player_commented`
