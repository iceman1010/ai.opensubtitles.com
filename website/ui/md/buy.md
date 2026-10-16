# Buy credits

> Credits are the pay-as-you-go currency for AI transcription and translation. Credits never expire — you only pay for what you use.

- Buy in the web app (login required): https://ai.opensubtitles.com/buy
- Prices per model: see [pricing](https://ai.opensubtitles.com/pricing.md)
- Credits are shared across the website and all apps (same opensubtitles.com account)
- Failed jobs are never charged; failed translations are refunded automatically

## Credit packages

Packages are listed on the [buy page](https://ai.opensubtitles.com/buy) — each package has a credit value and may include a bonus percentage.

Via API (login required):

```
POST /ai/credits/buy
Content-Type: multipart/form-data
```

→ `{ "data": [ { "name": "…", "value": …, "discount_percent": …, "checkout_url": "https://…" } ] }`

Open a package's `checkout_url` to complete the purchase.
