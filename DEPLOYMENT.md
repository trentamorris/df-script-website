# Website Deployment Guide (Vercel CLI)

This website is built with Vite and React, configured to deploy seamlessly to **Vercel**.

---

### Step 1: Log in to Vercel (First time only)
In your terminal, log in to Vercel:
```bash
npx vercel login
```
*(Select **Email** or **GitHub** to authenticate).*

---

### Step 2: Deploy to Production
To compile and publish the website live:
```bash
npm run deploy
```
*(Or use `npx vercel --prod --yes`)*

---

### Step 3: Configure Custom Domains
To bind custom domains to your Vercel project:

1. Open your project on the Vercel Dashboard.
2. Go to **Settings > Domains**.
3. Add your custom domain (e.g. `df-script.js.org`).
4. Update the DNS records at your domain registrar or provider:
   - For subdomains (like `df-script.js.org`): CNAME to `cname.vercel-dns.com` (or `cname.vercel-dns-01.com`).

---

### Single-Page Routing Note
Vercel is pre-configured via the root `vercel.json` file to rewrite all sub-paths (like `/notebook`, `/about`) to `index.html`. This ensures browser refreshes on subpages do not trigger 404 errors.
