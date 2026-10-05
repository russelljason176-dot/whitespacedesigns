# WSD form worker (replaces Formspree, feeds Mission Control): setup, about 15 minutes, free

Nothing is deployed yet. The site still posts to Formspree (`xjgjpkwp`, `index.html` line ~3060) until step 7.

What it does: the site form posts to this Worker. The Worker saves the lead to Cloudflare KV first (so nothing is lost), emails it to you, and Mission Control reads the saved leads through a private, key-protected `/leads` feed.

Do this in the Cloudflare account that owns `whitespacedesigns.co.za` (the one with the domain's DNS and Email Routing).

1. **Email Routing destination.** Domain `whitespacedesigns.co.za` > Email > Email Routing. Under Destination addresses, make sure `contact.whitespacedesigns@gmail.com` is **Verified**.
2. **KV store.** Workers & Pages > KV > Create namespace `wsd-leads`.
3. **Create the Worker.** Workers & Pages > Create > Worker > name it `wsd-form` > Deploy, then Edit code and paste `worker.js`.
4. **Bindings** (Worker > Settings > Bindings):
   - **Send Email**, name `EMAIL`, "Selected destination address" `contact.whitespacedesigns@gmail.com`.
   - **KV namespace**, name `LEADS`, pick `wsd-leads`.
5. **Admin key (secret).** Worker > Settings > Variables and Secrets > Add > type **Secret**, name `ADMIN_KEY`, value = a long random string (for example 40 random characters). Keep a copy.
6. **Connect Mission Control.** Create `C:\Users\Jason\Documents\Dashboards\MissionControl\form-worker.json`:
   ```json
   { "url": "https://wsd-form.<your-subdomain>.workers.dev", "adminKey": "<the ADMIN_KEY from step 5>" }
   ```
   Then run the **Refresh Mission Control Data** shortcut. "Website enquiries" in Mission Control switches from "Not connected yet" to your leads.
7. **Switch the forms.** Tell Claude the Worker URL. It replaces the Formspree URL in `index.html` (and the other forms), posts JSON, adds the hidden `_gotcha` field and a `source` field, and you test with one real submission.

Notes
- Bots are dropped by a hidden `_gotcha` field.
- `source` records which page the form was on, so Mission Control can show which page produces enquiries.
- Email goes only to your own verified Gmail. This is notification email, not mass mailing.
- Rollback: change the form URL back to Formspree.
- The admin key is never put in the website. It only lives in the Worker secret and `form-worker.json` on your laptop.
