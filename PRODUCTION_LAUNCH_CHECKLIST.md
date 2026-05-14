# Production Launch Checklist

Follow this checklist to ensure a smooth, error-free launch of the Digital Scout application on Namecheap.

## 1. GitHub & Version Control
- [ ] Codebase is clean: No local secrets committed (`.env.local`).
- [ ] `.gitignore` is properly configured (ignoring `.debug-generation`, `node_modules`, `dist`, temp files).
- [ ] All code is merged into the `main` branch.
- [ ] `main` branch is pushed to the remote repository.

## 2. cPanel & Environment Setup
- [ ] SSH access is enabled and tested.
- [ ] Application directory (`~/nodesapp/digitalscout`) is created.
- [ ] Repository is successfully cloned to the application directory via SSH.
- [ ] Dependencies are installed (`npm install`).

## 3. Environment Variables (`.env.production`)
- [ ] `.env.production` file is created in `~/nodesapp/digitalscout`.
- [ ] `NODE_ENV=production` is set.
- [ ] `APP_URL` and `VITE_API_URL` are configured with the correct HTTPS Namecheap domain.
- [ ] `GEMINI_API_KEY` is present and valid.
- [ ] `GOOGLE_MAPS_PLATFORM_KEY` is present and valid.
- [ ] `VITE_NETLIFY_TOKEN` is present and valid.
- [ ] WordPress Multisite credentials (`WORDPRESS_MULTISITE_BASE_URL`, `WORDPRESS_MULTISITE_NETWORK_USERNAME`, `WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD`) are correct.
- [ ] All Laragon/localhost variables have been removed.

## 4. Frontend Build & Deployment
- [ ] `npm run build` executes without errors.
- [ ] `dist/index.html` and `dist/assets/` are copied to `~/public_html/`.
- [ ] `.htaccess` is configured in `public_html` to route SPA traffic to `index.html` (excluding `/wp` and `/api`).
- [ ] SSL certificate is active for the domain (HTTPS works).

## 5. Node.js App Setup
- [ ] Node.js application is created in cPanel **Setup Node.js App**.
- [ ] Node.js version is set to 18.x or 20.x.
- [ ] Application mode is set to "Production".
- [ ] Application startup file is set to `server.ts` (using the `npm start` script pointing to `npx tsx server.ts`).
- [ ] Application is started/restarted successfully.

## 6. WordPress Setup
- [ ] WordPress is installed via Softaculous/cPanel.
- [ ] Multisite is enabled via `wp-config.php` and `.htaccess`.
- [ ] Network Admin account is created.
- [ ] Application Password for the Network Admin is generated and added to `.env.production`.
- [ ] The base theme (`digital-scout-base-theme`) is installed and network-enabled.

## 7. Testing & Verification
- [ ] **Health Check**: Load `https://your-domain.com/api/health` - should return 200 OK.
- [ ] **Frontend Load**: Load `https://your-domain.com` - UI should render without console errors.
- [ ] **Map API**: Business search map loads and displays markers correctly.
- [ ] **Website Generation**: Generate a test website - should complete without timeouts or Gemini API errors.
- [ ] **WordPress Sync**: The generated website successfully creates a subsite and pages in the WordPress Multisite network.
- [ ] **Netlify Deploy**: The "Deploy to Netlify" button successfully creates a live static site.
- [ ] **Outreach (CallHippo)**: (Optional) Sending a test outreach message works.
