# WSD geo worker: setup, about 5 minutes, free

Not deployed yet. Until you do this, the site guesses the currency from the visitor's browser time zone (works for most people, a bit less accurate than a real country lookup).

1. Cloudflare dashboard > Workers & Pages > Create > Worker > name it `wsd-geo` > Deploy, then **Edit code**, paste `worker.js`, Deploy.
2. Worker > **Settings > Domains & Routes > Add > Route**. Route: `whitespacedesigns.co.za/geo`. Zone: `whitespacedesigns.co.za`.
3. Test: open `https://whitespacedesigns.co.za/geo` in a browser. You should see `{"country":"ZA"}`.

Notes
- The site's DNS record for the domain must be proxied through Cloudflare (it is; responses already come from Cloudflare).
- It only returns a two-letter country code. Nothing is stored or logged.
- Rates and the country-to-currency mapping live in `assets/currency.js`.
- Rollback: delete the route. The site falls back to the time-zone guess.
