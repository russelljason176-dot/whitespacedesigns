# WSD form worker (replaces Formspree): setup, about 10 minutes, free

Nothing is deployed yet. The site still posts to Formspree (`xjgjpkwp`, line ~3236 of `index.html`) until you do step 5.

1. **Email Routing destination.** Cloudflare dashboard > your domain `whitespacedesigns.co.za` > Email > Email Routing. Under Destination addresses, make sure `whitespacedesigns.co.za@gmail.com` is **Verified**. (Your domain already uses Cloudflare Email Routing for incoming mail.)
2. **Create the Worker.** Workers & Pages > Create > Worker > name it `wsd-form` > Deploy, then Edit code and paste `worker.js`.
3. **Add the email binding.** Worker > Settings > Bindings > Add > **Send Email**. Name it `EMAIL`. Choose "Selected destination address" and pick `whitespacedesigns.co.za@gmail.com`.
4. **Optional copy in storage.** Workers > KV > Create namespace `wsd-leads`, then bind it to the Worker as `LEADS`.
5. **Switch the form.** Copy the Worker URL (`https://wsd-form.<your-subdomain>.workers.dev`) and tell Claude: it replaces the Formspree URL in `index.html`, the form posts JSON, and you test with one real submission.

Notes
- Bots are dropped by a hidden `_gotcha` field. Your form needs that hidden field added (Claude does this in step 5).
- Email goes only to your own verified Gmail, so this is notification email, not mass mailing.
- Rollback: change the form URL back to Formspree.
