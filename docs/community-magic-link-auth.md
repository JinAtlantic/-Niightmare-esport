# Community Magic Link Auth Setup

The community login uses Supabase Auth with two public options:

- Google OAuth
- Email Magic Link

Facebook login and phone OTP are intentionally not shown in the website UI.

## Supabase settings

In Supabase Dashboard:

1. Go to `Authentication` -> `Providers`.
2. Keep `Google` enabled.
3. Enable `Email`.
4. Make sure Magic Link / passwordless email login is allowed.
5. Go to `Authentication` -> `URL Configuration`.
6. Set the site URL:

```text
https://www.niightmareesport.com
```

7. Add redirect URLs:

```text
https://www.niightmareesport.com/**
https://niightmareesport.com/**
http://localhost:3000/**
```

## Frontend flow

The player community page calls:

```ts
supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/`,
    shouldCreateUser: true,
  },
});
```

After the user clicks the email link, Supabase returns them to the website and
creates the normal Supabase session. That session is used for:

- `player_likes`
- `player_comments`
- GA4 events: `player_voted`, `player_commented`

