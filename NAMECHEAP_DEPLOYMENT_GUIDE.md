<!-- @format -->

# NAMECHEAP STELLAR SHARED HOSTING DEPLOYMENT GUIDE

**Digital Scout - Production Deployment**  
**Platform:** Namecheap Stellar Shared Hosting  
**Architecture:** cPanel + Node.js + WordPress Multisite  
**Estimated Time:** 2-4 hours (experienced), 4-6 hours (first-time)

---

## TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Step 1: Prepare Codebase](#step-1-prepare-codebase)
3. [Step 2: Build Frontend](#step-2-build-frontend)
4. [Step 3: Setup Namecheap Account](#step-3-setup-namecheap-account)
5. [Step 4: Configure DNS & Domain](#step-4-configure-dns--domain)
6. [Step 5: Install & Configure WordPress](#step-5-install--configure-wordpress)
7. [Step 6: Deploy Node.js Backend](#step-6-deploy-nodejs-backend)
8. [Step 7: Deploy Frontend (React)](#step-7-deploy-frontend-react)
9. [Step 8: Connect Backend to WordPress](#step-8-connect-backend-to-wordpress)
10. [Step 9: Test APIs](#step-9-test-apis)
11. [Step 10: Post-Deployment Verification](#step-10-post-deployment-verification)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance & Updates](#maintenance--updates)

---

## PRE-DEPLOYMENT CHECKLIST

### Development Environment

- ☐ Code changes complete (no local .test domain code)
- ☐ `npm run build` succeeds without errors
- ☐ TypeScript compiles: `tsc --noEmit` (exit code 0)
- ☐ All Laragon references removed (see LOCAL_ONLY_CODE_REPORT.md)
- ☐ All tests pass locally

### Domain & Hosting

- ☐ Domain purchased (if not already)
- ☐ Namecheap Stellar account created with domain
- ☐ cPanel access credentials noted
- ☐ FTP/SSH credentials obtained from Namecheap

### API Keys & Credentials

- ☐ GEMINI_API_KEY obtained and tested
- ☐ GOOGLE_MAPS_PLATFORM_KEY obtained and tested
- ☐ VITE_NETLIFY_TOKEN obtained
- ☐ CALLHIPPO_API_KEY obtained
- ☐ Created .env.production with all values filled in
- ☐ Verified no Laragon variables in .env.production

### Planning

- ☐ Maintenance window scheduled (if deploying to existing site)
- ☐ Backups created (if applicable)
- ☐ Team informed of deployment timeline
- ☐ Rollback plan documented

---

## STEP 1: PREPARE CODEBASE

### 1.1 Remove Local-Only Code

Following [LOCAL_ONLY_CODE_REPORT.md](LOCAL_ONLY_CODE_REPORT.md):

```bash
# Verify no Laragon references
grep -r "laragon" src/ server.ts --ignore-case
# Expected: 0 matches (or only in comments/disabled code)

# Verify no .test domains
grep -r "\.test" src/ server.ts
# Expected: 0 matches (or only in comments)

# Verify no local-wordpress routes
grep -r "/api/local-wordpress" src/
# Expected: 0 matches
```

If matches found, edit files and remove those references.

### 1.2 Add Feature Flags

**In `server.ts` (around line 363):**

```typescript
// BEFORE:
app.all("/api/local-wordpress/:siteSlug", proxyLocalWordPressRequest);
app.all("/api/local-wordpress/:siteSlug/*", proxyLocalWordPressRequest);

// AFTER (remove these lines entirely - production doesn't need local proxy)
// Routes removed: /api/local-wordpress/* (local dev only)
```

Also remove the `proxyLocalWordPressRequest()` function (lines 223-360).

**In `src/lib/laragon-local-provisioner.ts` (at top, after imports):**

```typescript
if (process.env.NODE_ENV === "production") {
	throw new Error("Local provisioning not available in production");
}
```

### 1.3 Verify Frontend Build Configuration

**Check `vite.config.ts`:**

- ✅ Should pass VITE_API_URL via env
- ✅ Should define GEMINI_API_KEY and GOOGLE_MAPS_PLATFORM_KEY
- ✅ Should NOT reference localhost

**Current vite.config.ts is production-ready ✅**

### 1.4 Build and Test Locally

```bash
# Install dependencies
npm install

# Type check
npm run lint

# Build frontend
npm run build

# Check output
ls -la dist/
# Should contain: index.html, assets/

# Verify no localhost references in dist/
grep -r "localhost" dist/
# Expected: 0 matches (or only in source maps)
```

---

## STEP 2: BUILD FRONTEND

### 2.1 Create Production Build

```bash
# Build with production environment
npm run build

# Output should show:
# ✓ 1234 modules transformed
# ✓ built in 15.23s
```

### 2.2 Verify Build Output

```bash
# Check built files
du -sh dist/
# Expected: 100-300 KB

# List main assets
ls -lh dist/assets/

# Verify index.html exists
cat dist/index.html | head -20
```

### 2.3 Prepare for Upload

```bash
# Create deployment package
tar -czf digitalscout-dist.tar.gz dist/

# Create backend package (exclude node_modules)
tar -czf digitalscout-backend.tar.gz \
  --exclude=node_modules \
  --exclude=.env.local \
  --exclude=.git \
  --exclude=.debug-generation \
  --exclude=dist \
  .
```

---

## STEP 3: SETUP NAMECHEAP ACCOUNT

### 3.1 Access cPanel

1. Go to **Namecheap Dashboard** → **Account** → **Dashboard**
2. Find your hosting account → Click **Manage**
3. Click **cPanel** button
4. Log in with provided credentials
5. Save URL for future reference: `https://your-cpanel-url.com:2083`

### 3.2 Create Node.js App

**In cPanel:**

1. Go to **Setup Node.js App**
2. Click **+ Create Node.js Application**
3. Fill in:
   - **Node.js version:** 18.x or 20.x (recommended: 20.x)
   - **Application mode:** Production
   - **Application root:** `/home/username/nodesapp/digitalscout`
   - **Application URL:** Choose a port (e.g., 5001)
   - **Application startup file:** `server.ts`
4. Click **Create**
5. Note the port number assigned (usually 5001)

**cPanel will:**

- Create the application directory
- Install Node.js
- Set up process management
- Assign a port

### 3.3 Enable SSH Access (Optional but Recommended)

**In cPanel:**

1. Go to **SSH Access**
2. If disabled, click **Manage SSH Key Pairs**
3. Create or upload public key
4. Note your SSH username and host

---

## STEP 4: CONFIGURE DNS & DOMAIN

### 4.1 Point Domain to Namecheap Nameservers

**At current domain registrar:**

1. Go to Domain Management
2. Update nameservers to:
   ```
   dns1.registrar-servers.com
   dns2.registrar-servers.com
   ```
   (Exact nameservers shown in Namecheap welcome email)

Wait 24-48 hours for DNS propagation.

### 4.2 Verify DNS Resolution

```bash
# Test DNS resolution
nslookup your-domain.com
# Should show Namecheap nameservers

# Test IP address
nslookup your-domain.com | grep Address
# Should show Namecheap IP
```

---

## STEP 5: INSTALL & CONFIGURE WORDPRESS

### 5.1 Install WordPress via cPanel

**In cPanel:**

1. Go to **WordPress Manager** or **Softaculous**
2. Click **Install WordPress**
3. Fill in:
   - **Install location:** Root (/) or subdirectory
   - **Site name:** Your business name
   - **Site description:** Leave blank or brief
   - **Admin username:** `network-admin`
   - **Admin password:** Strong password (save this!)
   - **Admin email:** your-email@domain.com
4. Click **Install**

Wait 2-3 minutes for installation to complete.

### 5.2 Enable WordPress Multisite

**Via SSH or File Manager:**

**Edit `wp-config.php`** (via cPanel File Manager):

1. Go to **File Manager** → `public_html`
2. Find and edit `wp-config.php`
3. Add BEFORE `/* That's all, stop editing! */`:

```php
// Enable Multisite
define('WP_ALLOW_MULTISITE', true);
define('MULTISITE', true);
define('SUBDOMAIN_INSTALL', false);  // Use subpaths instead of subdomains
define('DOMAIN_CURRENT_SITE', 'your-domain.com');
define('PATH_CURRENT_SITE', '/');
define('SITE_ID_CURRENT_SITE', 1);
define('BLOG_ID_CURRENT_SITE', 1);

// Rewrite rules for multisite
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
```

### 5.3 Run WordPress Multisite Network Wizard

1. Go to **WordPress Admin** → Dashboard
2. You should see notice: "Network setup is enabled but not completed"
3. Go to **Tools** → **Network Setup**
4. Click **Install**
5. WordPress will generate `.htaccess` and extra `wp-config.php` settings
6. Copy the shown settings and paste into `wp-config.php` (replace old MULTISITE block)

### 5.4 Verify Multisite Installation

```bash
# Test WordPress homepage
curl https://your-domain.com/

# Should return HTML with WordPress content (not error)

# Test wp-admin
curl -I https://your-domain.com/wp-admin/

# Should return 200 or 302 (redirect to login)
```

### 5.5 Create Application Password for API Access

**In WordPress Admin:**

1. Log in: `https://your-domain.com/wp-admin/`
2. Go to **Users** → **Your User** (network-admin)
3. Scroll to **Application Passwords**
4. Create new: Name = "Digital Scout API"
5. Click **Generate Password**
6. Copy the generated password (looks like: `xxxx xxxx xxxx xxxx xxxx xxxx`)
7. Save to `.env.production`: `WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD=<paste here>`

---

## STEP 6: DEPLOY NODE.JS BACKEND

### 6.1 Upload Backend Code

**Via SSH (recommended):**

```bash
# From your local machine
scp -r . username@your-cpanel-host.com:~/nodesapp/digitalscout/

# Or if using key:
scp -i ~/.ssh/id_rsa -r . username@your-cpanel-host.com:~/nodesapp/digitalscout/
```

**Or via cPanel File Manager:**

1. Go to **File Manager** → **nodesapp** → **digitalscout**
2. Upload `digitalscout-backend.tar.gz`
3. Extract it

### 6.2 Install Dependencies

**Via SSH:**

```bash
ssh username@your-cpanel-host.com

# Navigate to app directory
cd ~/nodesapp/digitalscout

# Install production dependencies
npm install --production

# Verify installation
npm list --production | head -20
```

**Expected output:**

```
├── @google/genai@1.29.0
├── cors@4.4.2
├── dotenv@17.2.3
├── express@4.21.2
├── jszip@3.10.1
├── mysql2@3.9.0
└── (other dependencies)
```

### 6.3 Create .env.production File

**Via SSH:**

```bash
cd ~/nodesapp/digitalscout
nano .env.production
```

**Paste contents from `.env.production.example`** with actual values filled in:

```
NODE_ENV=production
PORT=5001
APP_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
GEMINI_API_KEY=...
(etc.)
```

**Save:** `Ctrl+X` → `Y` → `Enter`

### 6.4 Start Node.js App

**Via cPanel Node.js App Manager:**

1. Go back to cPanel → **Setup Node.js App**
2. Find your application
3. Click **Restart**

**Status check via SSH:**

```bash
# Check if process is running
pm2 list

# Or via http
curl -I https://your-domain.com/api/health

# Expected: 200 OK (or your backend response)
```

---

## STEP 7: DEPLOY FRONTEND (REACT)

### 7.1 Upload Frontend Files

**Via cPanel File Manager:**

1. Go to **File Manager** → **public_html**
2. Delete existing `index.html` and `assets/` (if any)
3. Upload `digitalscout-dist.tar.gz`
4. Right-click → **Extract**
5. Select all files from extracted `dist/` folder
6. Move to `public_html/` root

**Final structure should be:**

```
public_html/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
├── wp/          (WordPress installation)
├── wp-config.php
└── (WordPress files)
```

### 7.2 Configure .htaccess for SPA Routing

**Via File Manager:**

1. Edit `public_html/.htaccess`
2. Add/replace with:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Skip actual files and directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Don't rewrite WordPress or Node.js API
  RewriteCond %{REQUEST_URI} !^/wp(/|$)
  RewriteCond %{REQUEST_URI} !^/api(/|$)

  # Route all other requests to index.html for SPA routing
  RewriteRule ^(.*)$ /index.html [L]
</IfModule>
```

---

## STEP 8: CONNECT BACKEND TO WORDPRESS

### 8.1 Verify WordPress Multisite API

**Test WordPress REST API:**

```bash
# Test basic connection
curl -I https://your-domain.com/wp-json/

# Expected: 200 OK with JSON response

# Test authentication
curl -u "network-admin:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://your-domain.com/wp-json/wp/v2/users/me

# Expected: 200 OK with user data
```

### 8.2 Test Backend Connection to WordPress

**Via SSH:**

```bash
cd ~/nodesapp/digitalscout

# Test API endpoint
curl -X GET https://localhost:5001/api/health

# Expected: {"status":"ok"}

# Test WordPress connection
curl -X GET \
  -H "Authorization: Bearer token" \
  https://localhost:5001/api/wordpress/test
```

### 8.3 Update .env.production

Verify these are correct in `.env.production`:

```
WORDPRESS_MULTISITE_BASE_URL=https://your-domain.com
WORDPRESS_MULTISITE_NETWORK_USERNAME=network-admin
WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

**Restart Node.js app** after any .env changes:

- cPanel → Setup Node.js App → Find app → Restart

---

## STEP 9: TEST APIs

### 9.1 Test Health Endpoint

```bash
# Frontend accessible
curl -I https://your-domain.com/

# Expected: 200 OK (serves index.html)

# Backend health check
curl -I https://your-domain.com/api/health

# Expected: 200 OK
```

### 9.2 Test WordPress Provisioning

**Via cPanel File Manager:**

1. Edit `server.ts` to add a test route (temporary):

```typescript
app.post("/api/test-wordpress", async (req, res) => {
	try {
		const response = await fetch(
			`${process.env.WORDPRESS_MULTISITE_BASE_URL}/wp-json/wp/v2/users/me`,
			{
				headers: {
					Authorization:
						"Basic " +
						Buffer.from(
							`${process.env.WORDPRESS_MULTISITE_NETWORK_USERNAME}:${process.env.WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD}`,
						).toString("base64"),
				},
			},
		);
		const data = await response.json();
		return res.json({ success: true, user: data.name });
	} catch (error) {
		return res.json({ success: false, error: error.message });
	}
});
```

**Test:**

```bash
curl https://your-domain.com/api/test-wordpress

# Expected: {"success":true,"user":"network-admin"}
```

### 9.3 Test Website Generation

**Via browser or curl:**

```bash
# POST request to generate website
curl -X POST https://your-domain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "category": "Salon",
    "address": "123 Main St",
    "description": "A test business"
  }'

# Expected: Returns WebsiteSchema JSON with website content
```

### 9.4 Test Netlify Deployment

```bash
curl -X POST https://your-domain.com/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "websiteContent": "<html><body>Test</body></html>",
    "businessName": "Test Business"
  }'

# Expected: Returns {"deployedUrl":"https://...","siteId":"..."}
```

---

## STEP 10: POST-DEPLOYMENT VERIFICATION

### 10.1 Full User Flow Test

1. **Open app in browser:** `https://your-domain.com`
2. **Search for a business** (via Google Maps)
3. **Click a business marker**
4. **Click "Generate Website"** button
5. **Wait for generation** (5-30 seconds depending on Gemini API)
6. **Verify preview loads** with website content
7. **Click "Deploy to Netlify"**
8. **Verify "View Live Site"** button appears with URL
9. **Click deployed URL** - should show generated website on Netlify
10. **Click "Send Outreach"** (SMS/WhatsApp)
11. **Verify message sends** (check CallHippo dashboard)

### 10.2 Check Logs

**Via SSH:**

```bash
# Check Node.js application logs
pm2 logs digitalscout

# Check WordPress error logs
tail -f ~/public_html/wp-content/debug.log

# Check cPanel error logs
tail -f ~/logs/error_log
```

### 10.3 Monitor Performance

**Check resource usage:**

- CPU: Should be low at idle (<5%)
- Memory: Should be < 200MB for backend
- Database: Should respond in < 1 second

**In cPanel:**

1. Go to **Resource Usage**
2. Monitor CPU, memory, disk usage
3. Set alerts if needed

### 10.4 Security Verification

```bash
# Check HTTPS is enforced
curl -I http://your-domain.com

# Expected: 301 Redirect to HTTPS

# Check API keys are not exposed
curl https://your-domain.com/
# Check HTML source - should NOT contain API keys

# Check .env is not readable
curl https://your-domain.com/.env.production

# Expected: 404 Not Found
```

---

## TROUBLESHOOTING

### Issue: Node.js App Not Starting

**Symptoms:**

- Backend returns 502 Bad Gateway
- cPanel shows "Stopped" status

**Solutions:**

```bash
# 1. Check for syntax errors
npm run lint

# 2. Test locally
npm run dev:server

# 3. Check logs via SSH
pm2 logs --lines 50

# 4. Restart via cPanel
# Go to Setup Node.js App → Click app → Restart

# 5. Check port is not blocked
netstat -an | grep 5001
```

### Issue: WordPress API Returns 401 Unauthorized

**Symptoms:**

- Backend cannot provision sites
- WordPress API returns 401 errors

**Solutions:**

```bash
# 1. Verify credentials in .env.production
echo $WORDPRESS_MULTISITE_NETWORK_USERNAME
echo $WORDPRESS_MULTISITE_NETWORK_APP_PASSWORD

# 2. Test credential manually
curl -u "network-admin:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://your-domain.com/wp-json/wp/v2/users/me

# 3. If fails, regenerate application password:
#    WordPress Admin → Users → Your User → Application Passwords
#    Delete old "Digital Scout API" password
#    Create new one
#    Update .env.production
#    Restart Node.js app

# 4. Check WordPress REST API is enabled
curl https://your-domain.com/wp-json/

# Should return JSON, not 404
```

### Issue: Frontend Shows Blank Page

**Symptoms:**

- Browser shows blank white page
- Console shows 404 for assets

**Solutions:**

```bash
# 1. Check index.html is in public_html
file ~/public_html/index.html

# 2. Check assets folder exists
ls -la ~/public_html/assets/

# 3. Check .htaccess is correct
cat ~/public_html/.htaccess

# 4. Check VITE_API_URL in index.html
grep -i "api" ~/public_html/index.html | head -3

# 5. If still blank, rebuild and redeploy
npm run build
# (Upload dist/ folder again)
```

### Issue: Gemini API Returns Error

**Symptoms:**

- Website generation fails
- Error: "Invalid API key" or "Quota exceeded"

**Solutions:**

```bash
# 1. Verify API key format
echo $GEMINI_API_KEY | wc -c
# Should be 50+ characters

# 2. Test API key directly
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY

# 3. Check API quota
# Go to Google Cloud Console → Gemini API → Quotas

# 4. If over quota, wait 24 hours or upgrade plan

# 5. As fallback, set mode to template:
# Edit .env.production
# Set: WEBSITE_GENERATION_MODE=template
# Restart Node.js app
```

### Issue: SSL Certificate Errors

**Symptoms:**

- Browser shows "Not Secure"
- curl returns certificate validation error

**Solutions:**

```bash
# 1. Check certificate status in cPanel
# Go to AutoSSL → Check Status

# 2. If not installed, install manually
# Go to AutoSSL → Check Now → Install

# 3. If domain mismatch, check cPanel domain settings
# Go to Addon Domains → Verify domain is added

# 4. Wait 10 minutes for Let's Encrypt to issue certificate

# 5. Test certificate
openssl s_client -connect your-domain.com:443

# Should show certificate details without errors
```

---

## MAINTENANCE & UPDATES

### Daily Checks

- Monitor error logs for exceptions
- Check Node.js app status in cPanel
- Verify WordPress backups are running

### Weekly Checks

- Review resource usage (CPU, memory, disk)
- Check failed API requests
- Monitor Gemini API quota usage

### Monthly Updates

```bash
# Update Node.js dependencies
npm update

# Deploy updates
# 1. Test locally: npm run build && npm run dev
# 2. Upload changed files via SCP or cPanel File Manager
# 3. Restart Node.js app in cPanel

# Update WordPress plugins & themes
# WordPress Admin → Updates → Install
```

### Backup Strategy

**Via cPanel:**

1. Go to **Backup** → **Download a Full Backup**
2. Download weekly full backup
3. Store in secure location
4. Keep at least 4 weeks of backups

**Script for automated backups:**

```bash
#!/bin/bash
# Save as ~/backup-weekly.sh
cd ~
tar -czf backup-$(date +%Y-%m-%d).tar.gz \
  public_html/ \
  nodesapp/ \
  .env.production \
  --exclude=node_modules \
  --exclude=.debug-generation

# Upload to external storage
# Or setup cron job to run weekly
```

### Monitoring & Alerts

**In cPanel:**

1. Go to **Metrics** → **Setup Monitoring**
2. Set alerts for:
   - CPU > 80%
   - Memory > 90%
   - Disk space > 90%
   - Failed API requests

---

## DEPLOYMENT COMPLETE ✅

**After following all steps:**

1. ✅ Frontend loads at `https://your-domain.com`
2. ✅ Backend API responds to requests
3. ✅ WordPress Multisite configured
4. ✅ Website generation working
5. ✅ Netlify deployments working
6. ✅ CallHippo outreach working

**Next steps:**

- Test thoroughly with real data
- Train team on how to use
- Setup monitoring & backups
- Plan Phase 2 features

**Questions?** Check LOCAL_ONLY_CODE_REPORT.md or contact Namecheap support.
