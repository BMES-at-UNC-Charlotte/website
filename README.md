# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

## Donations and sponsorships

`/sponsors` offers individual donations and corporate sponsorships. Preset
amount buttons open Stripe Checkout directly. Custom individual donations accept
$1 to $10,000 USD, including cents. Sponsorship questions and custom sponsorships
link to `unccbmes@gmail.com`; custom sponsorship never starts a payment.

Authorized admins can manage paid packages at `/admin/sponsorship`, using the
existing officer portal and Google sign-in. Add exact Stripe Price IDs beginning
with `price_`, not Product IDs. Each price must be active, fixed, one-time, USD,
and at least $1, with an active linked product. The site reads the amount from
that exact price and the name and description from its product. Packages sort
by ascending price. Product default prices are not used. An empty configuration
offers email contact only. Saving settings reads Stripe and updates this site's
database; it does not create or edit Stripe products, prices, or account settings.

Paid packages lead to `/sponsors/register?tier=price_...` for company registration,
then Stripe Checkout. Registration collects company contact information,
sponsorship preferences, recruiting opportunities, partnership interests, and an
optional PNG, JPEG, or WebP logo up to 2 MB. Card details stay on Stripe. Checkout
rechecks the configured Price ID before starting a payment.

### Deployment

Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SITE_URL` to the public site
origin in the deployment environment. Use a test key for development. Existing
officer authentication configuration stays the same as main. Stripe configuration
is required when starting checkout, not for building or using the officer portal.

Apply the committed Prisma migrations and generate the client:

```sh
pnpm db:migrate
pnpm exec prisma generate
```

The new donation migration follows main's initial auth/survey migration and adds
only `DonationPaymentStatus`, `DonationCheckout`, and `SponsorshipPrice`. It does
not alter authentication, officers, or surveys. Prisma CLI reads `.env` rather
than Next.js's `.env.local`; provide the intended `DATABASE_URL` when they differ.

Create a Stripe webhook endpoint at `/api/stripe/webhook` for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Individual donations create a one-time line item and a Stripe product record.
Sponsorships use the configured existing prices. The return page and signed
webhooks verify Stripe's current payment status. Duplicate or late events cannot
revert a confirmed payment. The public status API exposes no company details or
logos. Canceling checkout restores the sponsor form from browser session storage
when available. This flow does not send sponsor emails itself; Stripe receipts
follow the account's receipt settings.

`DonationCheckout` stores registration, selected product/price IDs, payment status,
Stripe session/payment IDs, and optional logo bytes. Review confirmed contributions
by filtering for `SUCCEEDED` in Prisma Studio.

### Verification

With Node 22.18 or newer, run `node --test tests/*.test.mjs`, `pnpm typecheck`,
`pnpm lint`, and `pnpm build`. Checkout and settings tests use in-memory Stripe and
database adapters and create no Stripe records. The implementation checkout is
`/home/jussy/git/uncc-bmes-donations` on `donation-sponsorship`; run
`pnpm dev --hostname 0.0.0.0 --port 3001` for the local preview.

To verify webhooks against an existing paid sandbox checkout on the local preview:

```sh
DONATION_TEST_SESSION_ID=cs_test_your_session node tests/donation.integration.mjs
```

This requires `.env.local`, a server on port 3001, a test Stripe key, and a local
webhook secret. It reads an existing sandbox checkout and sends signed fixtures
to the local server. It creates no Stripe products or payments.
